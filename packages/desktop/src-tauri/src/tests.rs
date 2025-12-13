//! Unit tests for the desktop application

#[cfg(test)]
mod lcu_tests {
    use super::super::lcu::*;

    #[test]
    fn test_lcu_status_default() {
        let status = LcuStatus {
            connected: false,
            summoner_name: None,
            in_game: false,
        };
        assert!(!status.connected);
        assert!(status.summoner_name.is_none());
        assert!(!status.in_game);
    }

    #[test]
    fn test_lcu_status_connected() {
        let status = LcuStatus {
            connected: true,
            summoner_name: Some("TestSummoner".to_string()),
            in_game: true,
        };
        assert!(status.connected);
        assert_eq!(status.summoner_name, Some("TestSummoner".to_string()));
        assert!(status.in_game);
    }
}

#[cfg(test)]
mod discord_tests {
    use super::super::discord::*;

    #[test]
    fn test_discord_status_default() {
        let status = DiscordStatus {
            connected: false,
            channel_name: None,
            voice_connected: false,
            voice_channel_name: None,
            active_sound_pack: None,
        };
        assert!(!status.connected);
        assert!(status.channel_name.is_none());
        assert!(!status.voice_connected);
        assert!(status.voice_channel_name.is_none());
    }

    #[test]
    fn test_discord_status_connected() {
        let status = DiscordStatus {
            connected: true,
            channel_name: Some("general".to_string()),
            voice_connected: true,
            voice_channel_name: Some("lobby".to_string()),
            active_sound_pack: Some("base".to_string()),
        };
        assert!(status.connected);
        assert_eq!(status.channel_name, Some("general".to_string()));
        assert!(status.voice_connected);
        assert_eq!(status.voice_channel_name, Some("lobby".to_string()));
        assert_eq!(status.active_sound_pack, Some("base".to_string()));
    }
}

#[cfg(test)]
mod error_handling_tests {
    #[test]
    fn test_error_message_formatting() {
        let error = "Test error message";
        let formatted = format!("Error: {error}");
        assert_eq!(formatted, "Error: Test error message");
    }

    #[test]
    fn test_result_unwrap_alternative() {
        let value = 42_i32;
        assert_eq!(value, 42);
    }
}
