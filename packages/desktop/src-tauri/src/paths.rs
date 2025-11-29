//! Centralized path management for the Scout for LoL desktop application.
//!
//! All application data (config, logs, cache, sounds) is stored under a single
//! app data directory to keep things organized and easy to find.
//!
//! Directory structure:
//! ```
//! {app_data_dir}/
//! ├── config.json           # Application configuration
//! ├── logs/                  # All log files
//! │   ├── scout.log         # Main application log (Tauri plugin)
//! │   ├── scout-debug.log   # Debug log for sound/event debugging
//! │   └── startup-log.txt   # Startup diagnostics
//! └── cache/                 # Cached data
//!     ├── sounds/           # Extracted sound files
//!     │   └── base-beep.wav # Bundled beep sound
//!     └── youtube-audio/    # Downloaded YouTube audio
//! ```

use log::{error, info};
use std::path::PathBuf;
use std::sync::OnceLock;

/// Application identifier used for path resolution
const APP_IDENTIFIER: &str = "com.shepherdjerred.scout-for-lol";

/// Global app data directory, initialized once during app setup
static APP_DATA_DIR: OnceLock<PathBuf> = OnceLock::new();

/// Computes the app data directory based on the platform.
/// This can be called before Tauri is initialized.
#[must_use]
pub fn compute_app_data_dir() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(std::env::temp_dir)
        .join(APP_IDENTIFIER)
}

/// Initialize the app data directory. Called during app setup.
/// If already initialized (from early init), this is a no-op.
pub fn init(app_data_dir: PathBuf) {
    // Try to set, but don't panic if already set (from early_init)
    let _ = APP_DATA_DIR.set(app_data_dir.clone());
    info!("App data directory: {}", app_data_dir.display());
}

/// Early initialization using computed paths (before Tauri setup).
/// Call this from main() before building the Tauri app.
pub fn early_init() {
    let app_data_dir = compute_app_data_dir();
    let _ = APP_DATA_DIR.set(app_data_dir);
}

/// Returns the base app data directory.
///
/// # Panics
/// Panics if `init()` has not been called.
#[must_use]
pub fn app_data_dir() -> &'static PathBuf {
    APP_DATA_DIR
        .get()
        .expect("App data directory not initialized - call paths::init() first")
}

/// Returns the base app data directory if initialized, or None.
/// Useful for code that runs before initialization.
#[must_use]
pub fn try_app_data_dir() -> Option<&'static PathBuf> {
    APP_DATA_DIR.get()
}

/// Returns the path to the config file.
#[must_use]
pub fn config_file() -> PathBuf {
    app_data_dir().join("config.json")
}

/// Returns the logs directory.
#[must_use]
pub fn logs_dir() -> PathBuf {
    app_data_dir().join("logs")
}

/// Returns the path to the debug log file.
#[must_use]
pub fn debug_log_file() -> PathBuf {
    logs_dir().join("scout-debug.log")
}

/// Returns the path to the startup log file.
#[must_use]
pub fn startup_log_file() -> PathBuf {
    logs_dir().join("startup-log.txt")
}

/// Returns the cache directory.
#[must_use]
pub fn cache_dir() -> PathBuf {
    app_data_dir().join("cache")
}

/// Returns the sounds cache directory.
#[must_use]
pub fn sounds_cache_dir() -> PathBuf {
    cache_dir().join("sounds")
}

/// Returns the path to the base beep sound file.
#[must_use]
pub fn base_beep_file() -> PathBuf {
    sounds_cache_dir().join("base-beep.wav")
}

/// Returns the YouTube audio cache directory.
#[must_use]
pub fn youtube_cache_dir() -> PathBuf {
    cache_dir().join("youtube-audio")
}

/// Ensures all required directories exist.
/// Call this after `init()` to create the directory structure.
pub fn ensure_directories() {
    let dirs = [logs_dir(), sounds_cache_dir(), youtube_cache_dir()];

    for dir in &dirs {
        if !dir.exists() {
            if let Err(err) = std::fs::create_dir_all(dir) {
                error!("Failed to create directory {}: {}", dir.display(), err);
            } else {
                info!("Created directory: {}", dir.display());
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    // Note: These tests use a different initialization approach since
    // OnceLock can only be set once per process

    #[test]
    fn test_path_structure() {
        // Test that path building works correctly without relying on global state
        let base = PathBuf::from("/test/app/data");

        assert_eq!(
            base.join("config.json"),
            PathBuf::from("/test/app/data/config.json")
        );
        assert_eq!(base.join("logs"), PathBuf::from("/test/app/data/logs"));
        assert_eq!(
            base.join("logs").join("scout-debug.log"),
            PathBuf::from("/test/app/data/logs/scout-debug.log")
        );
        assert_eq!(
            base.join("cache").join("sounds").join("base-beep.wav"),
            PathBuf::from("/test/app/data/cache/sounds/base-beep.wav")
        );
        assert_eq!(
            base.join("cache").join("youtube-audio"),
            PathBuf::from("/test/app/data/cache/youtube-audio")
        );
    }
}
