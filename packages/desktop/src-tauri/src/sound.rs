//! Sound pack management and voice playback helpers.

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;
use tracing::warn;

/// Represents a single sound clip mapped to a game event.
#[derive(Debug, Clone)]
pub struct SoundClip {
    /// The logical event key.
    pub event_key: String,
    /// Path to the audio asset on disk.
    pub path: PathBuf,
}

/// Describes a collection of sounds that can be swapped at runtime.
#[derive(Debug, Clone)]
pub struct SoundPack {
    /// Unique identifier for the pack.
    pub name: String,
    /// Human friendly description.
    pub description: String,
    /// Map of event key to clip.
    pub clips: HashMap<String, SoundClip>,
}

impl SoundPack {
    /// Returns a clip for the provided event key, if present.
    #[must_use]
    pub fn clip_for_event(&self, event_key: &str) -> Option<SoundClip> {
        self.clips.get(event_key).cloned()
    }
}

/// Registry of available sound packs bundled with the desktop app.
#[derive(Debug, Clone)]
pub struct SoundPackRegistry {
    packs: HashMap<String, SoundPack>,
    default_pack: String,
}

impl SoundPackRegistry {
    /// Create a registry with the built-in base pack.
    pub fn with_defaults(resource_dir: &Path) -> Self {
        let base_pack = build_base_pack(resource_dir);
        let default_pack = base_pack.name.clone();
        Self {
            packs: HashMap::from([(base_pack.name.clone(), base_pack)]),
            default_pack,
        }
    }

    /// Get all registered packs.
    #[must_use]
    pub fn all(&self) -> Vec<SoundPack> {
        self.packs.values().cloned().collect()
    }

    /// Resolve a pack by name, falling back to the default.
    #[must_use]
    pub fn get(&self, name: Option<&str>) -> SoundPack {
        if let Some(name) = name {
            if let Some(pack) = self.packs.get(name) {
                return pack.clone();
            }
            warn!("Requested sound pack '{}' not found, using default", name);
        }

        // Safety: default is always inserted during construction.
        self.packs
            .get(&self.default_pack)
            .cloned()
            .expect("default sound pack must exist")
    }
}

fn build_base_pack(resource_dir: &Path) -> SoundPack {
    let base_dir = resource_dir.join("sounds").join("base");
    if let Err(error) = ensure_base_pack_assets(&base_dir) {
        warn!("Failed to generate base sound pack assets: {}", error);
    }

    let mut clips = HashMap::new();

    for (event_key, filename) in [
        ("GameStart", "start.wav"),
        ("GameEnd", "end.wav"),
        ("ChampionKill", "kill.wav"),
        ("FirstBlood", "kill.wav"),
        ("Multikill", "multikill.wav"),
        ("Objective", "objective.wav"),
    ] {
        let path = base_dir.join(filename);
        if path.exists() {
            clips.insert(
                event_key.to_string(),
                SoundClip {
                    event_key: event_key.to_string(),
                    path,
                },
            );
        } else {
            warn!(
                "Missing generated sound '{}' for event '{}'; skipping",
                filename, event_key
            );
        }
    }

    SoundPack {
        name: "base".to_string(),
        description: "Simple built-in beeps for match events".to_string(),
        clips,
    }
}

fn ensure_base_pack_assets(base_dir: &Path) -> Result<(), String> {
    fs::create_dir_all(base_dir)
        .map_err(|error| format!("Failed to create base sound directory: {error}"))?;

    let assets = [
        ("start.wav", 660.0, Duration::from_millis(180)),
        ("end.wav", 330.0, Duration::from_millis(220)),
        ("kill.wav", 880.0, Duration::from_millis(200)),
        ("multikill.wav", 1047.0, Duration::from_millis(260)),
        ("objective.wav", 523.0, Duration::from_millis(240)),
    ];

    for (filename, frequency_hz, duration) in assets {
        let path = base_dir.join(filename);
        if path.exists() {
            continue;
        }

        generate_tone(&path, frequency_hz, duration)?;
    }

    Ok(())
}

fn generate_tone(path: &Path, frequency_hz: f32, duration: Duration) -> Result<(), String> {
    let sample_rate = 44_100u32;
    let amplitude = i16::MAX as f32 * 0.25;
    let samples = (sample_rate as f32 * duration.as_secs_f32()) as usize;

    let spec = hound::WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut writer = hound::WavWriter::create(path, spec)
        .map_err(|error| format!("Failed to create sound file {}: {error}", path.display()))?;

    for n in 0..samples {
        let sample = (2.0 * std::f32::consts::PI * frequency_hz * n as f32 / sample_rate as f32)
            .sin()
            * amplitude;
        writer
            .write_sample(sample as i16)
            .map_err(|error| format!("Failed to write sample for {}: {error}", path.display()))?;
    }

    writer
        .finalize()
        .map_err(|error| format!("Failed to finalize {}: {error}", path.display()))
}

/// DTO returned to the UI for selection.
#[derive(Debug, serde::Serialize)]
pub struct SoundPackSummary {
    /// Identifier used when selecting the pack.
    pub name: String,
    /// Description shown in the UI.
    pub description: String,
    /// Event keys covered by this pack.
    pub events: Vec<String>,
}

impl From<&SoundPack> for SoundPackSummary {
    fn from(pack: &SoundPack) -> Self {
        Self {
            name: pack.name.clone(),
            description: pack.description.clone(),
            events: pack.clips.keys().cloned().collect(),
        }
    }
}

/// Utility for resolving the app's resource path when running in dev vs prod.
pub fn resolve_resource_dir(app: &tauri::AppHandle) -> PathBuf {
    // During development, resources live under `src-tauri/resources`.
    // In production, Tauri bundles them in a platform specific location.
    app.path()
        .resource_dir()
        .unwrap_or_else(|_| PathBuf::from("src-tauri/resources"))
}

/// Determines which sound pack to use based on the configured name.
pub fn select_sound_pack(registry: &SoundPackRegistry, pack_name: Option<&str>) -> SoundPack {
    registry.get(pack_name)
}
