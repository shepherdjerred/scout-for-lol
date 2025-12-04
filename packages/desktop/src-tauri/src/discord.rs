//! Discord integration module for posting game events and playing sounds in voice chat

use crate::paths;
use crate::sound_pack as custom_sound_pack;
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use serenity::all::{ChannelId, GatewayIntents, GuildId, Ready};
use serenity::async_trait;
use serenity::client::{Client as SerenityClient, EventHandler};
use songbird::events::{Event, EventContext, EventHandler as VoiceEventHandler, TrackEvent};
use songbird::input::{File as AudioFile, Input};
use songbird::{SerenityInit, Songbird, SongbirdKey};
use std::collections::{HashMap, HashSet};
use std::io::Write;
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::Arc;
use tauri::Emitter;
use tokio::process::Command as AsyncCommand;
use tokio::sync::RwLock;
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
    let beep_path = paths::base_beep_file();

    // Ensure parent directory exists
    if let Some(parent) = beep_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    if !beep_path.exists() {
        if let Err(err) = std::fs::write(&beep_path, BASE_BEEP_BYTES) {
            error!(
                "Failed to write base beep to {}: {}",
                beep_path.display(),
                err
            );
        } else {
            info!("Wrote base beep to {}", beep_path.display());
        }
    }
    beep_path
}

/// Returns the cache directory for YouTube audio files
fn get_youtube_cache_dir() -> PathBuf {
    let cache_dir = paths::youtube_cache_dir();

    if !cache_dir.exists() {
        if let Err(err) = std::fs::create_dir_all(&cache_dir) {
            error!("Failed to create YouTube cache directory: {}", err);
        } else {
            info!("Created YouTube cache directory at {}", cache_dir.display());
        }
    }

    cache_dir
}

/// Generates a unique filename for a YouTube URL by hashing it
fn youtube_url_to_cache_filename(url: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    url.hash(&mut hasher);
    let hash = hasher.finish();

    // Use MP3 format because Symphonia (used by Songbird for local file decoding)
    // does not support Opus codec. MP3 is widely supported and has good compression.
    format!("{hash:016x}.mp3")
}

/// Returns the full cache path for a YouTube URL
pub fn get_youtube_cache_path(url: &str) -> PathBuf {
    get_youtube_cache_dir().join(youtube_url_to_cache_filename(url))
}

/// Checks if a YouTube URL is already cached
pub fn is_youtube_cached(url: &str) -> bool {
    let cache_path = get_youtube_cache_path(url);
    cache_path.exists() && cache_path.metadata().is_ok_and(|m| m.len() > 0)
}

/// Downloads a YouTube URL to the cache using yt-dlp
/// Returns the path to the cached file on success
pub async fn download_youtube_to_cache(url: &str) -> Result<PathBuf, String> {
    let cache_path = get_youtube_cache_path(url);

    // Check if already cached
    if is_youtube_cached(url) {
        info!("YouTube audio already cached: {}", cache_path.display());
        return Ok(cache_path);
    }

    info!(
        "Downloading YouTube audio to cache: {} -> {}",
        url,
        cache_path.display()
    );

    // Use yt-dlp to download audio only in MP3 format
    // MP3 is used because Symphonia (Songbird's decoder for local files) doesn't support Opus
    // The -x flag extracts audio, --audio-format mp3 converts to mp3
    // We use a temp file first to avoid partial downloads
    //
    // Note: yt-dlp appends the format extension to the output path, so if we specify
    // "file_tmp" as output, it will create "file_tmp.mp3". We handle this by using
    // a base temp path without extension.
    let temp_base = cache_path.with_extension(""); // Remove .mp3 extension
    let temp_path = temp_base.with_file_name(format!(
        "{}_tmp",
        temp_base.file_name().unwrap_or_default().to_string_lossy()
    ));
    let expected_output = temp_path.with_extension("mp3");

    let output = AsyncCommand::new("yt-dlp")
        .arg("-x")
        .arg("--audio-format")
        .arg("mp3")
        .arg("--audio-quality")
        .arg("0") // Best quality (320kbps for mp3)
        .arg("-o")
        .arg(&temp_path)
        .arg("--no-playlist")
        .arg("--no-warnings")
        .arg(url)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to run yt-dlp: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        error!("yt-dlp failed: {}", stderr);
        // Clean up temp files if they exist
        let _ = std::fs::remove_file(&temp_path);
        let _ = std::fs::remove_file(&expected_output);
        return Err(format!("yt-dlp failed: {stderr}"));
    }

    // yt-dlp outputs to temp_path.mp3, move it to final location
    if let Err(err) = std::fs::rename(&expected_output, &cache_path) {
        error!("Failed to move cached file: {}", err);
        let _ = std::fs::remove_file(&expected_output);
        return Err(format!("Failed to finalize cached file: {err}"));
    }

    info!(
        "Successfully cached YouTube audio: {}",
        cache_path.display()
    );
    Ok(cache_path)
}

/// Shared cache state for tracking ongoing downloads
#[derive(Debug, Default)]
pub struct YouTubeCacheState {
    /// URLs currently being downloaded (to avoid duplicate downloads)
    downloading: HashSet<String>,
    /// URLs that have been successfully cached (URL -> file path)
    cached: HashMap<String, PathBuf>,
}

impl YouTubeCacheState {
    /// Creates a new cache state
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Checks if a URL is currently being downloaded
    #[allow(dead_code)]
    pub fn is_downloading(&self, url: &str) -> bool {
        self.downloading.contains(url)
    }

    /// Marks a URL as being downloaded
    #[allow(dead_code)]
    pub fn start_download(&mut self, url: &str) {
        self.downloading.insert(url.to_string());
    }

    /// Marks a download as complete
    pub fn finish_download(&mut self, url: &str, path: PathBuf) {
        self.downloading.remove(url);
        self.cached.insert(url.to_string(), path);
    }

    /// Marks a download as failed
    pub fn fail_download(&mut self, url: &str) {
        self.downloading.remove(url);
    }

    /// Gets the cached path for a URL if available
    pub fn get_cached_path(&self, url: &str) -> Option<&PathBuf> {
        self.cached.get(url)
    }

    /// Atomically checks if a download should proceed and marks it as downloading.
    /// Returns true if the download should proceed (was not already downloading or cached).
    /// Returns false if already downloading or cached (download should be skipped).
    pub fn try_start_download(&mut self, url: &str) -> bool {
        if self.downloading.contains(url) || self.cached.contains_key(url) {
            return false;
        }
        self.downloading.insert(url.to_string());
        true
    }
}

fn write_sound_log(message: &str) {
    let log_path = paths::debug_log_file();

    // Ensure parent directory exists
    if let Some(parent) = log_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
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

/// Context for sound rule evaluation
#[derive(Debug, Clone, Default)]
pub struct SoundEventContext {
    /// The event type
    pub event_type: SoundEvent,
    /// Killer's summoner name
    pub killer_name: Option<String>,
    /// Victim's summoner name
    pub victim_name: Option<String>,
    /// Killer's champion name
    pub killer_champion: Option<String>,
    /// Victim's champion name
    pub victim_champion: Option<String>,
    /// Whether the killer is the local player
    pub killer_is_local: bool,
    /// Whether the victim is the local player
    pub victim_is_local: bool,
    /// Multi-kill type (2=double, 3=triple, 4=quadra, 5=penta)
    pub multikill_count: Option<i64>,
    /// Objective type (dragon, baron, herald, tower, inhib)
    pub objective_type: Option<String>,
    /// Dragon type (fire, water, earth, air, elder, etc)
    pub dragon_type: Option<String>,
    /// Whether the objective was stolen
    pub is_stolen: bool,
    /// Whether the actor is on the ally team
    pub is_ally_team: bool,
    /// Game result (win/loss) - for game end events
    pub game_result: Option<String>,
    /// Local player's summoner name
    pub local_player_name: Option<String>,
}

impl SoundEventContext {
    /// Create a new context for a simple event (no additional context)
    pub fn simple(event_type: SoundEvent) -> Self {
        Self {
            event_type,
            ..Default::default()
        }
    }

    /// Create a context for a kill event
    pub fn kill(killer: &str, victim: &str, local_player: Option<&str>) -> Self {
        let killer_is_local = local_player.map(|lp| lp == killer).unwrap_or(false);
        let victim_is_local = local_player.map(|lp| lp == victim).unwrap_or(false);
        Self {
            event_type: SoundEvent::Kill,
            killer_name: Some(killer.to_string()),
            victim_name: Some(victim.to_string()),
            killer_is_local,
            victim_is_local,
            local_player_name: local_player.map(String::from),
            ..Default::default()
        }
    }

    /// Create a context for a multikill event
    pub fn multikill(killer: &str, kill_count: i64, local_player: Option<&str>) -> Self {
        let killer_is_local = local_player.map(|lp| lp == killer).unwrap_or(false);
        Self {
            event_type: SoundEvent::MultiKill,
            killer_name: Some(killer.to_string()),
            killer_is_local,
            multikill_count: Some(kill_count),
            local_player_name: local_player.map(String::from),
            ..Default::default()
        }
    }

    /// Create a context for an objective event
    pub fn objective(
        killer: &str,
        objective: &str,
        stolen: bool,
        dragon_type: Option<&str>,
    ) -> Self {
        Self {
            event_type: SoundEvent::Objective,
            killer_name: Some(killer.to_string()),
            objective_type: Some(objective.to_string()),
            dragon_type: dragon_type.map(String::from),
            is_stolen: stolen,
            ..Default::default()
        }
    }

    /// Create a context for game end
    pub fn game_end(result: &str) -> Self {
        Self {
            event_type: SoundEvent::GameEnd,
            game_result: Some(result.to_string()),
            ..Default::default()
        }
    }

    /// Convert to the sound_pack module's EventContext for rule evaluation
    fn to_event_context(&self) -> custom_sound_pack::EventContext {
        let event_type = match self.event_type {
            SoundEvent::GameStart => Some(custom_sound_pack::EventType::GameStart),
            SoundEvent::GameEnd => Some(custom_sound_pack::EventType::GameEnd),
            SoundEvent::FirstBlood => Some(custom_sound_pack::EventType::FirstBlood),
            SoundEvent::Kill => Some(custom_sound_pack::EventType::Kill),
            SoundEvent::MultiKill => Some(custom_sound_pack::EventType::MultiKill),
            SoundEvent::Objective => Some(custom_sound_pack::EventType::Objective),
            SoundEvent::Ace => Some(custom_sound_pack::EventType::Ace),
        };

        let multikill_type = self.multikill_count.and_then(|count| match count {
            2 => Some(custom_sound_pack::MultikillType::Double),
            3 => Some(custom_sound_pack::MultikillType::Triple),
            4 => Some(custom_sound_pack::MultikillType::Quadra),
            5 => Some(custom_sound_pack::MultikillType::Penta),
            _ => None,
        });

        let objective_type = self.objective_type.as_ref().and_then(|obj| {
            let obj_lower = obj.to_lowercase();
            if obj_lower.contains("dragon") {
                Some(custom_sound_pack::ObjectiveType::Dragon)
            } else if obj_lower.contains("baron") {
                Some(custom_sound_pack::ObjectiveType::Baron)
            } else if obj_lower.contains("herald") {
                Some(custom_sound_pack::ObjectiveType::Herald)
            } else if obj_lower.contains("tower") {
                Some(custom_sound_pack::ObjectiveType::Tower)
            } else if obj_lower.contains("inhib") {
                Some(custom_sound_pack::ObjectiveType::Inhibitor)
            } else {
                None
            }
        });

        let dragon_type = self.dragon_type.as_ref().and_then(|dt| {
            let dt_lower = dt.to_lowercase();
            if dt_lower.contains("infernal") || dt_lower.contains("fire") {
                Some(custom_sound_pack::DragonKind::Infernal)
            } else if dt_lower.contains("mountain") || dt_lower.contains("earth") {
                Some(custom_sound_pack::DragonKind::Mountain)
            } else if dt_lower.contains("ocean") || dt_lower.contains("water") {
                Some(custom_sound_pack::DragonKind::Ocean)
            } else if dt_lower.contains("cloud") || dt_lower.contains("air") {
                Some(custom_sound_pack::DragonKind::Cloud)
            } else if dt_lower.contains("hextech") {
                Some(custom_sound_pack::DragonKind::Hextech)
            } else if dt_lower.contains("chemtech") {
                Some(custom_sound_pack::DragonKind::Chemtech)
            } else if dt_lower.contains("elder") {
                Some(custom_sound_pack::DragonKind::Elder)
            } else {
                None
            }
        });

        let game_result = self.game_result.as_ref().and_then(|res| {
            let res_lower = res.to_lowercase();
            if res_lower.contains("win") || res_lower.contains("victory") {
                Some(custom_sound_pack::GameResult::Victory)
            } else if res_lower.contains("loss") || res_lower.contains("defeat") {
                Some(custom_sound_pack::GameResult::Defeat)
            } else {
                None
            }
        });

        custom_sound_pack::EventContext {
            event_type,
            killer_name: self.killer_name.clone(),
            victim_name: self.victim_name.clone(),
            killer_champion: self.killer_champion.clone(),
            victim_champion: self.victim_champion.clone(),
            killer_is_local: self.killer_is_local,
            victim_is_local: self.victim_is_local,
            multikill_type,
            objective_type,
            dragon_type,
            is_stolen: self.is_stolen,
            is_ally_team: self.is_ally_team,
            game_result,
            local_player_name: self.local_player_name.clone(),
        }
    }
}

/// Events that can trigger audio cues
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum SoundEvent {
    /// Game started
    GameStart,
    /// First blood occurred
    FirstBlood,
    /// Standard champion kill
    #[default]
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

    /// Load a custom sound pack from disk (the full version with rules)
    fn load_custom_full(pack_id: &str) -> Option<custom_sound_pack::SoundPack> {
        let sound_pack_path = paths::sound_pack_file();
        if !sound_pack_path.exists() {
            return None;
        }

        let content = std::fs::read_to_string(&sound_pack_path).ok()?;
        let custom_pack: custom_sound_pack::SoundPack = serde_json::from_str(&content).ok()?;

        if custom_pack.id == pack_id {
            Some(custom_pack)
        } else {
            None
        }
    }

    /// Load a custom sound pack from disk and convert it to a simple SoundPack
    pub fn load_custom(pack_id: &str) -> Option<Self> {
        let sound_pack_path = paths::sound_pack_file();
        if !sound_pack_path.exists() {
            info!("No custom sound pack file found");
            return None;
        }

        let content = match std::fs::read_to_string(&sound_pack_path) {
            Ok(c) => c,
            Err(e) => {
                warn!("Failed to read sound pack file: {}", e);
                return None;
            }
        };

        let custom_pack: custom_sound_pack::SoundPack = match serde_json::from_str(&content) {
            Ok(p) => p,
            Err(e) => {
                warn!("Failed to parse sound pack: {}", e);
                return None;
            }
        };

        // Check if this is the requested pack
        if custom_pack.id != pack_id {
            info!(
                "Custom pack id '{}' doesn't match requested '{}'",
                custom_pack.id, pack_id
            );
            return None;
        }

        info!("Loading custom sound pack: {}", custom_pack.name);

        // Convert custom pack defaults to our cue format
        let mut cues = HashMap::new();
        let base_beep = ensure_base_beep_file();

        // Map event types to our cue keys
        let event_mappings = [
            (
                custom_sound_pack::EventType::GameStart,
                SoundEvent::GameStart.key(),
            ),
            (
                custom_sound_pack::EventType::GameEnd,
                SoundEvent::GameEnd.key(),
            ),
            (
                custom_sound_pack::EventType::FirstBlood,
                SoundEvent::FirstBlood.key(),
            ),
            (custom_sound_pack::EventType::Kill, SoundEvent::Kill.key()),
            (
                custom_sound_pack::EventType::MultiKill,
                SoundEvent::MultiKill.key(),
            ),
            (
                custom_sound_pack::EventType::Objective,
                SoundEvent::Objective.key(),
            ),
            (custom_sound_pack::EventType::Ace, SoundEvent::Ace.key()),
        ];

        for (event_type, key) in event_mappings {
            if let Some(pool) = custom_pack.defaults.get(&event_type) {
                if let Some(sound) = pool.select_sound() {
                    let cue = match &sound.source {
                        custom_sound_pack::SoundSource::File { path } => {
                            SoundCue::File(PathBuf::from(path.clone()))
                        }
                        custom_sound_pack::SoundSource::Url { url } => SoundCue::Url(url.clone()),
                    };
                    cues.insert(key.to_string(), cue);
                    info!("Custom sound for {}: {:?}", key, sound.source);
                }
            } else {
                // Fall back to base beep for unmapped events
                cues.insert(key.to_string(), SoundCue::File(base_beep.clone()));
            }
        }

        Some(Self {
            id: custom_pack.id,
            _name: custom_pack.name,
            _description: custom_pack.description.unwrap_or_default(),
            cues,
        })
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
    /// Full custom sound pack with rules for advanced evaluation
    custom_rules_pack: Option<custom_sound_pack::SoundPack>,
    event_overrides: HashMap<String, SoundCue>,
    /// Shared cache state for YouTube audio downloads
    youtube_cache: Arc<RwLock<YouTubeCacheState>>,
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

        let youtube_cache = Arc::new(RwLock::new(YouTubeCacheState::new()));

        // Load full custom pack with rules if specified
        let custom_rules_pack = match sound_pack.as_deref() {
            Some("base") | None => None,
            Some(pack_id) => SoundPack::load_custom_full(pack_id),
        };

        let discord_client = Self {
            token: token.clone(),
            channel_id: channel_id.clone(),
            voice_channel_id,
            client,
            songbird: None,
            sound_pack: match sound_pack.as_deref() {
                Some("base") | None => SoundPack::base(),
                Some(pack_id) => {
                    // Try to load the custom sound pack
                    match SoundPack::load_custom(pack_id) {
                        Some(custom) => {
                            info!("Loaded custom sound pack: {}", pack_id);
                            custom
                        }
                        None => {
                            info!(
                                "Custom sound pack `{}` not found, falling back to base",
                                pack_id
                            );
                            SoundPack::base()
                        }
                    }
                }
            },
            custom_rules_pack,
            event_overrides: HashMap::new(),
            youtube_cache,
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
            let mut youtube_urls: Vec<String> = Vec::new();

            for (event, value) in map {
                let cue = if let Some(base_cue) = self.sound_pack.cue_for(&value) {
                    base_cue
                } else if value.starts_with("http://") || value.starts_with("https://") {
                    // Track YouTube URLs for eager downloading
                    if value.contains("youtube.com") || value.contains("youtu.be") {
                        youtube_urls.push(value.clone());
                    }
                    SoundCue::Url(value)
                } else {
                    SoundCue::File(PathBuf::from(value))
                };
                self.event_overrides.insert(event, cue);
            }

            // Eagerly download all YouTube URLs in the background
            for url in youtube_urls {
                let cache = Arc::clone(&self.youtube_cache);
                tokio::spawn(async move {
                    // Check if already cached on disk (no lock needed for filesystem check)
                    if is_youtube_cached(&url) {
                        let cached_path = get_youtube_cache_path(&url);
                        info!("YouTube URL already cached on disk: {}", url);
                        let mut state = cache.write().await;
                        // Use finish_download to update in-memory state (it handles if already present)
                        state.finish_download(&url, cached_path);
                        return;
                    }

                    // Atomically check if already downloading/cached and mark as downloading
                    // This prevents race conditions where multiple tasks could start the same download
                    {
                        let mut state = cache.write().await;
                        if !state.try_start_download(&url) {
                            // Already downloading or cached, skip
                            return;
                        }
                    }

                    // Download
                    info!("Eagerly downloading YouTube audio: {}", url);
                    match download_youtube_to_cache(&url).await {
                        Ok(path) => {
                            info!(
                                "Successfully cached YouTube audio: {} -> {}",
                                url,
                                path.display()
                            );
                            let mut state = cache.write().await;
                            state.finish_download(&url, path);
                        }
                        Err(err) => {
                            warn!("Failed to cache YouTube audio {}: {}", url, err);
                            let mut state = cache.write().await;
                            state.fail_download(&url);
                        }
                    }
                });
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

        let (input, resolved_path) = match self.cue_to_input(cue).await {
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

    /// Plays a sound for an event with full context for rules evaluation
    pub async fn play_sound_for_event_with_context(
        &self,
        context: &SoundEventContext,
        app_handle: Option<&tauri::AppHandle>,
    ) -> Result<(), String> {
        let event = context.event_type;

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
            "Attempting to play sound for event {:?} with context in voice {}",
            event, voice_channel_id
        );
        write_sound_log(&format!(
            "[sound] Attempting {:?} with rules in voice {}",
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

        // Try rules evaluation first if custom pack with rules is available
        let (cue, volume) = if let Some(custom_pack) = &self.custom_rules_pack {
            let event_context = context.to_event_context();
            if let Some((sound_entry, vol)) = custom_pack.select_sound_for_event(&event_context) {
                // Convert SoundEntry to SoundCue
                let cue = match &sound_entry.source {
                    custom_sound_pack::SoundSource::File { path } => {
                        SoundCue::File(PathBuf::from(path.clone()))
                    }
                    custom_sound_pack::SoundSource::Url { url } => SoundCue::Url(url.clone()),
                };
                info!(
                    "Rule matched for {:?}, using sound '{}' with volume {}",
                    event, sound_entry.id, vol
                );
                (cue, vol)
            } else {
                // Fall back to default lookup
                let cue_key = event.key().to_string();
                let fallback_cue = self
                    .event_overrides
                    .get(&cue_key)
                    .cloned()
                    .or_else(|| self.sound_pack.cue_for(&cue_key))
                    .ok_or_else(|| {
                        let msg = format!("No sound mapped for event {}", cue_key);
                        log_sound_error(event, &msg);
                        msg
                    })?;
                (fallback_cue, 1.0)
            }
        } else {
            // No custom rules pack, use standard lookup
            let cue_key = event.key().to_string();
            let fallback_cue = self
                .event_overrides
                .get(&cue_key)
                .cloned()
                .or_else(|| self.sound_pack.cue_for(&cue_key))
                .ok_or_else(|| {
                    let msg = format!("No sound mapped for event {}", cue_key);
                    log_sound_error(event, &msg);
                    msg
                })?;
            (fallback_cue, 1.0)
        };

        let (input, resolved_path) = match self.cue_to_input(cue).await {
            Ok(v) => v,
            Err(e) => {
                log_sound_error(event, &e);
                return Err(e);
            }
        };

        write_sound_log(&format!(
            "[sound] Sending input {} at volume {}",
            resolved_path, volume
        ));
        let handle = handler.play_only_input(input);
        let _ = handle.set_volume(volume);
        if let Err(e) = handle.play() {
            let msg = format!("Failed to start track: {}", e);
            log_sound_error(event, &msg);
        }
        write_sound_log("[sound] play_only_input + play() invoked");
        info!(
            "Queued audio for event {:?} using {} at volume {}",
            event, resolved_path, volume
        );
        write_sound_log(&format!(
            "[sound] Queued {:?} using {} vol={}",
            event, resolved_path, volume
        ));
        if let Some(app) = app_handle {
            let _ = app.emit(
                "backend-log",
                format!(
                    "🔊 Queued sound for {:?} ({}) vol={:.0}%",
                    event,
                    resolved_path,
                    volume * 100.0
                ),
            );
        }
        Ok(())
    }

    async fn cue_to_input(&self, cue: SoundCue) -> Result<(Input, String), String> {
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
                // Check if this is a YouTube URL that might be cached
                if url.contains("youtube.com") || url.contains("youtu.be") {
                    // First check in-memory cache state
                    {
                        let state = self.youtube_cache.read().await;
                        if let Some(cached_path) = state.get_cached_path(&url) {
                            if cached_path.exists() {
                                info!(
                                    "Using cached YouTube audio from memory state: {}",
                                    cached_path.display()
                                );
                                let file = AudioFile::new(cached_path.clone());
                                return Ok((Input::from(file), cached_path.display().to_string()));
                            }
                        }
                    }

                    // Check if cached on disk (may have been downloaded in a previous session)
                    if is_youtube_cached(&url) {
                        let cached_path = get_youtube_cache_path(&url);
                        info!(
                            "Using cached YouTube audio from disk: {}",
                            cached_path.display()
                        );

                        // Update in-memory state
                        {
                            let mut state = self.youtube_cache.write().await;
                            state.finish_download(&url, cached_path.clone());
                        }

                        let file = AudioFile::new(cached_path.clone());
                        return Ok((Input::from(file), cached_path.display().to_string()));
                    }

                    // Not cached - download synchronously (blocking but ensures first play works)
                    // This path should rarely be hit if eager downloading worked
                    warn!(
                        "YouTube audio not cached, downloading synchronously: {}",
                        url
                    );
                    match download_youtube_to_cache(&url).await {
                        Ok(cached_path) => {
                            info!(
                                "Downloaded and cached YouTube audio: {}",
                                cached_path.display()
                            );

                            // Update in-memory state
                            {
                                let mut state = self.youtube_cache.write().await;
                                state.finish_download(&url, cached_path.clone());
                            }

                            let file = AudioFile::new(cached_path.clone());
                            return Ok((Input::from(file), cached_path.display().to_string()));
                        }
                        Err(err) => {
                            // Fall back to streaming via Songbird's YoutubeDl
                            warn!(
                                "Failed to cache YouTube audio, falling back to streaming: {}",
                                err
                            );
                            let yt = songbird::input::YoutubeDl::new(
                                reqwest::Client::new(),
                                url.clone(),
                            );
                            return Ok((Input::from(yt), url));
                        }
                    }
                }

                // For non-YouTube URLs, use Songbird's streaming
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
        // Ensure paths are initialized before testing
        // early_init() is safe to call multiple times (OnceLock handles it)
        paths::early_init();

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
