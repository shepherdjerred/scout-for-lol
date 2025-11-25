//! Build script for Tauri desktop application

use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    tauri_build::build();

    // Copy WebView2Loader.dll to resources directory for embedding (Windows targets only)
    let target = env::var("TARGET").unwrap_or_default();
    if target.contains("windows") {
        let resources_dir = PathBuf::from("resources");
        fs::create_dir_all(&resources_dir).ok();

        // Try to find the DLL in the target release directory
        // This works for both GNU and MSVC toolchains
        let target_dir = PathBuf::from("target").join(&target).join("release");
        let dll_path = target_dir.join("WebView2Loader.dll");

        if dll_path.exists() {
            // Copy to resources for embedding
            let dest = resources_dir.join("WebView2Loader.dll");
            if let Err(e) = fs::copy(&dll_path, &dest) {
                eprintln!(
                    "cargo:warning=Failed to copy WebView2Loader.dll to resources: {}",
                    e
                );
            } else {
                println!("cargo:rerun-if-changed={}", dll_path.display());
            }

            // Also ensure DLL stays in release directory (it should already be there)
            // This ensures Windows can find it when loading the executable
            println!(
                "cargo:warning=WebView2Loader.dll should be in: {}",
                dll_path.display()
            );
        }
    }
}
