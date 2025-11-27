//! Game event monitoring and processing module

use crate::discord::{DiscordClient, SoundEvent};
use crate::lcu::LcuConnection;
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::fs::OpenOptions;
use std::io::Write;
use std::sync::Arc;
use tauri::Emitter;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::Message;
use tracing::{debug, error, info, warn};

fn debug_log(msg: &str) {
    eprintln!("[SCOUT] {}", msg);
    // Also write to a log file
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open("scout-debug.log")
    {
        let _ = writeln!(file, "{}", msg);
    }
}

/// Represents a game event that occurred in a League of Legends match
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "eventType")]
pub enum GameEvent {
    /// A new game has started
    GameStart {
        /// The game mode (e.g., "Ranked Solo/Duo")
        game_mode: String,
        /// The map name (e.g., "Summoner's Rift")
        map: String,
    },
    /// A game has ended
    GameEnd {
        /// The winning team
        winning_team: String,
        /// The game duration
        duration: String,
    },
    /// A champion kill occurred
    ChampionKill {
        /// The player who got the kill
        killer: String,
        /// The player who was killed
        victim: String,
        /// The in-game time when the kill occurred
        game_time: String,
    },
    /// A multi-kill occurred (double, triple, quadra, penta)
    MultiKill {
        /// The player who got the multi-kill
        killer: String,
        /// The type of multi-kill (e.g., "DOUBLE_KILL")
        multikill_type: String,
        /// The in-game time when the multi-kill occurred
        game_time: String,
    },
    /// An objective was taken (dragon, baron, tower, etc.)
    Objective {
        /// The team that took the objective
        team: String,
        /// The objective type
        objective: String,
        /// The in-game time when the objective was taken
        game_time: String,
    },
}

#[derive(Debug, Deserialize)]
struct LcuWebSocketMessage {
    #[serde(rename = "eventType")]
    event_type: String,
    uri: String,
    data: Value,
}

/// Tracks game state for detecting special events like first blood and ace
struct GameState {
    /// Whether first blood has occurred
    first_blood_occurred: bool,
    /// Set of player names on the enemy team (for ace detection)
    enemy_players: HashSet<String>,
    /// Map of enemy players killed recently (for ace detection) - maps victim name to kill timestamp
    #[allow(dead_code)]
    recent_kills: HashMap<String, f64>,
    /// Highest EventID we've processed (to only process new events)
    highest_processed_event_id: Option<i64>,
    /// Last time we warned about API unavailability (to throttle warnings)
    last_api_warning: Option<std::time::Instant>,
}

async fn play_sound(discord: &DiscordClient, event: SoundEvent, app_handle: &tauri::AppHandle) {
    if let Err(err) = discord.play_sound_for_event(event, Some(app_handle)).await {
        warn!("Failed to play sound for {:?}: {}", event, err);
        let _ = app_handle.emit(
            "backend-log",
            format!("🔇 Sound error for {:?}: {}", event, err),
        );
    } else {
        let _ = app_handle.emit(
            "backend-log",
            format!("🔊 Queued sound for {:?}", event),
        );
    }
}

/// Starts monitoring game events and posting to Discord
pub async fn start_event_monitoring(
    lcu: Arc<Mutex<Option<LcuConnection>>>,
    discord: Arc<Mutex<Option<DiscordClient>>>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    info!("Starting event monitoring...");

    let lcu_conn = {
        let guard = lcu.lock().await;
        guard
            .as_ref()
            .ok_or_else(|| "LCU not connected".to_string())?
            .clone()
    };

    let discord_client = {
        let guard = discord.lock().await;
        guard
            .as_ref()
            .ok_or_else(|| "Discord not configured".to_string())?
            .clone()
    };

    // Spawn background tasks for WebSocket monitoring and live game data polling
    let lcu_for_polling = lcu_conn.clone();
    let discord_for_polling = discord_client.clone();
    let app_handle_for_polling = app_handle.clone();

    let app_handle_for_ws = app_handle.clone();
    tokio::spawn(async move {
        if let Err(e) = run_event_loop(lcu_conn, discord_client, app_handle_for_ws).await {
            error!("Event monitoring WebSocket failed: {}", e);
        }
    });

    // Spawn live game data polling task
    tokio::spawn(async move {
        info!("Live game data polling task spawned");
        debug_log("=== POLLING TASK SPAWNED ===");
        let _ = app_handle_for_polling.emit("backend-log", "Polling task started");
        if let Err(e) =
            poll_live_game_data(lcu_for_polling, discord_for_polling, app_handle_for_polling).await
        {
            error!("Live game data polling failed: {}", e);
            debug_log(&format!("POLLING FAILED: {}", e));
        }
    });

    Ok(())
}

async fn run_event_loop(
    lcu: LcuConnection,
    discord: DiscordClient,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    info!("Connecting to LCU WebSocket...");

    let ws_url = lcu.get_websocket_url();
    let auth_header = lcu.get_auth_header();

    // Create WebSocket request with authentication
    let mut request = ws_url
        .into_client_request()
        .map_err(|e| format!("Failed to create WebSocket request: {}", e))?;

    request.headers_mut().insert(
        "Authorization",
        auth_header
            .parse()
            .map_err(|e| format!("Failed to parse auth header: {e}"))?,
    );

    // Connect with TLS disabled (self-signed cert)
    let _connector = tokio_tungstenite::Connector::NativeTls(
        native_tls::TlsConnector::builder()
            .danger_accept_invalid_certs(true)
            .build()
            .map_err(|e| format!("Failed to create TLS connector: {}", e))?,
    );

    // TODO: Use connector with connect_async to properly handle self-signed certs
    let (ws_stream, _) = connect_async(request)
        .await
        .map_err(|e| format!("WebSocket connection failed: {}", e))?;

    info!("Connected to LCU WebSocket");

    let (mut write, mut read) = ws_stream.split();

    // Subscribe to game events
    // Note: Kill, multikill, and objective events may come through gameflow-phase
    // or require additional subscriptions to /lol-gameflow/v1/gameflow-phase
    let subscriptions = vec![
        json_message(5, "/lol-gameflow/v1/gameflow-phase"),
        json_message(5, "/lol-champ-select/v1/session"),
        json_message(5, "/lol-end-of-game/v1/eog-stats-block"),
    ];

    for sub in subscriptions {
        write
            .send(Message::Text(sub.into()))
            .await
            .map_err(|e| format!("Failed to subscribe: {}", e))?;
    }

    info!("Subscribed to game events");

    // Listen for events
    while let Some(message) = read.next().await {
        match message {
            Ok(Message::Text(text)) => {
                debug!("Received WebSocket message: {}", text);

                if let Ok(ws_msg) = serde_json::from_str::<LcuWebSocketMessage>(&text) {
                        if let Err(e) = handle_event(&ws_msg, &discord, &app_handle).await {
                            warn!("Failed to handle event: {}", e);
                        }
                    }
            }
            Ok(Message::Close(_)) => {
                info!("WebSocket closed");
                break;
            }
            Err(e) => {
                error!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }

    Ok(())
}

fn json_message(opcode: u8, path: &str) -> String {
    format!(r#"[{}, "{}"]"#, opcode, path)
}

/// Polls the live game data endpoint for real-time kill events
async fn poll_live_game_data(
    lcu: LcuConnection,
    discord: DiscordClient,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let game_state = Arc::new(Mutex::new(GameState {
        first_blood_occurred: false,
        enemy_players: HashSet::new(),
        recent_kills: HashMap::new(),
        highest_processed_event_id: None,
        last_api_warning: None,
    }));

    info!("Starting live game data polling loop...");
    debug_log("Starting polling loop");
    loop {
        // Poll every 2 seconds
        sleep(Duration::from_secs(2)).await;
        debug!("Polling cycle started...");
        debug_log("Poll cycle...");

        // Try to process live game data (port 2999 - only available during active game)
        debug_log("Calling process_live_game_data...");
        match process_live_game_data(&lcu, &discord, &game_state, &app_handle).await {
            Ok(()) => {
                debug_log("Process succeeded");
            }
            Err(e) => {
                debug_log(&format!("Live Client Data API error: {}", e));

                // Throttle warnings to once per minute
                let mut state = game_state.lock().await;
                let should_warn = state
                    .last_api_warning
                    .map(|t| t.elapsed().as_secs() > 60)
                    .unwrap_or(true);

                if should_warn {
                    debug_log(&format!(
                        "No active game - Live Client Data API not available: {}",
                        e
                    ));
                    state.last_api_warning = Some(std::time::Instant::now());
                }
            }
        }
    }
}

/// Processes live game data to detect kills, first blood, and ace
async fn process_live_game_data(
    _lcu: &LcuConnection,
    discord: &DiscordClient,
    game_state: &Arc<Mutex<GameState>>,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    debug_log("process_live_game_data called");

    // Create HTTP client that ignores SSL errors (Live Client Data API uses self-signed cert)
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Live Client Data API is always on port 2999
    let base_url = "https://127.0.0.1:2999";

    // Try the dedicated events endpoint first
    debug_log("Trying /liveclientdata/eventdata...");
    let response = match client
        .get(format!("{}/liveclientdata/eventdata", base_url))
        .send()
        .await
    {
        Ok(resp) if resp.status().is_success() => {
            info!("Using /liveclientdata/eventdata endpoint");
            debug_log("eventdata endpoint succeeded");
            resp
        }
        Err(e) => {
            // Fallback to allgamedata
            debug_log(&format!("eventdata failed: {}, trying allgamedata", e));
            match client
                .get(format!("{}/liveclientdata/allgamedata", base_url))
                .send()
                .await
            {
                Ok(r) => r,
                Err(e2) => {
                    debug_log(&format!("allgamedata ALSO failed: {}", e2));
                    return Err(format!(
                        "Live Client Data API not available (game not active?)"
                    ));
                }
            }
        }
        Ok(resp) => {
            // Not successful, try allgamedata
            debug_log(&format!(
                "eventdata status: {}, trying allgamedata",
                resp.status()
            ));
            match client
                .get(format!("{}/liveclientdata/allgamedata", base_url))
                .send()
                .await
            {
                Ok(r) => r,
                Err(e) => {
                    debug_log(&format!("allgamedata failed: {}", e));
                    return Err(format!("Live Client Data API not available"));
                }
            }
        }
    };

    if !response.status().is_success() {
        // Endpoint might not be available - this is common if Live Client Data API is disabled
        warn!("Live game data endpoint not available (status: {}). Make sure 'Enable Live Client Data' is enabled in League Client settings.", response.status());
        return Ok(());
    }

    let data: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse live game data: {}", e))?;

    info!("Fetched live game data, checking for events...");

    // Log the structure of the response for debugging
    if let Some(events_obj) = data.get("events") {
        info!("Events object found, type: {:?}", events_obj);
        if let Some(events_array) = events_obj.get("Events").and_then(|v| v.as_array()) {
            info!("Found {} events in Events array", events_array.len());
        } else {
            warn!(
                "Events.Events is not an array. Events structure: {:?}",
                events_obj
            );
        }
    } else {
        warn!(
            "No 'events' key found in live game data. Available keys: {:?}",
            data.as_object().map(|o| o.keys().collect::<Vec<_>>())
        );
        // Try alternative structure - maybe events are at root level?
        if let Some(events_array) = data.get("Events").and_then(|v| v.as_array()) {
            info!("Found {} events at root level 'Events'", events_array.len());
        }
    }

    // Initialize enemy players list if not already done
    {
        let mut state = game_state.lock().await;
        if state.enemy_players.is_empty() {
            if let Some(players) = data.get("allPlayers").and_then(|v| v.as_array()) {
                // Get current player's team ID
                let current_player_team = data
                    .get("activePlayer")
                    .and_then(|p| p.get("teamId"))
                    .and_then(|v| v.as_i64());

                if let Some(my_team_id) = current_player_team {
                    for player in players {
                        if let (Some(team_id), Some(summoner_name)) = (
                            player.get("teamId").and_then(|v| v.as_i64()),
                            player.get("summonerName").and_then(|v| v.as_str()),
                        ) {
                            if team_id != my_team_id {
                                state.enemy_players.insert(summoner_name.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    // Process events for kills
    // Try multiple possible event structures
    let events_array = data
        .get("events")
        .and_then(|v| v.as_object())
        .and_then(|obj| obj.get("Events"))
        .and_then(|v| v.as_array())
        .or_else(|| data.get("Events").and_then(|v| v.as_array()));

    if let Some(events_array) = events_array {
        info!("Found {} events in live game data", events_array.len());

        // Get the highest event ID we've already processed
        let highest_processed = {
            let state = game_state.lock().await;
            state.highest_processed_event_id
        };

        info!(
            "Checking events. Highest processed so far: {:?}",
            highest_processed
        );
        debug_log(&format!(
            "Checking {} events. Highest processed: {:?}",
            events_array.len(),
            highest_processed
        ));
        let _ = app_handle.emit(
            "backend-log",
            format!(
                "Checking {} events (highest: {:?})",
                events_array.len(),
                highest_processed
            ),
        );

        let mut kill_count = 0;
        let mut new_highest_id = highest_processed;
        let mut new_events_found = 0;

        for event in events_array {
            // Only process events with EventID higher than what we've seen
            let event_id = event.get("EventID").and_then(|v| v.as_i64());
            if let Some(id) = event_id {
                if let Some(highest) = highest_processed {
                    if id <= highest {
                        debug!(
                            "Skipping event ID {} (already processed, highest was {})",
                            id, highest
                        );
                        continue;
                    }
                }
                // Update the highest ID we've seen
                new_highest_id = Some(new_highest_id.map(|h| h.max(id)).unwrap_or(id));
                new_events_found += 1;
                info!("NEW event detected! ID: {}, processing...", id);
                debug_log(&format!("NEW EVENT ID: {}", id));
                let _ = app_handle.emit("backend-log", format!("🆕 New event ID: {}", id));
            } else {
                debug!("Event has no EventID, skipping: {:?}", event);
                continue;
            }

            if let Some(event_type) = event.get("EventName").and_then(|v| v.as_str()) {
                info!(
                    "Processing NEW event type: {} (ID: {:?})",
                    event_type, event_id
                );
                match event_type {
                    "ChampionKill" => {
                        kill_count += 1;
                        info!(
                            "Found ChampionKill event #{}. Posting to Discord...",
                            kill_count
                        );
                        debug_log(&format!("Posting ChampionKill to Discord..."));
                        let _ = app_handle.emit(
                            "backend-log",
                            format!("💀 Posting ChampionKill to Discord..."),
                        );
                        if let Err(e) =
                            handle_champion_kill_event(event, discord, game_state, app_handle)
                                .await
                        {
                            error!("Failed to post kill event to Discord: {}", e);
                            debug_log(&format!("Discord post FAILED: {}", e));
                            let _ = app_handle
                                .emit("backend-log", format!("❌ Discord post failed: {}", e));
                        } else {
                            info!("✅ Successfully posted kill event to Discord");
                            debug_log("✅ Discord post SUCCESS");
                            let _ = app_handle
                                .emit("backend-log", "✅ Kill posted to Discord".to_string());
                        }
                    }
                    "FirstBlood" => {
                        info!("Found FirstBlood event. Posting to Discord...");
                        if let Err(e) =
                            handle_first_blood_event(event, discord, game_state, app_handle).await
                        {
                            error!("Failed to post first blood to Discord: {}", e);
                        } else {
                            info!("✅ Successfully posted first blood to Discord");
                        }
                    }
                    "Multikill" => {
                        info!("Found Multikill event. Posting to Discord...");
                        if let Err(e) = handle_multikill_event(event, discord, app_handle).await {
                            error!("Failed to post multikill to Discord: {}", e);
                        } else {
                            info!("✅ Successfully posted multikill to Discord");
                        }
                    }
                    "Ace" => {
                        info!("Found Ace event. Posting to Discord...");
                        if let Err(e) = handle_ace_event(event, discord, app_handle).await {
                            error!("Failed to post ace to Discord: {}", e);
                        } else {
                            info!("✅ Successfully posted ace to Discord");
                        }
                    }
                    "TurretKilled" | "FirstBrick" => {
                        kill_count += 1;
                        info!(
                            "Found {} event #{}. Posting to Discord...",
                            event_type, kill_count
                        );
                        if let Err(e) = handle_turret_kill_event(event, discord, app_handle).await {
                            error!("Failed to post turret event to Discord: {}", e);
                        } else {
                            info!("✅ Successfully posted turret event to Discord");
                        }
                    }
                    "DragonKill" => {
                        info!("Found DragonKill event. Posting to Discord...");
                        if let Err(e) = handle_dragon_kill_event(event, discord, app_handle).await {
                            error!("Failed to post dragon kill to Discord: {}", e);
                        } else {
                            info!("✅ Successfully posted dragon kill to Discord");
                        }
                    }
                    "BaronKill" => {
                        info!("Found BaronKill event. Posting to Discord...");
                        if let Err(e) = handle_baron_kill_event(event, discord, app_handle).await {
                            error!("Failed to post baron kill to Discord: {}", e);
                        } else {
                            info!("✅ Successfully posted baron kill to Discord");
                        }
                    }
                    "HeraldKill" => {
                        info!("Found HeraldKill event. Posting to Discord...");
                        if let Err(e) = handle_herald_kill_event(event, discord, app_handle).await {
                            error!("Failed to post herald kill to Discord: {}", e);
                        } else {
                            info!("✅ Successfully posted herald kill to Discord");
                        }
                    }
                    "InhibKilled" => {
                        info!("Found InhibKilled event. Posting to Discord...");
                        if let Err(e) = handle_inhib_kill_event(event, discord, app_handle).await {
                            error!("Failed to post inhibitor kill to Discord: {}", e);
                        } else {
                            info!("✅ Successfully posted inhibitor kill to Discord");
                        }
                    }
                    _ => {
                        debug!("Skipping event type: {}", event_type);
                    }
                }
            } else {
                debug!("Event missing EventName field: {:?}", event);
            }
        }

        // Update the highest processed event ID
        if let Some(new_highest) = new_highest_id {
            let mut state = game_state.lock().await;
            state.highest_processed_event_id = Some(new_highest);
            info!("Updated highest processed event ID to: {}", new_highest);
            debug_log(&format!(
                "Updated highest event ID to: {} ({} new events processed)",
                new_highest, new_events_found
            ));
        }

        if new_events_found == 0 {
            debug!("No new events found in this poll");
        } else {
            debug_log(&format!(
                "Processed {} new events this poll",
                new_events_found
            ));
        }
    } else {
        warn!("No events array found in live game data. Checked: events.Events and Events");
        // Log a sample of the data structure to help debug
        if let Some(obj) = data.as_object() {
            debug!(
                "Available top-level keys: {:?}",
                obj.keys().collect::<Vec<_>>()
            );
        }
    }

    Ok(())
}

/// Handles a champion kill event from live game data
async fn handle_champion_kill_event(
    event: &Value,
    discord: &DiscordClient,
    _game_state: &Arc<Mutex<GameState>>,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    // KillerName can be empty or missing for non-player kills (turrets, minions, etc.)
    let killer = event
        .get("KillerName")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("Unknown");

    let victim = event
        .get("VictimName")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing VictimName".to_string())?;

    let timestamp = event
        .get("EventTime")
        .and_then(|v| v.as_f64())
        .ok_or_else(|| "Missing EventTime".to_string())?;

    // Format timestamp as MM:SS
    let minutes = (timestamp / 60.0) as u64;
    let seconds = (timestamp % 60.0) as u64;
    let timestamp_str = format!("{}:{:02}", minutes, seconds);

    info!(
        "Posting kill event: {} killed {} at {}",
        killer, victim, timestamp_str
    );
    discord.post_kill(killer, victim, &timestamp_str).await?;
    play_sound(discord, SoundEvent::Kill, app_handle).await;

    Ok(())
}

/// Handles a first blood event
async fn handle_first_blood_event(
    event: &Value,
    discord: &DiscordClient,
    game_state: &Arc<Mutex<GameState>>,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let killer = event
        .get("KillerName")
        .and_then(|v| v.as_str())
        .unwrap_or("Unknown");

    let victim = event
        .get("VictimName")
        .and_then(|v| v.as_str())
        .unwrap_or("Unknown");

    let timestamp = event
        .get("EventTime")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);

    let minutes = (timestamp / 60.0) as u64;
    let seconds = (timestamp % 60.0) as u64;
    let timestamp_str = format!("{}:{:02}", minutes, seconds);

    // Mark first blood as occurred
    let mut state = game_state.lock().await;
    state.first_blood_occurred = true;
    drop(state);

    info!(
        "Posting first blood: {} killed {} at {}",
        killer, victim, timestamp_str
    );
    discord
        .post_first_blood(killer, victim, &timestamp_str)
        .await?;
    play_sound(discord, SoundEvent::FirstBlood, app_handle).await;

    Ok(())
}

/// Handles a multikill event
async fn handle_multikill_event(
    event: &Value,
    discord: &DiscordClient,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let killer = event
        .get("KillerName")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing KillerName".to_string())?;

    let kill_streak = event
        .get("KillStreak")
        .and_then(|v| v.as_i64())
        .ok_or_else(|| "Missing KillStreak".to_string())?;

    let timestamp = event
        .get("EventTime")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);

    let minutes = (timestamp / 60.0) as u64;
    let seconds = (timestamp % 60.0) as u64;
    let timestamp_str = format!("{}:{:02}", minutes, seconds);

    let multikill_type = match kill_streak {
        2 => "DOUBLE_KILL",
        3 => "TRIPLE_KILL",
        4 => "QUADRA_KILL",
        5 => "PENTA_KILL",
        _ => "MULTIKILL",
    };

    info!(
        "Posting multikill: {} got {} at {}",
        killer, multikill_type, timestamp_str
    );
    discord
        .post_multikill(killer, multikill_type, &timestamp_str)
        .await?;
    play_sound(discord, SoundEvent::MultiKill, app_handle).await;

    Ok(())
}

/// Handles an ace event
async fn handle_ace_event(
    event: &Value,
    discord: &DiscordClient,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let acer = event
        .get("Acer")
        .and_then(|v| v.as_str())
        .unwrap_or("Unknown");

    let acing_team = event
        .get("AcingTeam")
        .and_then(|v| v.as_str())
        .unwrap_or("Unknown Team");

    let timestamp = event
        .get("EventTime")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);

    let minutes = (timestamp / 60.0) as u64;
    let seconds = (timestamp % 60.0) as u64;
    let timestamp_str = format!("{}:{:02}", minutes, seconds);

    info!(
        "Posting ace: {} (team {}) at {}",
        acer, acing_team, timestamp_str
    );
    discord.post_ace(acing_team, &timestamp_str).await?;
    play_sound(discord, SoundEvent::Ace, app_handle).await;

    Ok(())
}

/// Handles a dragon kill event
async fn handle_dragon_kill_event(
    event: &Value,
    discord: &DiscordClient,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let killer = event
        .get("KillerName")
        .and_then(|v| v.as_str())
        .unwrap_or("Unknown");

    let dragon_type = event
        .get("DragonType")
        .and_then(|v| v.as_str())
        .unwrap_or("Dragon");

    let stolen = event
        .get("Stolen")
        .and_then(|v| v.as_str())
        .unwrap_or("False");

    let timestamp = event
        .get("EventTime")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);

    let minutes = (timestamp / 60.0) as u64;
    let seconds = (timestamp % 60.0) as u64;
    let timestamp_str = format!("{}:{:02}", minutes, seconds);

    let objective_name = if stolen == "True" {
        format!("{} DRAGON (STOLEN)", dragon_type)
    } else {
        format!("{} DRAGON", dragon_type)
    };

    info!(
        "Posting dragon kill: {} killed {} at {}",
        killer, objective_name, timestamp_str
    );
    discord
        .post_objective(killer, &objective_name, &timestamp_str)
        .await?;
    play_sound(discord, SoundEvent::Objective, app_handle).await;

    Ok(())
}

/// Handles a baron kill event
async fn handle_baron_kill_event(
    event: &Value,
    discord: &DiscordClient,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let killer = event
        .get("KillerName")
        .and_then(|v| v.as_str())
        .unwrap_or("Unknown");

    let stolen = event
        .get("Stolen")
        .and_then(|v| v.as_str())
        .unwrap_or("False");

    let timestamp = event
        .get("EventTime")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);

    let minutes = (timestamp / 60.0) as u64;
    let seconds = (timestamp % 60.0) as u64;
    let timestamp_str = format!("{}:{:02}", minutes, seconds);

    let objective_name = if stolen == "True" {
        "BARON (STOLEN)"
    } else {
        "BARON"
    };

    info!(
        "Posting baron kill: {} killed {} at {}",
        killer, objective_name, timestamp_str
    );
    discord
        .post_objective(killer, objective_name, &timestamp_str)
        .await?;
    play_sound(discord, SoundEvent::Objective, app_handle).await;

    Ok(())
}

/// Handles a herald kill event
async fn handle_herald_kill_event(
    event: &Value,
    discord: &DiscordClient,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let killer = event
        .get("KillerName")
        .and_then(|v| v.as_str())
        .unwrap_or("Unknown");

    let stolen = event
        .get("Stolen")
        .and_then(|v| v.as_str())
        .unwrap_or("False");

    let timestamp = event
        .get("EventTime")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);

    let minutes = (timestamp / 60.0) as u64;
    let seconds = (timestamp % 60.0) as u64;
    let timestamp_str = format!("{}:{:02}", minutes, seconds);

    let objective_name = if stolen == "True" {
        "RIFT HERALD (STOLEN)"
    } else {
        "RIFT HERALD"
    };

    info!(
        "Posting herald kill: {} killed {} at {}",
        killer, objective_name, timestamp_str
    );
    discord
        .post_objective(killer, objective_name, &timestamp_str)
        .await?;
    play_sound(discord, SoundEvent::Objective, app_handle).await;

    Ok(())
}

/// Handles an inhibitor kill event
async fn handle_inhib_kill_event(
    event: &Value,
    discord: &DiscordClient,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let killer = event
        .get("KillerName")
        .and_then(|v| v.as_str())
        .unwrap_or("Unknown");

    let timestamp = event
        .get("EventTime")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);

    let minutes = (timestamp / 60.0) as u64;
    let seconds = (timestamp % 60.0) as u64;
    let timestamp_str = format!("{}:{:02}", minutes, seconds);

    info!(
        "Posting inhibitor kill: {} destroyed inhibitor at {}",
        killer, timestamp_str
    );
    discord
        .post_objective(killer, "INHIBITOR", &timestamp_str)
        .await?;
    play_sound(discord, SoundEvent::Objective, app_handle).await;

    Ok(())
}

/// Handles a turret kill event
async fn handle_turret_kill_event(
    event: &Value,
    discord: &DiscordClient,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let killer = event
        .get("KillerName")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("Unknown");

    let timestamp = event
        .get("EventTime")
        .and_then(|v| v.as_f64())
        .ok_or_else(|| "Missing EventTime".to_string())?;

    // Format timestamp as MM:SS
    let minutes = (timestamp / 60.0) as u64;
    let seconds = (timestamp % 60.0) as u64;
    let timestamp_str = format!("{}:{:02}", minutes, seconds);

    info!(
        "Processing turret kill: {} destroyed turret at {}",
        killer, timestamp_str
    );

    // Post turret kill event
    discord
        .post_objective(killer, "TOWER", &timestamp_str)
        .await?;
    info!("Turret kill event posted successfully");
    play_sound(discord, SoundEvent::Objective, app_handle).await;

    Ok(())
}

async fn handle_event(
    msg: &LcuWebSocketMessage,
    discord: &DiscordClient,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    // Use event_type to determine how to handle the event
    let event_type = &msg.event_type;

    match msg.uri.as_str() {
        uri if uri.contains("/lol-gameflow/v1/gameflow-phase") => {
            handle_gameflow_event(&msg.data, discord, event_type, app_handle).await
        }
        uri if uri.contains("/lol-champ-select/v1/session") => {
            handle_champ_select_event(&msg.data, discord, event_type).await
        }
        uri if uri.contains("/lol-end-of-game/v1/eog-stats-block") => {
            handle_end_of_game_event(&msg.data, discord, event_type, app_handle).await
        }
        _ => Ok(()),
    }
}

async fn handle_gameflow_event(
    data: &Value,
    discord: &DiscordClient,
    event_type: &str,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    if let Some(phase) = data.as_str() {
        match phase {
            "InProgress" => {
                info!("Game started");
                discord
                    .post_game_start("Summoner's Rift", "Normal Game")
                    .await?;
                play_sound(discord, SoundEvent::GameStart, app_handle).await;
            }
            "WaitingForStats" | "PreEndOfGame" => {
                info!("Game ending");
                discord
                    .post_game_event("Game Ending", "Match is concluding...")
                    .await?;
            }
            "EndOfGame" => {
                info!("Game ended");
            }
            "ChampSelect" => {
                info!("Champion select started");
                discord
                    .post_game_event("Champion Select", "Matchmaking found a game!")
                    .await?;
            }
            _ => {
                debug!(
                    "Unhandled game phase: {} (event type: {})",
                    phase, event_type
                );
            }
        }
    } else if let Some(_obj) = data.as_object() {
        // Handle structured game event data
        // Attempt to parse and post kill, multikill, and objective events
        if let Err(e) = parse_and_post_game_events(data, discord).await {
            debug!("Failed to parse game events: {}", e);
        }
    }
    Ok(())
}

async fn handle_champ_select_event(
    data: &Value,
    discord: &DiscordClient,
    event_type: &str,
) -> Result<(), String> {
    // Parse champion select data and post to Discord
    if let Some(obj) = data.as_object() {
        if event_type == "Update" && !obj.is_empty() {
            discord
                .post_game_event("Champion Select", "Teams are selecting champions...")
                .await?;
        }
    }
    Ok(())
}

async fn handle_end_of_game_event(
    data: &Value,
    discord: &DiscordClient,
    _event_type: &str,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    if !data.is_null() {
        // Extract game duration and winning team
        let duration = data
            .get("gameLength")
            .and_then(serde_json::Value::as_u64)
            .unwrap_or(0);

        let minutes = duration / 60;
        let seconds = duration % 60;
        let duration_str = format!("{minutes}:{seconds:02}");

        // Try to determine winning team
        let winning_team = if let Some(teams) = data.get("teams").and_then(|v| v.as_array()) {
            teams
                .iter()
                .find_map(|team| {
                    if team.get("win").and_then(|v| v.as_bool()) == Some(true) {
                        team.get("teamId").and_then(|v| v.as_u64()).map(|id| {
                            if id == 100 {
                                "Blue Side"
                            } else {
                                "Red Side"
                            }
                        })
                    } else {
                        None
                    }
                })
                .unwrap_or("Blue Side")
        } else {
            "Blue Side"
        };

        discord.post_game_end(winning_team, &duration_str).await?;
        play_sound(discord, SoundEvent::GameEnd, app_handle).await;
    }
    Ok(())
}

/// Parses game event data and posts to Discord using appropriate methods
/// This function attempts to detect kill, multikill, and objective events
async fn parse_and_post_game_events(data: &Value, discord: &DiscordClient) -> Result<(), String> {
    // Try to parse kill events
    if let Some(kills) = data.get("kills").and_then(|v| v.as_array()) {
        for kill in kills {
            if let (Some(killer), Some(victim), Some(time)) = (
                kill.get("killerName").and_then(|v| v.as_str()),
                kill.get("victimName").and_then(|v| v.as_str()),
                kill.get("gameTime").and_then(|v| v.as_str()),
            ) {
                // Create a GameEvent for structured handling
                let event = GameEvent::ChampionKill {
                    killer: killer.to_string(),
                    victim: victim.to_string(),
                    game_time: time.to_string(),
                };
                // Post to Discord using the dedicated method
                discord.post_kill(killer, victim, time).await?;
                debug!("Posted kill event: {:?}", event);
            }
        }
    }

    // Try to parse multikill events
    if let Some(multikills) = data.get("multikills").and_then(|v| v.as_array()) {
        for multikill in multikills {
            if let (Some(killer), Some(multikill_type), Some(time)) = (
                multikill.get("killerName").and_then(|v| v.as_str()),
                multikill.get("type").and_then(|v| v.as_str()),
                multikill.get("gameTime").and_then(|v| v.as_str()),
            ) {
                // Create a GameEvent for structured handling
                let event = GameEvent::MultiKill {
                    killer: killer.to_string(),
                    multikill_type: multikill_type.to_string(),
                    game_time: time.to_string(),
                };
                // Post to Discord using the dedicated method
                discord.post_multikill(killer, multikill_type, time).await?;
                debug!("Posted multikill event: {:?}", event);
            }
        }
    }

    // Try to parse objective events
    if let Some(objectives) = data.get("objectives").and_then(|v| v.as_array()) {
        for objective in objectives {
            if let (Some(team), Some(objective_type), Some(time)) = (
                objective.get("teamName").and_then(|v| v.as_str()),
                objective.get("type").and_then(|v| v.as_str()),
                objective.get("gameTime").and_then(|v| v.as_str()),
            ) {
                // Create a GameEvent for structured handling
                let event = GameEvent::Objective {
                    team: team.to_string(),
                    objective: objective_type.to_string(),
                    game_time: time.to_string(),
                };
                // Post to Discord using the dedicated method
                discord.post_objective(team, objective_type, time).await?;
                debug!("Posted objective event: {:?}", event);
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_game_event_game_start_serialization() {
        let event = GameEvent::GameStart {
            game_mode: "Ranked Solo/Duo".to_string(),
            map: "Summoner's Rift".to_string(),
        };

        let json = serde_json::to_string(&event).ok();
        assert!(json.is_some());

        if let Some(json_str) = json {
            assert!(json_str.contains("eventType"));
            assert!(json_str.contains("GameStart"));
            assert!(json_str.contains("Ranked Solo/Duo"));
        }
    }

    #[test]
    fn test_game_event_game_end_serialization() {
        let event = GameEvent::GameEnd {
            winning_team: "Red Team".to_string(),
            duration: "25:30".to_string(),
        };

        let json = serde_json::to_string(&event).ok();
        assert!(json.is_some());

        if let Some(json_str) = json {
            assert!(json_str.contains("GameEnd"));
            assert!(json_str.contains("Red Team"));
        }
    }

    #[test]
    fn test_game_event_champion_kill() {
        let event = GameEvent::ChampionKill {
            killer: "Yasuo".to_string(),
            victim: "Zed".to_string(),
            game_time: "15:32".to_string(),
        };

        let json = serde_json::to_string(&event).ok();
        assert!(json.is_some());

        if let Some(json_str) = json {
            assert!(json_str.contains("ChampionKill"));
            assert!(json_str.contains("Yasuo"));
            assert!(json_str.contains("Zed"));
        }
    }

    #[test]
    fn test_game_event_multi_kill() {
        let event = GameEvent::MultiKill {
            killer: "Katarina".to_string(),
            multikill_type: "TRIPLE_KILL".to_string(),
            game_time: "20:15".to_string(),
        };

        let json = serde_json::to_string(&event).ok();
        assert!(json.is_some());

        if let Some(json_str) = json {
            assert!(json_str.contains("MultiKill"));
            assert!(json_str.contains("TRIPLE_KILL"));
        }
    }

    #[test]
    fn test_game_event_objective() {
        let event = GameEvent::Objective {
            team: "Blue Team".to_string(),
            objective: "DRAGON".to_string(),
            game_time: "10:00".to_string(),
        };

        let json = serde_json::to_string(&event).ok();
        assert!(json.is_some());

        if let Some(json_str) = json {
            assert!(json_str.contains("Objective"));
            assert!(json_str.contains("DRAGON"));
        }
    }

    #[test]
    fn test_lcu_websocket_message_deserialization() {
        let json_str = r#"{
            "eventType": "Update",
            "uri": "/lol-gameflow/v1/gameflow-phase",
            "data": "InProgress"
        }"#;

        let result: Result<LcuWebSocketMessage, _> = serde_json::from_str(json_str);
        assert!(result.is_ok());

        if let Ok(msg) = result {
            assert_eq!(msg.event_type, "Update");
            assert_eq!(msg.uri, "/lol-gameflow/v1/gameflow-phase");
            assert_eq!(msg.data.as_str(), Some("InProgress"));
        }
    }

    #[test]
    fn test_json_message_format() {
        let message = json_message(5, "/lol-gameflow/v1/gameflow-phase");
        assert_eq!(message, r#"[5, "/lol-gameflow/v1/gameflow-phase"]"#);
    }

    #[test]
    fn test_json_message_subscribe_format() {
        let message = json_message(5, "/lol-champ-select/v1/session");
        assert_eq!(message, r#"[5, "/lol-champ-select/v1/session"]"#);
        assert!(message.starts_with('['));
        assert!(message.ends_with(']'));
    }

    #[test]
    fn test_duration_calculation() {
        // Test duration formatting logic
        let test_cases = vec![
            (0, "0:00"),
            (30, "0:30"),
            (60, "1:00"),
            (125, "2:05"),
            (1800, "30:00"),
            (1937, "32:17"),
        ];

        for (total_seconds, expected) in test_cases {
            let minutes = total_seconds / 60;
            let seconds = total_seconds % 60;
            let duration_str = format!("{minutes}:{seconds:02}");
            assert_eq!(duration_str, expected);
        }
    }

    #[test]
    fn test_gameflow_phases() {
        let phases = vec![
            "None",
            "Lobby",
            "Matchmaking",
            "CheckedIntoTournament",
            "ReadyCheck",
            "ChampSelect",
            "GameStart",
            "FailedToLaunch",
            "InProgress",
            "Reconnect",
            "WaitingForStats",
            "PreEndOfGame",
            "EndOfGame",
            "TerminatedInError",
        ];

        // Ensure our handled phases are in the list
        assert!(phases.contains(&"InProgress"));
        assert!(phases.contains(&"ChampSelect"));
        assert!(phases.contains(&"EndOfGame"));
        assert!(phases.contains(&"WaitingForStats"));
    }

    #[test]
    fn test_end_of_game_data_parsing() {
        let data = json!({
            "gameLength": 1850,
            "teams": [
                {"win": true, "teamId": 100},
                {"win": false, "teamId": 200}
            ]
        });

        let duration = data
            .get("gameLength")
            .and_then(serde_json::Value::as_u64)
            .unwrap_or(0);

        assert_eq!(duration, 1850);

        let minutes = duration / 60;
        let seconds = duration % 60;
        assert_eq!(minutes, 30);
        assert_eq!(seconds, 50);
    }

    #[test]
    fn test_websocket_uri_matching() {
        let test_cases = vec![
            ("/lol-gameflow/v1/gameflow-phase", true, false, false),
            ("/lol-champ-select/v1/session", false, true, false),
            ("/lol-end-of-game/v1/eog-stats-block", false, false, true),
            ("/some/other/uri", false, false, false),
        ];

        for (uri, is_gameflow, is_champ_select, is_end_of_game) in test_cases {
            assert_eq!(uri.contains("/lol-gameflow/v1/gameflow-phase"), is_gameflow);
            assert_eq!(
                uri.contains("/lol-champ-select/v1/session"),
                is_champ_select
            );
            assert_eq!(
                uri.contains("/lol-end-of-game/v1/eog-stats-block"),
                is_end_of_game
            );
        }
    }

    #[test]
    fn test_game_event_deserialization() {
        let json_str = r#"{
            "eventType": "GameStart",
            "game_mode": "Ranked",
            "map": "Summoner's Rift"
        }"#;

        let result: Result<GameEvent, _> = serde_json::from_str(json_str);
        assert!(result.is_ok());
    }

    #[test]
    fn test_null_data_handling() {
        let null_value = serde_json::Value::Null;
        assert!(null_value.is_null());

        let non_null_value = json!({"gameLength": 1200});
        assert!(!non_null_value.is_null());
    }
}
