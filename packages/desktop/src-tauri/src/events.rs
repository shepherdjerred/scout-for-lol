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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "eventType")]
pub enum GameEvent {
    GameStart {
        game_mode: String,
        map: String,
    },
    GameEnd {
        winning_team: String,
        duration: String,
    },
    ChampionKill {
        killer: String,
        victim: String,
        game_time: String,
    },
    MultiKill {
        killer: String,
        multikill_type: String,
        game_time: String,
    },
    Objective {
        team: String,
        objective: String,
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

    let lcu_conn = lcu.lock().await;
    let lcu_conn = lcu_conn
        .as_ref()
        .ok_or_else(|| "LCU not connected".to_string())?
        .clone();
    drop(lcu_conn);

    let discord_client = discord.lock().await;
    let discord_client = discord_client
        .as_ref()
        .ok_or_else(|| "Discord not configured".to_string())?
        .clone();
    drop(discord_client);

    // Spawn a background task for WebSocket monitoring
    tokio::spawn(async move {
        if let Err(e) = run_event_loop(lcu_conn, discord_client).await {
            error!("Event monitoring failed: {}", e);
        }
    });

    Ok(())
}

async fn run_event_loop(
    lcu: LcuConnection,
    discord: DiscordClient,
) -> Result<(), String> {
    info!("Connecting to LCU WebSocket...");

    let ws_url = lcu.get_websocket_url();
    let auth_header = lcu.get_auth_header();

    // Create WebSocket request with authentication
    let mut request = ws_url
        .into_client_request()
        .map_err(|e| format!("Failed to create WebSocket request: {}", e))?;

    request
        .headers_mut()
        .insert("Authorization", auth_header.parse().unwrap());

    // Connect with TLS disabled (self-signed cert)
    let connector = tokio_tungstenite::Connector::NativeTls(
        native_tls::TlsConnector::builder()
            .danger_accept_invalid_certs(true)
            .build()
            .map_err(|e| format!("Failed to create TLS connector: {}", e))?,
    );

    let (ws_stream, _) = connect_async(request)
        .await
        .map_err(|e| format!("WebSocket connection failed: {}", e))?;

    info!("Connected to LCU WebSocket");

    let (mut write, mut read) = ws_stream.split();

    // Subscribe to game events
    let subscriptions = vec![
        json_message(5, "/lol-gameflow/v1/gameflow-phase"),
        json_message(5, "/lol-champ-select/v1/session"),
        json_message(5, "/lol-end-of-game/v1/eog-stats-block"),
    ];

    for sub in subscriptions {
        write
            .send(Message::Text(sub))
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
    match msg.uri.as_str() {
        uri if uri.contains("/lol-gameflow/v1/gameflow-phase") => {
            handle_gameflow_event(&msg.data, discord).await
        }
        uri if uri.contains("/lol-champ-select/v1/session") => {
            handle_champ_select_event(&msg.data, discord).await
        }
        uri if uri.contains("/lol-end-of-game/v1/eog-stats-block") => {
            handle_end_of_game_event(&msg.data, discord).await
        }
        _ => Ok(()),
    }
}

async fn handle_gameflow_event(data: &Value, discord: &DiscordClient) -> Result<(), String> {
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
            }
            "EndOfGame" => {
                info!("Game ended");
            }
            "ChampSelect" => {
                info!("Champion select started");
                discord
                    .post_message("⚔️ Champion Select has started!".to_string())
                    .await?;
            }
            _ => {
                debug!("Unhandled game phase: {}", phase);
            }
        }
    }
    Ok(())
}

async fn handle_champ_select_event(_data: &Value, _discord: &DiscordClient) -> Result<(), String> {
    // TODO: Parse champion select data and post to Discord
    Ok(())
}

async fn handle_end_of_game_event(data: &Value, discord: &DiscordClient) -> Result<(), String> {
    if !data.is_null() {
        // Extract game duration and winning team
        let duration = data
            .get("gameLength")
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        let minutes = duration / 60;
        let seconds = duration % 60;
        let duration_str = format!("{}:{:02}", minutes, seconds);

        // Try to determine winning team
        let winning_team = "Blue Side"; // TODO: Parse from data

        discord.post_game_end(winning_team, &duration_str).await?;
    }
    Ok(())
}
