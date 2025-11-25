# LCU Spectator - Desktop Application

A user-friendly desktop application for Windows that monitors League of Legends games in real-time and sends event announcements to Discord.

## Features

- 🎮 **Easy to Use** - Simple GUI, no technical knowledge required
- ⚔️ **Real-time Events** - Kills, multikills, objectives, and more
- 🔄 **Auto-Updates** - Automatically updates when new versions are released
- 📦 **Cross-Platform** - Windows installer and macOS DMG
- 🎨 **Modern UI** - Beautiful, intuitive interface
- 🐛 **Debug Tools** - Built-in log viewer with filtering and export
- 📝 **Comprehensive Logging** - Detailed logs for troubleshooting

## Installation

### For End Users

1. Download the latest installer from [Releases](https://github.com/shepherdjerred/scout-for-lol/releases)
2. Run `LCU-Spectator-Setup-x.x.x.exe`
3. Follow the installation wizard
4. Launch "LCU Spectator" from Start Menu or Desktop

### For Developers

```bash
# Install dependencies
bun install

# Development mode
cd packages/lcu-spectator
bun run dev

# Build for production
bun run build

# Create Windows installer
bun run package:win

# Create macOS DMG
bun run package:mac
```

## Usage

1. **Start League of Legends** - Make sure the client is running and you're logged in
2. **Get Discord Bot Token**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to "Bot" section and create a bot
   - Copy the bot token
   - Enable "Message Content Intent"
3. **Get Channel ID**:
   - Enable Developer Mode in Discord (User Settings → Advanced)
   - Right-click your Discord channel → Copy ID
4. **Configure**:
   - Enter Discord bot token
   - Enter Discord channel ID
   - Click "Start Spectator Service"
5. **Play** - The app will automatically detect when you're in a game and send announcements!

## Building

### Prerequisites

- Node.js/Bun
- Windows SDK (for building Windows installers)

### Build Commands

```bash
# Development
bun run dev              # Start Electron with hot reload

# Production Build
bun run build            # Build TypeScript and renderer
bun run package:win      # Create Windows installer
bun run dist             # Build and package in one command
```

### Build Output

- `dist/` - Compiled application files
- `release/` - Installer and distributable files
  - `LCU-Spectator-Setup-x.x.x.exe` - Windows installer (NSIS)
  - `LCU-Spectator-x.x.x.dmg` - macOS disk image

## Auto-Updates

The app checks for updates automatically on startup. When an update is available:

1. The app downloads the update in the background
2. A notification appears when the update is ready
3. Click "Restart & Update" to apply the update

Updates are distributed via GitHub Releases.

## Project Structure

```
packages/lcu-spectator/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Main entry point
│   │   └── preload.ts     # Preload script (IPC bridge)
│   └── renderer/          # React UI
│       ├── App.tsx         # Main React component
│       ├── main.tsx        # React entry point
│       ├── styles.css      # Styles
│       └── index.html      # HTML template
├── assets/                 # App icons and resources
├── dist/                   # Build output
├── release/                 # Installer output
├── package.json            # Package configuration
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
└── installer.nsh          # NSIS installer script
```

## Configuration

The app stores configuration in memory during runtime. Settings are not persisted between sessions (by design for security - Discord tokens are not stored).

## Debug Features

The app includes comprehensive debugging tools:

### Debug Logs Panel

Click the "🐛 Debug Logs" button to open the debug panel, which provides:

- **Real-time Log Streaming** - See logs as they happen
- **Log Filtering** - Filter by level (DEBUG, INFO, WARN, ERROR)
- **Auto-scroll** - Automatically scroll to latest logs
- **Export Logs** - Save logs to a text file
- **Open Logs Folder** - Open the logs directory in your file manager
- **Clear Logs** - Clear all stored logs

### Log Files

Logs are stored in:
- **Windows**: `%APPDATA%\LCU Spectator\logs\lcu-spectator.log`
- **macOS**: `~/Library/Application Support/LCU Spectator/logs/lcu-spectator.log`

Logs are automatically rotated when they exceed 5MB, keeping the last 5 log files.

## Troubleshooting

### "League client not detected"

- Make sure League of Legends client is running
- Ensure you're logged into the client
- Try clicking "Refresh" in the app
- Check debug logs for detailed error messages

### "Failed to start spectator service"

- Verify Discord bot token is correct
- Check channel ID is correct
- Ensure bot has "Send Messages" permission
- Make sure "Message Content Intent" is enabled
- Open debug logs to see detailed error information

### App won't start

- **Windows**: Check Windows Event Viewer for errors
- **macOS**: Check Console.app for errors
- Try reinstalling the application
- Check debug logs in the logs folder

### Updates not working

- Check your internet connection
- Verify GitHub Releases are accessible
- Check firewall settings
- Ensure you have write permissions to the app directory

### Debug Logs Show Errors

- Use the debug panel to filter by ERROR level
- Export logs and share them when reporting issues
- Check the logs folder for historical logs

## Development

### Adding New Features

1. Main process code: `src/main/main.ts`
2. UI code: `src/renderer/App.tsx`
3. IPC communication: `src/main/preload.ts`

### Testing

```bash
# Run tests (when available)
bun test
```

## License

GPL-3.0-only
