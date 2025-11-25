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
