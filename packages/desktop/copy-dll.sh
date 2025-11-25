#!/bin/bash
# Copy WebView2Loader.dll alongside the executable for distribution
EXE_PATH="src-tauri/target/x86_64-pc-windows-gnu/release/scout-for-lol-desktop.exe"
DLL_SOURCE="src-tauri/target/x86_64-pc-windows-gnu/release/WebView2Loader.dll"
DLL_DEST="src-tauri/target/x86_64-pc-windows-gnu/release/WebView2Loader.dll"

if [ -f "$DLL_SOURCE" ]; then
    echo "DLL already exists in release directory"
else
    # Try to copy from resources
    if [ -f "src-tauri/resources/WebView2Loader.dll" ]; then
        cp "src-tauri/resources/WebView2Loader.dll" "$DLL_DEST"
        echo "Copied DLL from resources"
    fi
fi
