//! Scout for `LoL` Desktop Application
//!
//! A Tauri-based desktop client for monitoring League of Legends games
//! and posting live updates to Discord channels.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![warn(missing_docs, clippy::all, clippy::pedantic, clippy::nursery)]
#![allow(
    clippy::missing_errors_doc,
    clippy::missing_panics_doc,
    clippy::uninlined_format_args,
    clippy::doc_markdown,
    clippy::cognitive_complexity,
    clippy::too_many_lines,
    clippy::map_unwrap_or,
    clippy::unused_self,
    clippy::significant_drop_tightening,
    clippy::redundant_closure_for_method_calls,
    clippy::useless_format,
    clippy::cast_possible_truncation,
    clippy::cast_sign_loss,
    clippy::option_if_let_else,
    // Pre-existing issues to be fixed in a separate PR
    dead_code,
    clippy::struct_excessive_bools,
    clippy::single_match,
    clippy::single_match_else,
    clippy::missing_const_for_fn,
    clippy::used_underscore_binding
)]

mod config;
mod discord;
mod events;
mod live_client;
mod paths;
mod preview;
mod sound_pack;

// Keep lcu module for backwards compatibility during transition
mod lcu;

#[cfg(test)]
mod tests;

use log::{error, info};
use std::collections::HashMap;
use std::io::Write;
use std::sync::Arc;
use tauri::{Emitter, Manager, State};
use tokio::sync::Mutex;
use tokio::time::{timeout, Duration};

/// Appends a message to the startup log.
/// Before paths are initialized, falls back to current directory.
fn append_startup_log(message: &str) {
    // Try to use the centralized path if initialized, otherwise fall back to cwd
    let path = if let Some(app_dir) = paths::try_app_data_dir() {
        app_dir.join("logs").join("startup-log.txt")
    } else if let Ok(cwd) = std::env::current_dir() {
        cwd.join("startup-log.txt")
    } else {
        return;
    };

    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
    {
        let _ = writeln!(file, "{}", message);
    }
}

struct AppState {
    lcu_connection: Arc<Mutex<Option<lcu::LcuConnection>>>,
    discord_client: Arc<Mutex<Option<discord::DiscordClient>>>,
    is_monitoring: Arc<Mutex<bool>>,
}

#[tauri::command]
async fn get_lcu_status(state: State<'_, AppState>) -> Result<lcu::LcuStatus, String> {
    let connection = state.lcu_connection.lock().await;
    match connection.as_ref() {
        Some(conn) => Ok(conn.get_status().await),
        None => Ok(lcu::LcuStatus {
            connected: false,
            summoner_name: None,
            in_game: false,
        }),
    }
}

#[tauri::command]
async fn connect_lcu(state: State<'_, AppState>) -> Result<(), String> {
    info!("Attempting to connect to League Client...");

    match lcu::LcuConnection::new().await {
        Ok(connection) => {
            info!("Successfully connected to League Client");
            let mut lcu = state.lcu_connection.lock().await;
            *lcu = Some(connection);
            Ok(())
        }
        Err(e) => {
            error!("Failed to connect to League Client: {}", e);
            Err(format!("Failed to connect to League Client: {e}"))
        }
    }
}

#[tauri::command]
async fn disconnect_lcu(state: State<'_, AppState>) -> Result<(), String> {
    info!("Disconnecting from League Client...");
    let mut lcu = state.lcu_connection.lock().await;
    *lcu = None;
    Ok(())
}

#[tauri::command]
async fn configure_discord(
    bot_token: String,
    channel_id: String,
    voice_channel_id: Option<String>,
    sound_pack: Option<String>,
    event_sounds: Option<HashMap<String, String>>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    info!("Configuring Discord client...");

    // Save the provided settings locally right away so new fields persist even if setup fails
    {
        let cfg = config::Config {
            bot_token: Some(bot_token.clone()),
            channel_id: Some(channel_id.clone()),
            voice_channel_id: voice_channel_id.clone(),
            sound_pack: sound_pack.clone(),
            event_sounds: event_sounds.clone(),
        };
        cfg.save(&paths::config_file())?;
    }

    match timeout(
        Duration::from_secs(12),
        discord::DiscordClient::new(
            bot_token.clone(),
            channel_id.clone(),
            voice_channel_id.clone(),
            sound_pack.clone(),
            event_sounds.clone(),
        ),
    )
    .await
    .map_err(|_| "Discord setup timed out".to_string())?
    {
        Ok(client) => {
            info!("Successfully configured Discord client");

            let mut discord = state.discord_client.lock().await;
            *discord = Some(client);
            drop(discord);
            Ok(())
        }
        Err(e) => {
            error!("Failed to configure Discord client: {}", e);
            Err(format!("Failed to configure Discord: {e}"))
        }
    }
}

#[tauri::command]
async fn get_discord_status(state: State<'_, AppState>) -> Result<discord::DiscordStatus, String> {
    let client = state.discord_client.lock().await;
    Ok(client.as_ref().map_or(
        discord::DiscordStatus {
            connected: false,
            channel_name: None,
            voice_connected: false,
            voice_channel_name: None,
            active_sound_pack: None,
        },
        discord::DiscordClient::get_status,
    ))
}

#[tauri::command]
async fn join_discord_voice(
    voice_channel_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut guard = state.discord_client.lock().await;
    let client = guard.as_mut().ok_or("Discord not configured")?;

    if voice_channel_id.is_some() {
        client.set_voice_channel_id(voice_channel_id);
    }

    client.ensure_voice_connected().await?;
    // Play a short test sound so the user can verify audio path
    client
        .play_sound_for_event(discord::SoundEvent::GameStart, None)
        .await?;
    Ok(())
}

#[tauri::command]
async fn play_test_sound(
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let guard = state.discord_client.lock().await;
    let client = guard.as_ref().ok_or("Discord not configured")?;
    client
        .play_sound_for_event(discord::SoundEvent::GameStart, Some(&app_handle))
        .await
}

#[derive(serde::Serialize)]
struct LogPaths {
    /// Directory containing all log files
    logs_dir: String,
    /// Main debug log file path
    debug_log: String,
    /// Startup diagnostics log path
    startup_log: String,
}

#[tauri::command]
async fn get_log_paths() -> Result<LogPaths, String> {
    Ok(LogPaths {
        logs_dir: paths::logs_dir().to_string_lossy().to_string(),
        debug_log: paths::debug_log_file().to_string_lossy().to_string(),
        startup_log: paths::startup_log_file().to_string_lossy().to_string(),
    })
}

#[tauri::command]
async fn start_monitoring(
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    info!("Starting game monitoring...");

    let mut is_monitoring = state.is_monitoring.lock().await;
    if *is_monitoring {
        return Err("Monitoring is already active".to_string());
    }

    // Test event emission
    if let Err(e) = app_handle.emit("backend-log", "🚀 Monitoring command received!") {
        error!("Failed to emit test event: {}", e);
    }

    // Start the event monitoring
    events::start_event_monitoring(
        state.lcu_connection.clone(),
        state.discord_client.clone(),
        app_handle,
    )
    .await?;

    *is_monitoring = true;
    drop(is_monitoring);
    info!("Game monitoring started");
    Ok(())
}

#[tauri::command]
async fn stop_monitoring(state: State<'_, AppState>) -> Result<(), String> {
    info!("Stopping game monitoring...");

    let mut is_monitoring = state.is_monitoring.lock().await;
    if !*is_monitoring {
        return Err("Monitoring is not active".to_string());
    }

    *is_monitoring = false;
    drop(is_monitoring);
    // TODO: Implement graceful shutdown of WebSocket connection
    info!("Game monitoring stopped");
    Ok(())
}

#[tauri::command]
async fn get_monitoring_status(state: State<'_, AppState>) -> Result<bool, String> {
    let is_monitoring = state.is_monitoring.lock().await;
    Ok(*is_monitoring)
}

#[tauri::command]
async fn load_config() -> Result<config::Config, String> {
    let config_path = paths::config_file();
    info!("Loading config from {}", config_path.display());
    Ok(config::Config::load(&config_path))
}

#[derive(serde::Serialize)]
struct DiagnosticInfo {
    gameflow_phase: String,
    live_client_data_available: bool,
    live_client_data_status: Option<u16>,
    error_message: Option<String>,
}

#[derive(serde::Serialize)]
struct EventTestResult {
    success: bool,
    event_count: usize,
    events_found: Vec<String>,
    error_message: Option<String>,
    raw_data_keys: Option<Vec<String>>,
}

#[derive(serde::Serialize)]
#[allow(dead_code)]
struct PollingStatusResult {
    is_polling: bool,
    last_poll_attempted: bool,
    events_in_queue: usize,
    highest_event_id_seen: Option<i64>,
    message: String,
}

#[tauri::command]
#[allow(clippy::significant_drop_tightening)]
async fn get_diagnostics(state: State<'_, AppState>) -> Result<DiagnosticInfo, String> {
    let lcu_guard = state.lcu_connection.lock().await;
    let lcu = lcu_guard.as_ref().ok_or("LCU not connected")?;

    // Check gameflow phase
    let phase_response = lcu.get("/lol-gameflow/v1/gameflow-phase").await;
    let gameflow_phase = match phase_response {
        Ok(resp) if resp.status().is_success() => resp
            .text()
            .await
            .unwrap_or_else(|_| "unknown".to_string())
            .trim_matches('"')
            .to_string(),
        _ => "unknown".to_string(),
    };

    // Check Live Client Data API
    let live_client_response = lcu.get("/liveclientdata/allgamedata").await;
    let (live_client_data_available, live_client_data_status) = match live_client_response {
        Ok(resp) => (resp.status().is_success(), Some(resp.status().as_u16())),
        Err(e) => {
            return Ok(DiagnosticInfo {
                gameflow_phase,
                live_client_data_available: false,
                live_client_data_status: None,
                error_message: Some(format!("Failed to reach endpoint: {e}")),
            });
        }
    };

    Ok(DiagnosticInfo {
        gameflow_phase,
        live_client_data_available,
        live_client_data_status,
        error_message: None,
    })
}

#[tauri::command]
#[allow(clippy::significant_drop_tightening)]
async fn test_event_detection(state: State<'_, AppState>) -> Result<EventTestResult, String> {
    let lcu_guard = state.lcu_connection.lock().await;
    let lcu = lcu_guard.as_ref().ok_or("LCU not connected")?;

    // Try the dedicated events endpoint first
    let events_response = lcu.get("/liveclientdata/eventdata").await;

    if let Ok(resp) = events_response {
        if resp.status().is_success() {
            if let Ok(data) = resp.json::<serde_json::Value>().await {
                if let Some(events_array) = data.get("Events").and_then(|v| v.as_array()) {
                    let events_found: Vec<String> = events_array
                        .iter()
                        .filter_map(|e| {
                            e.get("EventName")
                                .and_then(serde_json::Value::as_str)
                                .map(str::to_string)
                        })
                        .collect();

                    return Ok(EventTestResult {
                        success: true,
                        event_count: events_array.len(),
                        events_found,
                        error_message: None,
                        raw_data_keys: None,
                    });
                }
            }
        }
    }

    // Fallback to allgamedata endpoint
    let all_data_response = lcu.get("/liveclientdata/allgamedata").await;
    match all_data_response {
        Ok(resp) if resp.status().is_success() => {
            if let Ok(data) = resp.json::<serde_json::Value>().await {
                let events_array = data
                    .get("events")
                    .and_then(serde_json::Value::as_object)
                    .and_then(|obj| obj.get("Events"))
                    .and_then(serde_json::Value::as_array)
                    .or_else(|| data.get("Events").and_then(serde_json::Value::as_array));

                if let Some(events_array) = events_array {
                    let events_found: Vec<String> = events_array
                        .iter()
                        .filter_map(|e| {
                            e.get("EventName")
                                .and_then(serde_json::Value::as_str)
                                .map(str::to_string)
                        })
                        .collect();

                    let keys: Vec<String> = data
                        .as_object()
                        .map(|o| o.keys().map(String::clone).collect())
                        .unwrap_or_default();

                    return Ok(EventTestResult {
                        success: true,
                        event_count: events_array.len(),
                        events_found,
                        error_message: None,
                        raw_data_keys: Some(keys),
                    });
                }

                let keys: Vec<String> = data
                    .as_object()
                    .map(|o| o.keys().map(String::clone).collect())
                    .unwrap_or_default();

                return Ok(EventTestResult {
                    success: false,
                    event_count: 0,
                    events_found: vec![],
                    error_message: Some("No events array found in response".to_string()),
                    raw_data_keys: Some(keys),
                });
            }
            Ok(EventTestResult {
                success: false,
                event_count: 0,
                events_found: vec![],
                error_message: Some("Failed to parse JSON response".to_string()),
                raw_data_keys: None,
            })
        }
        Ok(resp) => Ok(EventTestResult {
            success: false,
            event_count: 0,
            events_found: vec![],
            error_message: Some(format!("API returned status: {}", resp.status())),
            raw_data_keys: None,
        }),
        Err(e) => Ok(EventTestResult {
            success: false,
            event_count: 0,
            events_found: vec![],
            error_message: Some(format!("Failed to reach API: {e}")),
            raw_data_keys: None,
        }),
    }
}

// =============================================================================
// Sound Pack Editor Commands
// =============================================================================

/// Champion info returned to the frontend
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ChampionInfo {
    id: String,
    name: String,
}

/// Local player info returned to the frontend
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalPlayerInfo {
    summoner_name: String,
    champion_name: Option<String>,
    team: Option<String>,
}

#[tauri::command]
async fn get_champions() -> Result<Vec<ChampionInfo>, String> {
    // Return a list of common champions for autocomplete
    // In a full implementation, this would fetch from Data Dragon or a local cache
    let champions = vec![
        ("Aatrox", "Aatrox"),
        ("Ahri", "Ahri"),
        ("Akali", "Akali"),
        ("Akshan", "Akshan"),
        ("Alistar", "Alistar"),
        ("Amumu", "Amumu"),
        ("Anivia", "Anivia"),
        ("Annie", "Annie"),
        ("Aphelios", "Aphelios"),
        ("Ashe", "Ashe"),
        ("AurelionSol", "Aurelion Sol"),
        ("Aurora", "Aurora"),
        ("Azir", "Azir"),
        ("Bard", "Bard"),
        ("Belveth", "Bel'Veth"),
        ("Blitzcrank", "Blitzcrank"),
        ("Brand", "Brand"),
        ("Braum", "Braum"),
        ("Briar", "Briar"),
        ("Caitlyn", "Caitlyn"),
        ("Camille", "Camille"),
        ("Cassiopeia", "Cassiopeia"),
        ("Chogath", "Cho'Gath"),
        ("Corki", "Corki"),
        ("Darius", "Darius"),
        ("Diana", "Diana"),
        ("Draven", "Draven"),
        ("DrMundo", "Dr. Mundo"),
        ("Ekko", "Ekko"),
        ("Elise", "Elise"),
        ("Evelynn", "Evelynn"),
        ("Ezreal", "Ezreal"),
        ("Fiddlesticks", "Fiddlesticks"),
        ("Fiora", "Fiora"),
        ("Fizz", "Fizz"),
        ("Galio", "Galio"),
        ("Gangplank", "Gangplank"),
        ("Garen", "Garen"),
        ("Gnar", "Gnar"),
        ("Gragas", "Gragas"),
        ("Graves", "Graves"),
        ("Gwen", "Gwen"),
        ("Hecarim", "Hecarim"),
        ("Heimerdinger", "Heimerdinger"),
        ("Hwei", "Hwei"),
        ("Illaoi", "Illaoi"),
        ("Irelia", "Irelia"),
        ("Ivern", "Ivern"),
        ("Janna", "Janna"),
        ("JarvanIV", "Jarvan IV"),
        ("Jax", "Jax"),
        ("Jayce", "Jayce"),
        ("Jhin", "Jhin"),
        ("Jinx", "Jinx"),
        ("Kaisa", "Kai'Sa"),
        ("Kalista", "Kalista"),
        ("Karma", "Karma"),
        ("Karthus", "Karthus"),
        ("Kassadin", "Kassadin"),
        ("Katarina", "Katarina"),
        ("Kayle", "Kayle"),
        ("Kayn", "Kayn"),
        ("Kennen", "Kennen"),
        ("Khazix", "Kha'Zix"),
        ("Kindred", "Kindred"),
        ("Kled", "Kled"),
        ("KogMaw", "Kog'Maw"),
        ("KSante", "K'Sante"),
        ("Leblanc", "LeBlanc"),
        ("LeeSin", "Lee Sin"),
        ("Leona", "Leona"),
        ("Lillia", "Lillia"),
        ("Lissandra", "Lissandra"),
        ("Lucian", "Lucian"),
        ("Lulu", "Lulu"),
        ("Lux", "Lux"),
        ("Malphite", "Malphite"),
        ("Malzahar", "Malzahar"),
        ("Maokai", "Maokai"),
        ("MasterYi", "Master Yi"),
        ("Milio", "Milio"),
        ("MissFortune", "Miss Fortune"),
        ("Mordekaiser", "Mordekaiser"),
        ("Morgana", "Morgana"),
        ("Naafiri", "Naafiri"),
        ("Nami", "Nami"),
        ("Nasus", "Nasus"),
        ("Nautilus", "Nautilus"),
        ("Neeko", "Neeko"),
        ("Nidalee", "Nidalee"),
        ("Nilah", "Nilah"),
        ("Nocturne", "Nocturne"),
        ("Nunu", "Nunu & Willump"),
        ("Olaf", "Olaf"),
        ("Orianna", "Orianna"),
        ("Ornn", "Ornn"),
        ("Pantheon", "Pantheon"),
        ("Poppy", "Poppy"),
        ("Pyke", "Pyke"),
        ("Qiyana", "Qiyana"),
        ("Quinn", "Quinn"),
        ("Rakan", "Rakan"),
        ("Rammus", "Rammus"),
        ("RekSai", "Rek'Sai"),
        ("Rell", "Rell"),
        ("Renata", "Renata Glasc"),
        ("Renekton", "Renekton"),
        ("Rengar", "Rengar"),
        ("Riven", "Riven"),
        ("Rumble", "Rumble"),
        ("Ryze", "Ryze"),
        ("Samira", "Samira"),
        ("Sejuani", "Sejuani"),
        ("Senna", "Senna"),
        ("Seraphine", "Seraphine"),
        ("Sett", "Sett"),
        ("Shaco", "Shaco"),
        ("Shen", "Shen"),
        ("Shyvana", "Shyvana"),
        ("Singed", "Singed"),
        ("Sion", "Sion"),
        ("Sivir", "Sivir"),
        ("Skarner", "Skarner"),
        ("Smolder", "Smolder"),
        ("Sona", "Sona"),
        ("Soraka", "Soraka"),
        ("Swain", "Swain"),
        ("Sylas", "Sylas"),
        ("Syndra", "Syndra"),
        ("TahmKench", "Tahm Kench"),
        ("Taliyah", "Taliyah"),
        ("Talon", "Talon"),
        ("Taric", "Taric"),
        ("Teemo", "Teemo"),
        ("Thresh", "Thresh"),
        ("Tristana", "Tristana"),
        ("Trundle", "Trundle"),
        ("Tryndamere", "Tryndamere"),
        ("TwistedFate", "Twisted Fate"),
        ("Twitch", "Twitch"),
        ("Udyr", "Udyr"),
        ("Urgot", "Urgot"),
        ("Varus", "Varus"),
        ("Vayne", "Vayne"),
        ("Veigar", "Veigar"),
        ("Velkoz", "Vel'Koz"),
        ("Vex", "Vex"),
        ("Vi", "Vi"),
        ("Viego", "Viego"),
        ("Viktor", "Viktor"),
        ("Vladimir", "Vladimir"),
        ("Volibear", "Volibear"),
        ("Warwick", "Warwick"),
        ("Xayah", "Xayah"),
        ("Xerath", "Xerath"),
        ("XinZhao", "Xin Zhao"),
        ("Yasuo", "Yasuo"),
        ("Yone", "Yone"),
        ("Yorick", "Yorick"),
        ("Yuumi", "Yuumi"),
        ("Zac", "Zac"),
        ("Zed", "Zed"),
        ("Zeri", "Zeri"),
        ("Ziggs", "Ziggs"),
        ("Zilean", "Zilean"),
        ("Zoe", "Zoe"),
        ("Zyra", "Zyra"),
    ];

    Ok(champions
        .into_iter()
        .map(|(id, name)| ChampionInfo {
            id: id.to_string(),
            name: name.to_string(),
        })
        .collect())
}

#[tauri::command]
async fn get_local_player() -> Result<Option<LocalPlayerInfo>, String> {
    let client = live_client::LiveClientConnection::new();

    match client.get_active_player().await {
        Ok(player) => {
            // Try to get additional info from player list
            let player_list = client.get_player_list().await.ok();
            let player_info = player_list.as_ref().and_then(|list| {
                list.iter()
                    .find(|p| p.summoner_name == player.summoner_name)
            });

            Ok(Some(LocalPlayerInfo {
                summoner_name: player.summoner_name,
                champion_name: player_info.map(|p| p.champion_name.clone()),
                team: player_info.map(|p| p.team.clone()),
            }))
        }
        Err(_) => Ok(None), // Game not active
    }
}

#[tauri::command]
async fn play_preview_sound(source: sound_pack::SoundSource) -> Result<(), String> {
    preview::play_preview(source).await
}

#[tauri::command]
fn stop_preview_sound() -> Result<(), String> {
    preview::stop_preview()
}

#[tauri::command]
async fn cache_youtube_audio(url: String) -> Result<CacheResult, String> {
    info!("Caching YouTube audio: {}", url);

    // Use the actual download_youtube_to_cache implementation
    let cached_path = discord::download_youtube_to_cache(&url).await?;

    Ok(CacheResult {
        cached_path: cached_path.to_string_lossy().to_string(),
    })
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct CacheResult {
    cached_path: String,
}

#[tauri::command]
async fn get_cache_status(url: String) -> Result<String, String> {
    if discord::is_youtube_cached(&url) {
        Ok("cached".to_string())
    } else {
        Ok("not-cached".to_string())
    }
}

#[tauri::command]
async fn save_sound_pack(pack: sound_pack::SoundPack) -> Result<(), String> {
    info!("Saving sound pack: {}", pack.name);
    let sound_pack_path = paths::sound_pack_file();

    // Ensure parent directory exists
    if let Some(parent) = sound_pack_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {e}"))?;
    }

    let content = serde_json::to_string_pretty(&pack)
        .map_err(|e| format!("Failed to serialize sound pack: {e}"))?;

    std::fs::write(&sound_pack_path, content)
        .map_err(|e| format!("Failed to write sound pack: {e}"))?;

    info!("Sound pack saved to: {}", sound_pack_path.display());
    Ok(())
}

#[tauri::command]
async fn load_sound_pack() -> Result<Option<sound_pack::SoundPack>, String> {
    let sound_pack_path = paths::sound_pack_file();

    if !sound_pack_path.exists() {
        info!("No sound pack file found at: {}", sound_pack_path.display());
        return Ok(None);
    }

    let content = std::fs::read_to_string(&sound_pack_path)
        .map_err(|e| format!("Failed to read sound pack: {e}"))?;

    let pack: sound_pack::SoundPack =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse sound pack: {e}"))?;

    info!(
        "Loaded sound pack: {} from {}",
        pack.name,
        sound_pack_path.display()
    );
    Ok(Some(pack))
}

#[allow(clippy::expect_used, clippy::large_stack_frames)]
fn main() {
    // Initialize paths early so they can be used for log plugin configuration
    paths::early_init();
    paths::ensure_directories();
    paths::migrate_from_legacy();
    paths::migrate_from_roaming();

    append_startup_log("starting main()");
    std::panic::set_hook(Box::new(|info| {
        append_startup_log(&format!("panic: {info}"));
    }));

    append_startup_log("tracing skipped (using log plugin)");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Folder {
                        path: paths::logs_dir(),
                        file_name: Some("scout".into()),
                    }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                ])
                .level(log::LevelFilter::Debug)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            get_lcu_status,
            connect_lcu,
            disconnect_lcu,
            configure_discord,
            get_discord_status,
            start_monitoring,
            stop_monitoring,
            get_monitoring_status,
            load_config,
            get_diagnostics,
            test_event_detection,
            join_discord_voice,
            play_test_sound,
            get_log_paths,
            // Sound pack editor commands
            get_champions,
            get_local_player,
            play_preview_sound,
            stop_preview_sound,
            cache_youtube_audio,
            get_cache_status,
            save_sound_pack,
            load_sound_pack,
        ])
        .setup(|app| {
            append_startup_log("tauri setup()");

            // Log Tauri's app_data_dir for debugging (note: on Windows this is Roaming,
            // but we use Local via paths::compute_app_data_dir() which is already initialized)
            let tauri_app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");
            paths::init(&tauri_app_data_dir);

            append_startup_log(&format!(
                "tauri app data dir: {}",
                tauri_app_data_dir.display()
            ));
            append_startup_log(&format!(
                "actual app data dir: {}",
                paths::app_data_dir().display()
            ));

            info!("Scout for LoL Desktop starting up...");
            info!("App data directory: {}", paths::app_data_dir().display());
            info!("Config path: {}", paths::config_file().display());
            info!("Logs directory: {}", paths::logs_dir().display());

            // Initialize app state
            let app_state = AppState {
                lcu_connection: Arc::new(Mutex::new(None)),
                discord_client: Arc::new(Mutex::new(None)),
                is_monitoring: Arc::new(Mutex::new(false)),
            };

            app.manage(app_state);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
