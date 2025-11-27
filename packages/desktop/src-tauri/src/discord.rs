//! Discord integration module for posting game events and playing sounds in voice chat

use log::{error, info};
use serde::{Deserialize, Serialize};
use serenity::all::{ChannelId, GatewayIntents, GuildId, Ready};
use serenity::async_trait;
use serenity::client::{Client as SerenityClient, EventHandler};
use songbird::events::{Event, EventContext, EventHandler as VoiceEventHandler, TrackEvent};
use songbird::input::{File as AudioFile, Input};
use songbird::{SerenityInit, Songbird, SongbirdKey};
use std::collections::HashMap;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::Emitter;
use tokio::time::{timeout, Duration};

// Bundled base beep sound (packed at compile time)
const BASE_BEEP_BYTES: &[u8] = include_bytes!("../resources/sounds/base-beep.wav");

struct TrackLogger;

#[derive(Serialize)]
struct MessagePayload {
    content: String,
}

#[async_trait]
impl VoiceEventHandler for TrackLogger {
    async fn act(&self, ctx: &EventContext<'_>) -> Option<Event> {
        if let EventContext::Track(track_list) = ctx {
            for (state, handle) in track_list.iter().copied() {
                write_sound_log(&format!(
                    "[sound-track] uuid={:?} playing={:?} vol={:?}",
                    handle.uuid(),
                    state.playing,
                    state.volume
                ));
            }
        }
        None
    }
}

fn ensure_base_beep_file() -> PathBuf {
    let temp_path = std::env::temp_dir().join("scout-base-beep.wav");
    if !temp_path.exists() {
        if let Err(err) = std::fs::write(&temp_path, BASE_BEEP_BYTES) {
            error!("Failed to write base beep to temp: {}", err);
        } else {
            info!("Wrote base beep to {}", temp_path.display());
        }
    }
    temp_path
}

fn write_sound_log(message: &str) {
    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open("scout-debug.log")
    {
        let _ = writeln!(file, "{}", message);
    }
}

fn log_sound_error(event: SoundEvent, msg: &str) {
    write_sound_log(&format!("[sound-error] {:?}: {}", event, msg));
}

/// Represents the connection status of the Discord client
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscordStatus {
    /// Whether the Discord client is connected
    pub connected: bool,
    /// The name of the Discord text channel (if connected)
    pub channel_name: Option<String>,
    /// Whether we are currently connected to a voice channel
    pub voice_connected: bool,
    /// The voice channel name (if connected)
    pub voice_channel_name: Option<String>,
    /// Active sound pack identifier
    pub active_sound_pack: Option<String>,
}

/// Events that can trigger audio cues
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum SoundEvent {
    /// Game started
    GameStart,
    /// First blood occurred
    FirstBlood,
    /// Standard champion kill
    Kill,
    /// Multi-kill event
    MultiKill,
    /// Objective capture (dragon/baron/tower/etc)
    Objective,
    /// Ace occurred
    Ace,
    /// Game ended
    GameEnd,
}

impl SoundEvent {
    /// Returns the canonical key used for config and UI
    #[must_use]
    pub const fn key(self) -> &'static str {
        match self {
            Self::GameStart => "gameStart",
            Self::FirstBlood => "firstBlood",
            Self::Kill => "kill",
            Self::MultiKill => "multiKill",
            Self::Objective => "objective",
            Self::Ace => "ace",
            Self::GameEnd => "gameEnd",
        }
    }
}

/// A sound cue can be loaded from disk
#[derive(Debug, Clone)]
pub enum SoundCue {
    /// Load audio from a file path
    File(PathBuf),
    /// Stream audio from a URL (e.g., YouTube)
    Url(String),
}

/// A collection of sounds that can be swapped in as a pack
#[derive(Debug, Clone)]
pub struct SoundPack {
    /// Identifier used for config
    pub id: String,
    /// Friendly name for display
    pub _name: String,
    /// Human-readable description
    pub _description: String,
    /// Mapping of event key -> cue
    pub cues: HashMap<String, SoundCue>,
}

impl SoundPack {
    /// Base pack with bundled beep audio
    #[must_use]
    pub fn base() -> Self {
        let base_beep = ensure_base_beep_file();
        let cues = HashMap::from([
            (
                SoundEvent::GameStart.key().to_string(),
                SoundCue::File(base_beep.clone()),
            ),
            (
                SoundEvent::Kill.key().to_string(),
                SoundCue::File(base_beep.clone()),
            ),
            (
                SoundEvent::MultiKill.key().to_string(),
                SoundCue::File(base_beep.clone()),
            ),
            (
                SoundEvent::Objective.key().to_string(),
                SoundCue::File(base_beep.clone()),
            ),
            (
                SoundEvent::FirstBlood.key().to_string(),
                SoundCue::File(base_beep.clone()),
            ),
            (
                SoundEvent::Ace.key().to_string(),
                SoundCue::File(base_beep.clone()),
            ),
            (
                SoundEvent::GameEnd.key().to_string(),
                SoundCue::File(base_beep),
            ),
        ]);

        Self {
            id: "base".to_string(),
            _name: "Base Pack".to_string(),
            _description: "Lightweight synthesized tones for quick callouts".to_string(),
            cues,
        }
    }

    /// Returns the cue for a given key if present
    pub fn cue_for(&self, key: &str) -> Option<SoundCue> {
        self.cues.get(key).cloned()
    }
}

/// Minimal event handler to keep the gateway session alive
struct VoiceHandler;

#[async_trait]
impl EventHandler for VoiceHandler {
    async fn ready(&self, _ctx: serenity::prelude::Context, ready: Ready) {
        info!("Discord voice gateway connected as {}", ready.user.name);
    }
}

#[derive(Debug, Deserialize)]
struct ChannelLookupResponse {
    id: String,
    name: Option<String>,
    #[serde(rename = "guild_id")]
    guild_id: Option<String>,
    #[serde(rename = "type")]
    kind: Option<u8>,
}

/// Discord client for posting game events to a Discord channel and playing voice cues
#[derive(Debug, Clone)]
pub struct DiscordClient {
    token: String,
    channel_id: String,
    voice_channel_id: Option<String>,
    client: reqwest::Client,
    songbird: Option<Arc<Songbird>>,
    sound_pack: SoundPack,
    event_overrides: HashMap<String, SoundCue>,
}

impl DiscordClient {
    /// Creates a new Discord client and validates the connection
    #[allow(clippy::too_many_arguments)]
    pub async fn new(
        token: String,
        channel_id: String,
        voice_channel_id: Option<String>,
        sound_pack: Option<String>,
        event_overrides: Option<HashMap<String, String>>,
    ) -> Result<Self, String> {
        info!("Initializing Discord client...");

        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(8))
            .build()
            .map_err(|e| format!("Failed to create HTTP client: {e}"))?;

        let discord_client = Self {
            token: token.clone(),
            channel_id: channel_id.clone(),
            voice_channel_id,
            client,
            songbird: None,
            sound_pack: match sound_pack.as_deref() {
                Some("base") | None => SoundPack::base(),
                Some(other) => {
                    info!("Unknown sound pack `{other}`, falling back to base");
                    SoundPack::base()
                }
            },
            event_overrides: HashMap::new(),
        };

        // Test the text connection up front with a timeout so the UI doesn't hang
        timeout(Duration::from_secs(8), discord_client.test_connection())
            .await
            .map_err(|_| "Discord API connection timed out".to_string())??;

        let mut client = discord_client;
        client.apply_event_overrides(event_overrides);
        client.songbird = timeout(
            Duration::from_secs(8),
            client.build_voice_client(token.clone()),
        )
        .await
        .map_err(|_| "Voice client setup timed out".to_string())?;

        if client.songbird.is_none() {
            error!(
                "Voice client not initialized; voice playback will be disabled until reconfigured"
            );
        }

        Ok(client)
    }

    /// Tests the Discord API connection for the configured text channel
    async fn test_connection(&self) -> Result<(), String> {
        info!("Testing Discord connection...");

        let channel_id = &self.channel_id;
        let url = format!("https://discord.com/api/v10/channels/{channel_id}");

        let response = self
            .client
            .get(&url)
            .header("Authorization", format!("Bot {}", self.token))
            .header("User-Agent", "Scout-for-LoL-Desktop/0.1.0")
            .send()
            .await
            .map_err(|e| format!("Failed to connect to Discord API: {e}"))?;

        if response.status().is_success() {
            info!("Discord connection test successful");
            Ok(())
        } else {
            let status = response.status();
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            error!("Discord API error: {} - {}", status, error_text);
            Err(format!("Discord API error: {status} - {error_text}"))
        }
    }

    fn apply_event_overrides(&mut self, overrides: Option<HashMap<String, String>>) {
        if let Some(map) = overrides {
            for (event, value) in map {
                let cue = if let Some(base_cue) = self.sound_pack.cue_for(&value) {
                    base_cue
                } else if value.starts_with("http://") || value.starts_with("https://") {
                    SoundCue::Url(value)
                } else {
                    SoundCue::File(PathBuf::from(value))
                };
                self.event_overrides.insert(event, cue);
            }
        }
    }

    async fn build_voice_client(&self, token: String) -> Option<Arc<Songbird>> {
        let intents = GatewayIntents::GUILDS | GatewayIntents::GUILD_VOICE_STATES;

        match SerenityClient::builder(&token, intents)
            .event_handler(VoiceHandler)
            .register_songbird()
            .await
        {
            Ok(mut client) => {
                // Get songbird instance before spawning
                let data = client.data.clone();
                let songbird = {
                    let data_read = data.read().await;
                    data_read.get::<SongbirdKey>().cloned()
                };

                tokio::spawn(async move {
                    if let Err(err) = client.start_autosharded().await {
                        error!("Discord voice gateway error: {err}");
                    }
                });

                songbird
            }
            Err(err) => {
                error!("Failed to initialize Discord voice client: {err}");
                None
            }
        }
    }

    /// Posts a message to the configured Discord channel
    pub async fn post_message(&self, content: String) -> Result<(), String> {
        let url = format!(
            "https://discord.com/api/v10/channels/{}/messages",
            self.channel_id
        );

        info!("Attempting to post Discord message");

        let payload = MessagePayload { content };

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bot {}", self.token))
            .header("Content-Type", "application/json")
            .header("User-Agent", "Scout-for-LoL-Desktop/0.1.0")
            .json(&payload)
            .send()
            .await
            .map_err(|e| {
                error!("Failed to send Discord message request: {}", e);
                format!("Failed to send Discord message: {e}")
            })?;

        if response.status().is_success() {
            info!("Successfully posted message to Discord");
            Ok(())
        } else {
            let status = response.status();
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            error!(
                "Failed to post Discord message (status {}): {}",
                status, error_text
            );
            Err(format!("Failed to post message: {status} - {error_text}"))
        }
    }

    /// Posts a game event to Discord
    pub async fn post_game_event(&self, event_type: &str, details: &str) -> Result<(), String> {
        let message = format!("**{event_type}** - {details}");
        self.post_message(message).await
    }

    /// Posts a kill event
    pub async fn post_kill(
        &self,
        killer: &str,
        victim: &str,
        game_time: &str,
    ) -> Result<(), String> {
        let message = if killer == "Unknown" {
            format!("💀 **{victim}** died at {game_time}")
        } else {
            format!("💀 **{killer}** killed **{victim}** at {game_time}")
        };
        self.post_message(message).await
    }

    /// Posts a multi-kill event
    pub async fn post_multikill(
        &self,
        killer: &str,
        multikill_type: &str,
        game_time: &str,
    ) -> Result<(), String> {
        let emoji = match multikill_type {
            "DOUBLE_KILL" => "⚔️",
            "TRIPLE_KILL" => "🔥",
            "QUADRA_KILL" => "💥",
            "PENTA_KILL" => "🏆",
            _ => "🎯",
        };

        let message = format!(
            "{} **{}** got a {} at {}!",
            emoji,
            killer,
            multikill_type.replace('_', " "),
            game_time
        );
        self.post_message(message).await
    }

    /// Posts an objective event (dragon, baron, tower, etc.)
    pub async fn post_objective(
        &self,
        team: &str,
        objective: &str,
        game_time: &str,
    ) -> Result<(), String> {
        let emoji = match objective {
            obj if obj.contains("DRAGON") => "🐉",
            obj if obj.contains("BARON") => "👹",
            obj if obj.contains("TOWER") => "🗼",
            obj if obj.contains("INHIBITOR") => "🛡️",
            obj if obj.contains("HERALD") => "👁️",
            _ => "🎯",
        };

        let message = format!("{emoji} **{team}** took {objective} at {game_time}");
        self.post_message(message).await
    }

    /// Posts a game start event
    pub async fn post_game_start(&self, game_mode: &str, map: &str) -> Result<(), String> {
        let message = format!("🎮 **Game Started!** {game_mode} on {map}");
        self.post_message(message).await
    }

    /// Posts a game end event
    pub async fn post_game_end(
        &self,
        winning_team: &str,
        game_duration: &str,
    ) -> Result<(), String> {
        let message = format!("🏁 **Game Ended!** {winning_team} won after {game_duration}");
        self.post_message(message).await
    }

    /// Posts a first blood event
    pub async fn post_first_blood(
        &self,
        killer: &str,
        victim: &str,
        game_time: &str,
    ) -> Result<(), String> {
        let message =
            format!("🩸 **FIRST BLOOD!** **{killer}** killed **{victim}** at {game_time}");
        self.post_message(message).await
    }

    /// Posts an ace event
    pub async fn post_ace(&self, team: &str, game_time: &str) -> Result<(), String> {
        let message = format!("💀 **ACE!** **{team}** wiped the enemy team at {game_time}");
        self.post_message(message).await
    }

    /// Plays a configured sound for the specified event
    pub async fn play_sound_for_event(
        &self,
        event: SoundEvent,
        app_handle: Option<&tauri::AppHandle>,
    ) -> Result<(), String> {
        let Some(manager) = &self.songbird else {
            let msg = "Voice manager not initialized".to_string();
            log_sound_error(event, &msg);
            return Err(msg);
        };

        let voice_channel_id = self.voice_channel_id.clone().ok_or_else(|| {
            let msg = "Voice channel not configured".to_string();
            log_sound_error(event, &msg);
            msg
        })?;

        info!(
            "Attempting to play sound for event {:?} in voice {}",
            event, voice_channel_id
        );
        write_sound_log(&format!(
            "[sound] Attempting {:?} in voice {}",
            event, voice_channel_id
        ));
        if let Some(app) = app_handle {
            let _ = app.emit(
                "backend-log",
                format!(
                    "🔊 Attempting sound for {:?} in voice channel {}",
                    event, voice_channel_id
                ),
            );
        }
        let (guild_id, channel_id, channel_name, channel_kind) =
            match self.resolve_voice_channel(&voice_channel_id).await {
                Ok(v) => v,
                Err(e) => {
                    log_sound_error(event, &e);
                    return Err(e);
                }
            };
        write_sound_log(&format!(
            "[sound] Channel lookup: name={:?}, kind={:?}",
            channel_name, channel_kind
        ));

        let handler_lock = match manager.join(guild_id, channel_id).await {
            Ok(lock) => lock,
            Err(e) => {
                let msg = format!("Failed to join voice: {e}");
                log_sound_error(event, &msg);
                return Err(msg);
            }
        };

        let mut handler = handler_lock.lock().await;
        handler.add_global_event(TrackEvent::Error.into(), TrackLogger);
        let _ = handler.mute(false).await;
        let _ = handler.deafen(false).await;
        write_sound_log(&format!(
            "[sound] Handler connected={}, channel_id={:?}",
            handler.current_channel().is_some(),
            handler.current_channel()
        ));
        let cue_key = event.key().to_string();
        let cue = self
            .event_overrides
            .get(&cue_key)
            .cloned()
            .or_else(|| self.sound_pack.cue_for(&cue_key))
            .ok_or_else(|| {
                let msg = format!("No sound mapped for event {}", cue_key);
                log_sound_error(event, &msg);
                msg
            })?;

        let (input, resolved_path) = match Self::cue_to_input(cue) {
            Ok(v) => v,
            Err(e) => {
                log_sound_error(event, &e);
                return Err(e);
            }
        };
        write_sound_log(&format!("[sound] Sending input {}", resolved_path));
        let handle = handler.play_only_input(input);
        let _ = handle.set_volume(1.0);
        if let Err(e) = handle.play() {
            let msg = format!("Failed to start track: {}", e);
            log_sound_error(event, &msg);
        }
        write_sound_log("[sound] play_only_input + play() invoked");
        info!("Queued audio for event {:?} using {}", event, resolved_path);
        write_sound_log(&format!(
            "[sound] Queued {:?} using {}",
            event, resolved_path
        ));
        if let Some(app) = app_handle {
            let _ = app.emit(
                "backend-log",
                format!("🔊 Queued sound for {:?} ({})", event, resolved_path),
            );
        }
        Ok(())
    }

    fn cue_to_input(cue: SoundCue) -> Result<(Input, String), String> {
        match cue {
            SoundCue::File(path) => {
                // Prefer absolute path next to executable to survive packaging
                let resolved_path = if path.is_absolute() {
                    path
                } else {
                    let exe_dir = std::env::current_exe()
                        .ok()
                        .and_then(|p| p.parent().map(std::path::Path::to_path_buf));
                    if let Some(dir) = exe_dir {
                        dir.join(&path)
                    } else {
                        path
                    }
                };

                if !resolved_path.exists() {
                    return Err(format!(
                        "Sound file not found at {:?}",
                        resolved_path.display()
                    ));
                }

                let file = AudioFile::new(resolved_path.clone());
                Ok((Input::from(file), resolved_path.display().to_string()))
            }
            SoundCue::Url(url) => {
                // For URLs, let Songbird/yt-dlp handle streaming
                let yt = songbird::input::YoutubeDl::new(reqwest::Client::new(), url.clone());
                Ok((Input::from(yt), url))
            }
        }
    }

    async fn resolve_voice_channel(
        &self,
        voice_channel_id: &str,
    ) -> Result<(GuildId, ChannelId, Option<String>, Option<u8>), String> {
        let channel = self.fetch_channel_info(voice_channel_id).await?;
        let guild_id = channel
            .guild_id
            .ok_or_else(|| "Voice channel is missing guild id".to_string())?
            .parse::<u64>()
            .map_err(|e| format!("Invalid guild id: {e}"))?;

        let channel_id = channel
            .id
            .parse::<u64>()
            .map_err(|e| format!("Invalid voice channel id: {e}"))?;

        Ok((
            GuildId::new(guild_id),
            ChannelId::new(channel_id),
            channel.name,
            channel.kind,
        ))
    }

    async fn fetch_channel_info(&self, channel_id: &str) -> Result<ChannelLookupResponse, String> {
        let url = format!("https://discord.com/api/v10/channels/{channel_id}");
        let response = self
            .client
            .get(url)
            .header("Authorization", format!("Bot {}", self.token))
            .header("User-Agent", "Scout-for-LoL-Desktop/0.1.0")
            .send()
            .await
            .map_err(|e| format!("Failed to look up channel: {e}"))?;

        if !response.status().is_success() {
            return Err(format!(
                "Channel lookup failed with status {}",
                response.status()
            ));
        }

        response
            .json::<ChannelLookupResponse>()
            .await
            .map_err(|e| format!("Failed to parse channel info: {e}"))
    }

    /// Ensures a voice connection exists using the configured channel
    pub async fn ensure_voice_connected(&self) -> Result<(), String> {
        let Some(manager) = &self.songbird else {
            return Err("Voice manager not initialized".to_string());
        };

        let voice_channel_id = self
            .voice_channel_id
            .clone()
            .ok_or_else(|| "Voice channel not configured".to_string())?;

        let (guild_id, channel_id, _name, _kind) =
            self.resolve_voice_channel(&voice_channel_id).await?;
        let _handler = manager
            .join(guild_id, channel_id)
            .await
            .map_err(|e| format!("Failed to join voice: {e}"))?;

        Ok(())
    }

    /// Updates the configured voice channel ID
    pub fn set_voice_channel_id(&mut self, voice_channel_id: Option<String>) {
        self.voice_channel_id = voice_channel_id;
    }

    /// Gets the current Discord connection status
    #[must_use]
    pub fn get_status(&self) -> DiscordStatus {
        DiscordStatus {
            connected: true,
            channel_name: Some(self.channel_id.clone()),
            voice_connected: self.voice_channel_id.is_some() && self.songbird.is_some(),
            voice_channel_name: self.voice_channel_id.clone(),
            active_sound_pack: Some(self.sound_pack.id.clone()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sound_event_keys() {
        assert_eq!(SoundEvent::Kill.key(), "kill");
        assert_eq!(SoundEvent::GameStart.key(), "gameStart");
        assert_eq!(SoundEvent::GameEnd.key(), "gameEnd");
    }

    #[test]
    fn test_base_pack_contains_keys() {
        let pack = SoundPack::base();
        for key in [
            "gameStart",
            "firstBlood",
            "kill",
            "multiKill",
            "objective",
            "ace",
            "gameEnd",
        ] {
            assert!(pack.cue_for(key).is_some());
        }
    }
}
