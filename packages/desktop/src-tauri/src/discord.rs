//! Discord integration module for posting game events to Discord channels

use crate::sound::SoundPack;
use serde::{Deserialize, Serialize};
use serenity::all::{ChannelId, GuildId};
use serenity::async_trait;
use serenity::client::Client as SerenityClient;
use serenity::prelude::{EventHandler, GatewayIntents};
use songbird::SerenityInit;
use tracing::{error, info, warn};

/// Represents the connection status of the Discord client
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscordStatus {
    /// Whether the Discord client is connected
    pub connected: bool,
    /// The name of the Discord channel (if connected)
    pub channel_name: Option<String>,
    /// Whether the voice bridge is connected
    pub voice_connected: bool,
    /// The voice channel name (if connected)
    pub voice_channel_name: Option<String>,
}

/// Discord client for posting game events to a Discord channel
#[derive(Debug, Clone)]
pub struct DiscordClient {
    token: String,
    channel_id: String,
    client: reqwest::Client,
    voice: Option<VoiceBridge>,
    sound_pack: SoundPack,
}

#[derive(Serialize)]
struct MessagePayload {
    content: String,
}

async fn fetch_channel_details(
    client: &reqwest::Client,
    token: &str,
    channel_id: &str,
) -> Result<ChannelInfo, String> {
    let url = format!("https://discord.com/api/v10/channels/{channel_id}");
    let response = client
        .get(&url)
        .header("Authorization", format!("Bot {}", token))
        .header("User-Agent", "Scout-for-LoL-Desktop/0.1.0")
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Discord API: {e}"))?;

    if response.status().is_success() {
        response
            .json::<ChannelInfo>()
            .await
            .map_err(|e| format!("Failed to parse channel details: {e}"))
    } else {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        Err(format!("Discord API error: {status} - {error_text}"))
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChannelInfo {
    id: String,
    #[serde(rename = "type")]
    kind: u8,
    guild_id: Option<String>,
    name: Option<String>,
}

#[derive(Clone, Debug)]
struct VoiceBridge {
    manager: std::sync::Arc<songbird::Songbird>,
    guild_id: GuildId,
    voice_channel: ChannelId,
    channel_name: Option<String>,
}

#[derive(Clone, Copy)]
struct VoiceHandler;

#[async_trait]
impl EventHandler for VoiceHandler {}

impl VoiceBridge {
    async fn new(
        token: &str,
        guild_id: GuildId,
        voice_channel: ChannelId,
        channel_name: Option<String>,
    ) -> Result<Self, String> {
        let intents = GatewayIntents::GUILDS | GatewayIntents::GUILD_VOICE_STATES;
        let mut serenity_client = SerenityClient::builder(token, intents)
            .event_handler(VoiceHandler {})
            .register_songbird()
            .await
            .map_err(|e| format!("Failed to start Discord gateway: {e}"))?;

        let manager = songbird::get(&serenity_client)
            .await
            .ok_or_else(|| "Songbird voice manager missing".to_string())?
            .clone();

        // Run the gateway in the background
        tokio::spawn(async move {
            if let Err(e) = serenity_client.start().await {
                error!("Discord gateway stopped: {}", e);
            }
        });

        let bridge = Self {
            manager,
            guild_id,
            voice_channel,
            channel_name,
        };

        bridge.join().await?;
        Ok(bridge)
    }

    async fn join(&self) -> Result<(), String> {
        self.manager
            .join(self.guild_id, self.voice_channel)
            .await
            .map_err(|e| format!("Failed to join voice channel: {e}"))?;
        Ok(())
    }

    async fn ensure_call(
        &self,
    ) -> Result<std::sync::Arc<tokio::sync::Mutex<songbird::Call>>, String> {
        if let Some(call) = self.manager.get(self.guild_id) {
            return Ok(call);
        }

        self.join().await?;
        self.manager
            .get(self.guild_id)
            .ok_or_else(|| "Voice connection missing after join".to_string())
    }

    async fn play_clip(&self, clip: &crate::sound::SoundClip) -> Result<(), String> {
        let call = self.ensure_call().await?;
        let mut handler = call.lock().await;
        let source = songbird::input::File::new(clip.path.clone())
            .await
            .map_err(|e| format!("Failed to read sound file: {e}"))?;
        handler.play_source(source);
        Ok(())
    }
}

impl DiscordClient {
    /// Creates a new Discord client and validates the connection
    pub async fn new(
        token: String,
        channel_id: String,
        voice_channel_id: Option<String>,
        sound_pack: SoundPack,
    ) -> Result<Self, String> {
        info!("Initializing Discord client...");

        let client = reqwest::Client::builder()
            .build()
            .map_err(|e| format!("Failed to create HTTP client: {e}"))?;

        let text_channel = fetch_channel_details(&client, &token, &channel_id).await?;
        info!("Validated text channel access");

        let voice = if let Some(voice_id) = voice_channel_id.clone() {
            let voice_channel = if voice_id == channel_id {
                text_channel.clone()
            } else {
                fetch_channel_details(&client, &token, &voice_id).await?
            };

            if voice_channel.kind != 2 && voice_channel.kind != 13 {
                warn!(
                    "Channel {} is not a standard voice/stage channel (type {})",
                    voice_id, voice_channel.kind
                );
            }

            let guild_id = voice_channel
                .guild_id
                .as_ref()
                .ok_or_else(|| "Voice channel must belong to a guild".to_string())?
                .parse::<u64>()
                .map_err(|e| format!("Invalid guild id: {e}"))?;

            let voice_channel_num = voice_channel
                .id
                .parse::<u64>()
                .map_err(|e| format!("Invalid voice channel id: {e}"))?;

            Some(
                VoiceBridge::new(
                    &token,
                    GuildId::new(guild_id),
                    ChannelId::new(voice_channel_num),
                    voice_channel.name.clone(),
                )
                .await?,
            )
        } else {
            None
        };

        let discord_client = Self {
            token,
            channel_id,
            client,
            voice,
            sound_pack,
        };

        Ok(discord_client)
    }

    /// Posts a message to the configured Discord channel
    pub async fn post_message(&self, content: String) -> Result<(), String> {
        let url = format!(
            "https://discord.com/api/v10/channels/{}/messages",
            self.channel_id
        );

        let content_clone = content.clone();
        info!("Attempting to post Discord message: {}", content_clone);
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
            info!("Successfully posted message to Discord: {}", content_clone);
            Ok(())
        } else {
            let status = response.status();
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            let message_preview = if content_clone.len() > 50 {
                format!("{}...", &content_clone[..50])
            } else {
                content_clone
            };
            error!(
                "Failed to post Discord message (status {}): {} - Message was: {}",
                status, error_text, message_preview
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

    /// Gets the current Discord connection status
    #[must_use]
    pub fn get_status(&self) -> DiscordStatus {
        DiscordStatus {
            connected: true,
            channel_name: None, // TODO: Fetch actual channel name
            voice_connected: self.voice.is_some(),
            voice_channel_name: self.voice.as_ref().and_then(|v| v.channel_name.clone()),
        }
    }

    /// Plays the configured sound for the event, if available.
    pub async fn play_event_sound(&self, event_key: &str) {
        let Some(voice) = &self.voice else {
            return;
        };

        if let Some(clip) = self.sound_pack.clip_for_event(event_key) {
            if let Err(e) = voice.play_clip(&clip).await {
                warn!("Failed to play sound for {}: {}", event_key, e);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_discord_status_creation() {
        let status = DiscordStatus {
            connected: false,
            channel_name: None,
            voice_connected: false,
            voice_channel_name: None,
        };
        assert!(!status.connected);
        assert!(status.channel_name.is_none());
        assert!(!status.voice_connected);
    }

    #[test]
    fn test_discord_status_connected() {
        let status = DiscordStatus {
            connected: true,
            channel_name: Some("general".to_string()),
            voice_connected: true,
            voice_channel_name: Some("Voice".to_string()),
        };
        assert!(status.connected);
        assert_eq!(status.channel_name, Some("general".to_string()));
        assert!(status.voice_connected);
    }

    #[test]
    fn test_discord_status_serialization() {
        let status = DiscordStatus {
            connected: true,
            channel_name: Some("test-channel".to_string()),
            voice_connected: false,
            voice_channel_name: None,
        };

        let json = serde_json::to_string(&status).ok();
        assert!(json.is_some());

        if let Some(json_str) = json {
            assert!(json_str.contains("connected"));
            assert!(json_str.contains("channelName"));
        }
    }

    #[test]
    fn test_message_payload_creation() {
        let payload = MessagePayload {
            content: "Test message".to_string(),
        };
        assert_eq!(payload.content, "Test message");
    }

    #[test]
    fn test_message_payload_serialization() {
        let payload = MessagePayload {
            content: "Hello, world!".to_string(),
        };

        let json = serde_json::to_string(&payload).ok();
        assert!(json.is_some());

        if let Some(json_str) = json {
            assert!(json_str.contains("content"));
            assert!(json_str.contains("Hello, world!"));
        }
    }

    #[test]
    fn test_game_event_message_format() {
        let event_type = "Game Start";
        let details = "Summoner's Rift 5v5";
        let message = format!("**{event_type}** - {details}");
        assert_eq!(message, "**Game Start** - Summoner's Rift 5v5");
    }

    #[test]
    fn test_kill_message_format() {
        let killer = "Yasuo";
        let victim = "Zed";
        let game_time = "15:32";
        let message = format!("💀 **{killer}** killed **{victim}** at {game_time}");
        assert_eq!(message, "💀 **Yasuo** killed **Zed** at 15:32");
    }

    #[test]
    fn test_multikill_emoji_selection() {
        let test_cases = vec![
            ("DOUBLE_KILL", "⚔️"),
            ("TRIPLE_KILL", "🔥"),
            ("QUADRA_KILL", "💥"),
            ("PENTA_KILL", "🏆"),
            ("UNKNOWN", "🎯"),
        ];

        for (multikill_type, expected_emoji) in test_cases {
            let emoji = match multikill_type {
                "DOUBLE_KILL" => "⚔️",
                "TRIPLE_KILL" => "🔥",
                "QUADRA_KILL" => "💥",
                "PENTA_KILL" => "🏆",
                _ => "🎯",
            };
            assert_eq!(emoji, expected_emoji);
        }
    }

    #[test]
    fn test_objective_emoji_selection() {
        let test_cases = vec![
            ("DRAGON", "🐉"),
            ("BARON", "👹"),
            ("TOWER", "🗼"),
            ("INHIBITOR", "🛡️"),
            ("HERALD", "👁️"),
            ("UNKNOWN", "🎯"),
        ];

        for (objective, expected_emoji) in test_cases {
            let emoji = match objective {
                obj if obj.contains("DRAGON") => "🐉",
                obj if obj.contains("BARON") => "👹",
                obj if obj.contains("TOWER") => "🗼",
                obj if obj.contains("INHIBITOR") => "🛡️",
                obj if obj.contains("HERALD") => "👁️",
                _ => "🎯",
            };
            assert_eq!(emoji, expected_emoji);
        }
    }

    #[test]
    fn test_multikill_type_formatting() {
        let multikill_type = "DOUBLE_KILL";
        let formatted = multikill_type.replace('_', " ");
        assert_eq!(formatted, "DOUBLE KILL");
    }

    #[test]
    fn test_game_start_message() {
        let game_mode = "Ranked Solo/Duo";
        let map = "Summoner's Rift";
        let message = format!("🎮 **Game Started!** {game_mode} on {map}");
        assert!(message.contains("Game Started!"));
        assert!(message.contains(game_mode));
        assert!(message.contains(map));
    }

    #[test]
    fn test_game_end_message() {
        let winning_team = "Blue Team";
        let duration = "32:15";
        let message = format!("🏁 **Game Ended!** {} won after {}", winning_team, duration);
        assert!(message.contains("Game Ended!"));
        assert!(message.contains(winning_team));
        assert!(message.contains(duration));
    }

    #[test]
    fn test_discord_url_format() {
        let channel_id = "123456789";
        let url = format!("https://discord.com/api/v10/channels/{}", channel_id);
        assert_eq!(url, "https://discord.com/api/v10/channels/123456789");
    }

    #[test]
    fn test_discord_message_url_format() {
        let channel_id = "987654321";
        let url = format!(
            "https://discord.com/api/v10/channels/{}/messages",
            channel_id
        );
        assert_eq!(
            url,
            "https://discord.com/api/v10/channels/987654321/messages"
        );
    }
}
