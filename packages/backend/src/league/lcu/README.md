# LCU Spectator Service

A standalone service that monitors League of Legends games in real-time and sends event announcements to Discord.

## Features

- 🎮 **Real-time monitoring** - Detects events as they happen in-game
- ⚔️ **Kill announcements** - Regular kills with assist tracking
- 🩸 **First Blood** - Special announcement for first kill
- 🔥 **Multikills** - Double, Triple, Quadra, and Pentakill announcements
- 💀 **Ace** - Team ace announcements
- 🏰 **Objectives** - Turret, Inhibitor, Dragon, and Baron kills
- 🎮 **Game state** - Game start/end notifications
- 🌐 **Web GUI** - Easy setup and monitoring interface

## Requirements

- League of Legends client installed and running
- Discord bot token
- Node.js/Bun runtime

## Quick Start

### Option 1: Web GUI (Recommended)

1. Start the service:
   ```bash
   bun run lcu-spectator
   ```

2. Open your browser to `http://localhost:8080`

3. Enter your Discord bot token and channel ID

4. Click "Start Spectator Service"

### Option 2: Environment Variables

1. Set environment variables:
   ```bash
   export DISCORD_TOKEN="your_discord_bot_token"
   export DISCORD_CHANNEL_ID="your_channel_id"
   export LCU_POLL_INTERVAL_MS=2000  # Optional, default: 2000
   export LCU_GUI_PORT=8080          # Optional, default: 8080 (set to 0 to disable)
   ```

2. Run the service:
   ```bash
   bun run lcu-spectator
   ```

## Setup Instructions

### 1. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token
5. Enable "Message Content Intent" in the Bot section
6. Invite the bot to your server with these permissions:
   - Send Messages
   - View Channels

### 2. Get Channel ID

1. Enable Developer Mode in Discord:
   - User Settings → Advanced → Developer Mode
2. Right-click your Discord channel
3. Click "Copy ID"

### 3. Start League Client

1. Make sure League of Legends client is running
2. Log in to your account
3. The service will automatically detect when you're in a game

## How It Works

1. **Connection** - Reads League client lockfile for authentication
2. **Polling** - Checks for game events every 2 seconds (configurable)
3. **Detection** - Identifies new events by tracking event IDs
4. **Announcements** - Sends formatted messages to Discord channel
5. **Monitoring** - Continues until game ends

## Event Types

The service announces these events:

- **ChampionKill** - Regular kills with assists
- **FirstBlood** - First kill of the game
- **DoubleKill** - Two kills in quick succession
- **TripleKill** - Three kills in quick succession
- **QuadraKill** - Four kills in quick succession
- **PentaKill** - Five kills in quick succession
- **Ace** - Entire enemy team eliminated
- **TurretKilled** - Turret destroyed
- **InhibKilled** - Inhibitor destroyed
- **DragonKilled** - Dragon slain
- **BaronKilled** - Baron Nashor slain
- **GameStart** - Game has started
- **GameEnd** - Game has ended

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|------------|
| `DISCORD_TOKEN` | Yes | - | Discord bot token |
| `DISCORD_CHANNEL_ID` | Yes | - | Discord channel ID |
| `LCU_POLL_INTERVAL_MS` | No | 2000 | Polling interval in milliseconds |
| `LCU_LOCKFILE_PATH` | No | Auto-detect | Custom path to League lockfile |
| `LCU_GUI_PORT` | No | 8080 | Port for web GUI (0 to disable) |

### Lockfile Locations

The service automatically detects the lockfile location:

- **Windows**: `%LOCALAPPDATA%\Riot Games\League of Legends\lockfile`
- **macOS**: `~/Library/Application Support/League of Legends/lockfile`
- **Linux**: `~/.config/league-of-legends/lockfile`

## Troubleshooting

### "Lockfile not found"

- Make sure League of Legends client is running
- Ensure you're logged into the client
- Check that the lockfile path is correct

### "LCU API request failed: 404"

- This is normal when no game is active
- The service will automatically detect when a game starts

### Discord messages not sending

- Verify bot token is correct
- Check bot has "Send Messages" permission
- Ensure channel ID is correct
- Make sure "Message Content Intent" is enabled

### Service stops working

- Check League client is still running
- Verify you're still in a game
- Restart the service if needed

## Development

### Running Tests

```bash
bun test packages/backend/src/league/lcu
```

### Project Structure

```
packages/backend/src/league/lcu/
├── types.ts          # Type definitions
├── lockfile.ts       # Lockfile reading and parsing
├── client.ts         # LCU API client
├── events.ts         # Event parsing and filtering
├── discord.ts        # Discord integration
├── spectator.ts      # Main service orchestrator
├── gui.ts            # Web GUI server
└── README.md         # This file
```

## License

GPL-3.0-only
