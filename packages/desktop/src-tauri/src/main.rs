//! Scout for LoL Desktop Application
//!
//! A Tauri-based desktop client for monitoring League of Legends games
//! and posting live updates to Discord channels.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![warn(missing_docs, clippy::all, clippy::pedantic, clippy::nursery)]
#![allow(clippy::missing_errors_doc, clippy::missing_panics_doc)]

mod lcu;
mod discord;
mod events;

#[cfg(test)]
mod tests;

use std::sync::Arc;
use tauri::{Manager, State};
use tokio::sync::Mutex;
use tracing::{info, error};
use tracing_subscriber;

#[derive(Default)]
struct AppState {
    lcu_connection: Arc<Mutex<Option<lcu::LcuConnection>>>,
    discord_client: Arc<Mutex<Option<discord::DiscordClient>>>,
    is_monitoring: Arc<Mutex<bool>>,
}

#[tauri::command]
async fn get_lcu_status(state: State<'_, AppState>) -> Result<lcu::LcuStatus, String> {
    let connection = state.lcu_connection.lock().await;
    match connection.as_ref() {
        Some(conn) => Ok(conn.get_status()),
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

    match discord::DiscordClient::new(bot_token, channel_id).await {
        Ok(client) => {
            info!("Successfully configured Discord client");
            let mut discord = state.discord_client.lock().await;
            *discord = Some(client);
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
async fn start_monitoring(state: State<'_, AppState>) -> Result<(), String> {
    info!("Starting game monitoring...");

    let mut is_monitoring = state.is_monitoring.lock().await;
    if *is_monitoring {
        return Err("Monitoring is already active".to_string());
    }

    // Start the event monitoring
    events::start_event_monitoring(
        state.lcu_connection.clone(),
        state.discord_client.clone(),
    ).await?;

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

fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"))
        )
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            get_lcu_status,
            connect_lcu,
            disconnect_lcu,
            configure_discord,
            get_discord_status,
            start_monitoring,
            stop_monitoring,
            get_monitoring_status,
        ])
        .setup(|app| {
            info!("Scout for LoL Desktop starting up...");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
