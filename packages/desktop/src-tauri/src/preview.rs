//! Local audio preview module for sound pack editor
//!
//! Uses rodio for local audio playback (not through Discord voice).

use log::{error, info, warn};
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink};
use std::fs::File;
use std::io::BufReader;
use std::path::PathBuf;
use std::sync::OnceLock;
use tokio::sync::Mutex;

use crate::discord::{download_youtube_to_cache, get_youtube_cache_path, is_youtube_cached};
use crate::sound_pack::SoundSource;

/// Global preview audio state
static PREVIEW_STATE: OnceLock<Mutex<PreviewState>> = OnceLock::new();

/// State for preview audio playback
struct PreviewState {
    /// The output stream (must be kept alive for playback)
    _stream: Option<OutputStream>,
    /// The stream handle for creating sinks
    stream_handle: Option<OutputStreamHandle>,
    /// The current playback sink
    sink: Option<Sink>,
}

impl PreviewState {
    fn new() -> Self {
        Self {
            _stream: None,
            stream_handle: None,
            sink: None,
        }
    }

    /// Initialize the audio output stream if not already done
    fn ensure_stream(&mut self) -> Result<&OutputStreamHandle, String> {
        if self.stream_handle.is_none() {
            let (stream, handle) = OutputStream::try_default()
                .map_err(|e| format!("Failed to create audio output stream: {e}"))?;
            self._stream = Some(stream);
            self.stream_handle = Some(handle);
        }
        self.stream_handle
            .as_ref()
            .ok_or_else(|| "Audio stream not initialized".to_string())
    }

    /// Stop any currently playing preview
    fn stop(&mut self) {
        if let Some(sink) = self.sink.take() {
            sink.stop();
        }
    }

    /// Play a file
    fn play_file(&mut self, path: &PathBuf) -> Result<(), String> {
        // Stop any existing playback
        self.stop();

        // Ensure stream is initialized
        let handle = self.ensure_stream()?;

        // Open and decode the file
        let file = File::open(path)
            .map_err(|e| format!("Failed to open audio file '{}': {e}", path.display()))?;
        let reader = BufReader::new(file);
        let source = Decoder::new(reader)
            .map_err(|e| format!("Failed to decode audio file '{}': {e}", path.display()))?;

        // Create a new sink and play
        let sink = Sink::try_new(handle)
            .map_err(|e| format!("Failed to create audio sink: {e}"))?;
        sink.append(source);
        sink.play();

        self.sink = Some(sink);
        Ok(())
    }
}

/// Get or initialize the preview state
fn get_preview_state() -> &'static Mutex<PreviewState> {
    PREVIEW_STATE.get_or_init(|| Mutex::new(PreviewState::new()))
}

/// Play a preview sound locally
///
/// For file sources, plays directly. For URL sources (YouTube), downloads first if needed.
pub async fn play_preview(source: SoundSource) -> Result<(), String> {
    info!("Playing preview sound: {:?}", source);

    match source {
        SoundSource::File { path } => {
            let path_buf = PathBuf::from(&path);
            if !path_buf.exists() {
                return Err(format!("Audio file not found: {path}"));
            }

            let mut state = get_preview_state().lock().await;
            state.play_file(&path_buf)?;
            info!("Started preview playback: {}", path);
            Ok(())
        }
        SoundSource::Url { url } => {
            // Check if this is a YouTube URL
            if url.contains("youtube.com") || url.contains("youtu.be") {
                // Check if already cached
                let cached_path = if is_youtube_cached(&url) {
                    get_youtube_cache_path(&url)
                } else {
                    // Download first
                    info!("Downloading YouTube audio for preview: {}", url);
                    download_youtube_to_cache(&url).await?
                };

                let mut state = get_preview_state().lock().await;
                state.play_file(&cached_path)?;
                info!("Started preview playback from cache: {}", cached_path.display());
                Ok(())
            } else {
                // For non-YouTube URLs, we could use reqwest to download
                // For now, return an error
                warn!("Non-YouTube URL preview not yet supported: {}", url);
                Err("Only YouTube URLs are currently supported for preview".to_string())
            }
        }
    }
}

/// Stop any currently playing preview sound
pub async fn stop_preview() -> Result<(), String> {
    info!("Stopping preview sound");
    let mut state = get_preview_state().lock().await;
    state.stop();
    Ok(())
}
