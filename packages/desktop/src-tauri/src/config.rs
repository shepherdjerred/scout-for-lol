//! Configuration management module for persisting app settings

use log::{error, info};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    /// Discord bot token
    pub bot_token: Option<String>,
    /// Discord channel ID
    pub channel_id: Option<String>,
    /// Discord voice channel ID for the bot to join
    pub voice_channel_id: Option<String>,
    /// Selected sound pack identifier
    pub sound_pack: Option<String>,
    /// Per-event sound overrides (event key -> sound name or file path)
    pub event_sounds: Option<HashMap<String, String>>,
}

impl Config {
    /// Load config from the app's data directory
    pub fn load(config_path: &PathBuf) -> Self {
        match fs::read_to_string(config_path) {
            Ok(contents) => match serde_json::from_str(&contents) {
                Ok(config) => {
                    info!("Loaded config from {}", config_path.display());
                    config
                }
                Err(e) => {
                    error!("Failed to parse config file: {}", e);
                    Self::default()
                }
            },
            Err(e) => {
                info!("No existing config file found ({}), using defaults", e);
                Self::default()
            }
        }
    }

    /// Save config to the app's data directory
    pub fn save(&self, config_path: &PathBuf) -> Result<(), String> {
        // Ensure parent directory exists
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config directory: {e}"))?;
        }

        let json = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize config: {e}"))?;

        fs::write(config_path, json).map_err(|e| format!("Failed to write config file: {e}"))?;

        info!("Saved config to {}", config_path.display());
        Ok(())
    }
}

#[cfg(test)]
#[allow(clippy::expect_used)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_config_serialization() {
        let config = Config {
            bot_token: Some("test-token".to_string()),
            channel_id: Some("123456".to_string()),
            voice_channel_id: Some("654321".to_string()),
            sound_pack: Some("base".to_string()),
            event_sounds: Some(HashMap::from([(
                "kill".to_string(),
                "sharp-beep".to_string(),
            )])),
        };

        let json = serde_json::to_string(&config).expect("test should serialize");
        assert!(json.contains("botToken"));
        assert!(json.contains("channelId"));
        assert!(json.contains("voiceChannelId"));
        assert!(json.contains("soundPack"));
        assert!(json.contains("test-token"));
        assert!(json.contains("123456"));
        assert!(json.contains("654321"));
    }

    #[test]
    fn test_config_deserialization() {
        let json = r#"{"botToken":"token123","channelId":"channel456"}"#;
        let config: Config = serde_json::from_str(json).expect("test should deserialize");

        assert_eq!(config.bot_token, Some("token123".to_string()));
        assert_eq!(config.channel_id, Some("channel456".to_string()));
        assert!(config.voice_channel_id.is_none());
    }

    #[test]
    fn test_config_default() {
        let config = Config::default();
        assert!(config.bot_token.is_none());
        assert!(config.channel_id.is_none());
        assert!(config.voice_channel_id.is_none());
        assert!(config.sound_pack.is_none());
        assert!(config.event_sounds.is_none());
    }

    #[test]
    fn test_config_save_load() {
        let temp_dir = env::temp_dir();
        let config_path = temp_dir.join("scout-test-config.json");

        // Clean up any existing test file
        let _ = fs::remove_file(&config_path);

        let config = Config {
            bot_token: Some("save-test-token".to_string()),
            channel_id: Some("save-test-channel".to_string()),
            voice_channel_id: Some("save-test-voice".to_string()),
            sound_pack: Some("base".to_string()),
            event_sounds: Some(HashMap::from([(
                "kill".to_string(),
                "sharp-beep".to_string(),
            )])),
        };

        // Save
        config.save(&config_path).expect("test should save");

        // Load
        let loaded = Config::load(&config_path);
        assert_eq!(loaded.bot_token, config.bot_token);
        assert_eq!(loaded.channel_id, config.channel_id);

        // Clean up
        let _ = fs::remove_file(&config_path);
    }

    #[test]
    fn test_config_load_missing_file() {
        let config_path = PathBuf::from("/nonexistent/path/config.json");
        let config = Config::load(&config_path);

        // Should return default config when file doesn't exist
        assert!(config.bot_token.is_none());
        assert!(config.channel_id.is_none());
    }
}
