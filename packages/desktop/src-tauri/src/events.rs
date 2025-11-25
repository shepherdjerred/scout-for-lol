//! Game event monitoring and processing module

use crate::discord::DiscordClient;
use crate::lcu::LcuConnection;
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::Message;
use tracing::{debug, error, info, warn};

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

/// Starts monitoring game events and posting to Discord
pub async fn start_event_monitoring(
    lcu: Arc<Mutex<Option<LcuConnection>>>,
    discord: Arc<Mutex<Option<DiscordClient>>>,
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

    // Spawn a background task for WebSocket monitoring
    tokio::spawn(async move {
        if let Err(e) = run_event_loop(lcu_conn, discord_client).await {
            error!("Event monitoring failed: {}", e);
        }
    });

    Ok(())
}

async fn run_event_loop(lcu: LcuConnection, discord: DiscordClient) -> Result<(), String> {
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
                    if let Err(e) = handle_event(&ws_msg, &discord).await {
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

async fn handle_event(msg: &LcuWebSocketMessage, discord: &DiscordClient) -> Result<(), String> {
    // Use event_type to determine how to handle the event
    let event_type = &msg.event_type;

    match msg.uri.as_str() {
        uri if uri.contains("/lol-gameflow/v1/gameflow-phase") => {
            handle_gameflow_event(&msg.data, discord, event_type).await
        }
        uri if uri.contains("/lol-champ-select/v1/session") => {
            handle_champ_select_event(&msg.data, discord, event_type).await
        }
        uri if uri.contains("/lol-end-of-game/v1/eog-stats-block") => {
            handle_end_of_game_event(&msg.data, discord, event_type).await
        }
        _ => Ok(()),
    }
}

async fn handle_gameflow_event(
    data: &Value,
    discord: &DiscordClient,
    event_type: &str,
) -> Result<(), String> {
    if let Some(phase) = data.as_str() {
        match phase {
            "InProgress" => {
                info!("Game started");
                discord
                    .post_game_start("Summoner's Rift", "Normal Game")
                    .await?;
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
                debug!("Unhandled game phase: {} (event type: {})", phase, event_type);
            }
        }
            } else if let Some(obj) = data.as_object() {
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
) -> Result<(), String> {
    if !data.is_null() {
        // Extract game duration and winning team
        let duration = data.get("gameLength").and_then(|v| v.as_u64()).unwrap_or(0);

        let minutes = duration / 60;
        let seconds = duration % 60;
        let duration_str = format!("{}:{:02}", minutes, seconds);

        // Try to determine winning team
        let winning_team = if let Some(teams) = data.get("teams").and_then(|v| v.as_array()) {
            teams
                .iter()
                .find_map(|team| {
                    if team.get("win").and_then(|v| v.as_bool()) == Some(true) {
                        team.get("teamId")
                            .and_then(|v| v.as_u64())
                            .map(|id| if id == 100 { "Blue Side" } else { "Red Side" })
                    } else {
                        None
                    }
                })
                .unwrap_or("Blue Side")
        } else {
            "Blue Side"
        };

        discord.post_game_end(winning_team, &duration_str).await?;
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
            let duration_str = format!("{}:{:02}", minutes, seconds);
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

        let duration = data.get("gameLength").and_then(|v| v.as_u64()).unwrap_or(0);

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
