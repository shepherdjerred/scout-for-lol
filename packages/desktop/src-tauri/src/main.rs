//! Scout for `LoL` Desktop Application
//!
//! A Tauri-based desktop client for monitoring League of Legends games
//! and posting live updates to Discord channels.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![warn(missing_docs, clippy::all, clippy::pedantic, clippy::nursery)]
#![allow(clippy::missing_errors_doc, clippy::missing_panics_doc)]

mod config;
mod discord;
mod events;
mod lcu;

#[cfg(test)]
mod tests;

use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, Manager, State};
use tokio::sync::Mutex;
use tracing::{error, info};

#[cfg(target_os = "windows")]
use std::fs;

struct AppState {
    lcu_connection: Arc<Mutex<Option<lcu::LcuConnection>>>,
    discord_client: Arc<Mutex<Option<discord::DiscordClient>>>,
    is_monitoring: Arc<Mutex<bool>>,
    config_path: PathBuf,
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
            Err(format!("Failed to connect to League Client: {}", e))
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
    state: State<'_, AppState>,
) -> Result<(), String> {
    info!("Configuring Discord client...");

    match discord::DiscordClient::new(bot_token.clone(), channel_id.clone()).await {
        Ok(client) => {
            info!("Successfully configured Discord client");

            let mut discord = state.discord_client.lock().await;
            *discord = Some(client);

            // Save config to disk
            let config = config::Config {
                bot_token: Some(bot_token),
                channel_id: Some(channel_id),
            };
            config.save(&state.config_path)?;

            Ok(())
        }
        Err(e) => {
            error!("Failed to configure Discord client: {}", e);
            Err(format!("Failed to configure Discord: {}", e))
        }
    }
}

#[tauri::command]
async fn get_discord_status(state: State<'_, AppState>) -> Result<discord::DiscordStatus, String> {
    let client = state.discord_client.lock().await;
    match client.as_ref() {
        Some(c) => Ok(c.get_status()),
        None => Ok(discord::DiscordStatus {
            connected: false,
            channel_name: None,
        }),
    }
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
async fn load_config(state: State<'_, AppState>) -> Result<config::Config, String> {
    info!("Loading config from {:?}", state.config_path);
    Ok(config::Config::load(&state.config_path))
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
                error_message: Some(format!("Failed to reach endpoint: {}", e)),
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
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string())
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
                    .and_then(|v| v.as_object())
                    .and_then(|obj| obj.get("Events"))
                    .and_then(|v| v.as_array())
                    .or_else(|| data.get("Events").and_then(|v| v.as_array()));

                if let Some(events_array) = events_array {
                    let events_found: Vec<String> = events_array
                        .iter()
                        .filter_map(|e| {
                            e.get("EventName")
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string())
                        })
                        .collect();

                    let keys: Vec<String> = data
                        .as_object()
                        .map(|o| o.keys().map(|k| k.to_string()).collect())
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
                    .map(|o| o.keys().map(|k| k.to_string()).collect())
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
            error_message: Some(format!("Failed to reach API: {}", e)),
            raw_data_keys: None,
        }),
    }
}

#[cfg(target_os = "windows")]
fn extract_embedded_dll() -> Result<(), Box<dyn std::error::Error>> {
    // Embed the DLL at compile time from resources directory
    const DLL_BYTES: &[u8] = include_bytes!("../resources/WebView2Loader.dll");

    // Get the executable's directory
    let exe_path = std::env::current_exe()
        .or_else(|_| std::env::var("CARGO_MANIFEST_DIR").map(PathBuf::from))
        .map_err(|_| "Failed to get executable path")?;

    let exe_dir = exe_path
        .parent()
        .ok_or("Failed to get executable directory")?;
    let dll_path = exe_dir.join("WebView2Loader.dll");

    // Extract DLL if it doesn't exist or is different
    let needs_extraction = match fs::read(&dll_path) {
        Ok(existing) => existing != DLL_BYTES,
        Err(_) => true, // File doesn't exist
    };

    if needs_extraction {
        fs::write(&dll_path, DLL_BYTES)
            .map_err(|e| format!("Failed to write DLL to {:?}: {}", dll_path, e))?;
        eprintln!("Extracted WebView2Loader.dll to {:?}", dll_path);
    }

    Ok(())
}

#[cfg(not(target_os = "windows"))]
#[allow(dead_code)]
fn extract_embedded_dll() -> Result<(), Box<dyn std::error::Error>> {
    // No-op on non-Windows platforms
    Ok(())
}

fn main() {
    // Extract embedded DLL FIRST on Windows - before anything else
    // This must happen before Tauri/WinRT tries to load WebView2Loader.dll
    #[cfg(target_os = "windows")]
    {
        if let Err(e) = extract_embedded_dll() {
            eprintln!("Failed to extract WebView2Loader.dll: {}", e);
            // Continue anyway - might work if DLL is already present
        }
    }

    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
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
        ])
        .setup(|app| {
            info!("Scout for LoL Desktop starting up...");

            // Get app config directory
            let config_dir = app
                .path()
                .app_config_dir()
                .expect("Failed to get app config directory");
            let config_path = config_dir.join("config.json");

            info!("Config path: {:?}", config_path);

            // Initialize app state
            let app_state = AppState {
                lcu_connection: Arc::new(Mutex::new(None)),
                discord_client: Arc::new(Mutex::new(None)),
                is_monitoring: Arc::new(Mutex::new(false)),
                config_path,
            };

            app.manage(app_state);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
