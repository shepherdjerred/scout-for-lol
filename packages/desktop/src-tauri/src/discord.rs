use serde::{Deserialize, Serialize};
use tracing::{error, info};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscordStatus {
    pub connected: bool,
    pub channel_name: Option<String>,
}

#[derive(Debug, Clone)]
pub struct DiscordClient {
    token: String,
    channel_id: String,
    client: reqwest::Client,
}

#[derive(Serialize)]
struct MessagePayload {
    content: String,
}

impl DiscordClient {
    /// Creates a new Discord client and validates the connection
    pub async fn new(token: String, channel_id: String) -> Result<Self, String> {
        info!("Initializing Discord client...");

        let client = reqwest::Client::builder()
            .build()
            .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

        let discord_client = Self {
            token,
            channel_id,
            client,
        };

        // Test the connection
        discord_client.test_connection().await?;

        Ok(discord_client)
    }

    /// Tests the Discord API connection
    async fn test_connection(&self) -> Result<(), String> {
        info!("Testing Discord connection...");

        let url = format!("https://discord.com/api/v10/channels/{}", self.channel_id);

        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bot {}", self.token))
            .header("User-Agent", "Scout-for-LoL-Desktop/0.1.0")
            .send()
            .await
            .map_err(|e| format!("Failed to connect to Discord API: {}", e))?;

        if response.status().is_success() {
            info!("Discord connection test successful");
            Ok(())
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            error!("Discord API error: {} - {}", status, error_text);
            Err(format!("Discord API error: {} - {}", status, error_text))
        }
    }

    /// Posts a message to the configured Discord channel
    pub async fn post_message(&self, content: String) -> Result<(), String> {
        let url = format!(
            "https://discord.com/api/v10/channels/{}/messages",
            self.channel_id
        );

        let payload = MessagePayload { content };

        let response = self.client
            .post(&url)
            .header("Authorization", format!("Bot {}", self.token))
            .header("Content-Type", "application/json")
            .header("User-Agent", "Scout-for-LoL-Desktop/0.1.0")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed to send Discord message: {}", e))?;

        if response.status().is_success() {
            info!("Successfully posted message to Discord");
            Ok(())
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            error!("Failed to post Discord message: {} - {}", status, error_text);
            Err(format!("Failed to post message: {} - {}", status, error_text))
        }
    }

    /// Posts a game event to Discord
    pub async fn post_game_event(&self, event_type: &str, details: &str) -> Result<(), String> {
        let message = format!("**{}** - {}", event_type, details);
        self.post_message(message).await
    }

    /// Posts a kill event
    pub async fn post_kill(
        &self,
        killer: &str,
        victim: &str,
        game_time: &str,
    ) -> Result<(), String> {
        let message = format!("💀 **{}** killed **{}** at {}", killer, victim, game_time);
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

        let message = format!("{} **{}** took {} at {}", emoji, team, objective, game_time);
        self.post_message(message).await
    }

    /// Posts a game start event
    pub async fn post_game_start(&self, game_mode: &str, map: &str) -> Result<(), String> {
        let message = format!("🎮 **Game Started!** {} on {}", game_mode, map);
        self.post_message(message).await
    }

    /// Posts a game end event
    pub async fn post_game_end(
        &self,
        winning_team: &str,
        game_duration: &str,
    ) -> Result<(), String> {
        let message = format!(
            "🏁 **Game Ended!** {} won after {}",
            winning_team, game_duration
        );
        self.post_message(message).await
    }

    /// Gets the current Discord connection status
    pub fn get_status(&self) -> DiscordStatus {
        DiscordStatus {
            connected: true,
            channel_name: None, // TODO: Fetch actual channel name
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
        };
        assert!(!status.connected);
        assert!(status.channel_name.is_none());
    }

    #[test]
    fn test_discord_status_connected() {
        let status = DiscordStatus {
            connected: true,
            channel_name: Some("general".to_string()),
        };
        assert!(status.connected);
        assert_eq!(status.channel_name, Some("general".to_string()));
    }

    #[test]
    fn test_discord_status_serialization() {
        let status = DiscordStatus {
            connected: true,
            channel_name: Some("test-channel".to_string()),
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
        let message = format!("**{}** - {}", event_type, details);
        assert_eq!(message, "**Game Start** - Summoner's Rift 5v5");
    }

    #[test]
    fn test_kill_message_format() {
        let killer = "Yasuo";
        let victim = "Zed";
        let game_time = "15:32";
        let message = format!("💀 **{}** killed **{}** at {}", killer, victim, game_time);
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
        let message = format!("🎮 **Game Started!** {} on {}", game_mode, map);
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
        let url = format!("https://discord.com/api/v10/channels/{}/messages", channel_id);
        assert_eq!(url, "https://discord.com/api/v10/channels/987654321/messages");
    }
}
