# Scout for League of Legends

A Discord bot that automatically tracks your friends' League of Legends matches in real-time, delivering instant notifications when games start and beautiful post-match reports with detailed statistics directly to your Discord server.

![Match Report Example](./assets/match.png)

## Features

### 🔔 Real-Time Match Notifications

Get instant notifications when subscribed players start a League match, including champion selections and team compositions.

### 📊 Detailed Post-Match Reports

Automatically generated reports featuring:

- Complete performance statistics (KDA, damage, gold, CS)
- Champion portraits and item builds
- Team compositions with role indicators
- Ranked progress tracking with LP gains/losses
- Win/loss outcomes and match duration

### 🏆 Competitions & Leaderboards

Create custom competitions with configurable criteria:

- **Season Support**: Align with League seasons (e.g., 2025 Split 1) or use custom dates
- **Edit Anytime**: Update competition details before they start
- **Multiple Criteria**: Most Wins, Highest Rank, Most Rank Climb, Highest Win Rate, etc.
- **Queue Filtering**: Track specific queues (Solo/Duo, Flex, Arena, ARAM) or all games
- **Real-time Leaderboards**: Automatically updated after each match
- **Champion-Specific**: Create competitions for specific champions

### ⚡ Arena Mode Support

Full support for League's Arena mode with detailed reports for all 16 players, including:

- Match start notifications with duo partner information
- Complete statistics for all 8 teams
- Augments selected throughout the match
- Final placements and performance metrics

### 🌍 Multi-Region Support

Track players across all League of Legends regions: NA, EUW, EUNE, KR, BR, LAN, LAS, TR, RU, OCE, JP, PH, SG, TH, TW, VN, ME.

### ✨ AI-Powered Match Reviews

Intelligent, personalized match analysis powered by advanced AI:

- Performance analysis based on champion, role, and game context
- Comparison to typical performance metrics
- Specific feedback on KDA, CS, damage, and objective participation
- Recognition of exceptional plays and standout performances
- Constructive suggestions for improvement

## Getting Started

### 1. Add Scout to Your Server

[**Click here to add Scout to Discord**](https://discord.com/oauth2/authorize?client_id=1182800769188110366)

You'll need Administrator permissions to add the bot to your server.

### 2. Subscribe to Players

Use the `/subscribe` command to start tracking players:

```
/subscribe channel:#general region:na1 riot-id:PlayerName#TAG alias:FriendlyName
```

**Parameters:**

- `channel`: Discord channel where notifications will be posted
- `region`: League of Legends region (na1, euw1, kr, etc.)
- `riot-id`: Player's Riot ID in format "GameName#TagLine"
- `alias`: Friendly display name for notifications

### 3. Enjoy Automatic Updates

Scout automatically checks for matches every minute and posts:

- Notifications when tracked players start matches
- Detailed reports when games end (2-5 minutes after completion)

## Commands Overview

### Basic Commands

- `/subscribe` - Track a League player in your server
- `/unsubscribe` - Stop tracking a player
- `/listsubscriptions` - View all tracked players

### Competitions

- `/competition create` - Create a new competition with custom criteria
- `/competition edit` - Modify competition details
- `/competition list` - View all competitions (with optional filters)
- `/competition view` - See competition details and leaderboard
- `/competition join` - Join an open competition
- `/competition leave` - Leave a competition
- `/competition cancel` - Cancel a competition (owner only)
- `/competition invite` - Invite users to private competitions

### Admin Commands (Administrator Only)

- `/admin player-edit-alias` - Change a player's display name
- `/admin account-remove` - Remove a Riot account from a player
- `/admin account-add` - Add a Riot account to a player
- `/admin account-transfer` - Transfer an account between players
- `/admin player-merge` - Merge two players into one
- `/admin player-delete` - Permanently delete a player
- `/admin player-link-discord` - Link a Discord user to a player
- `/admin player-unlink-discord` - Unlink a Discord user from a player

### Other Commands

- `/server-info` - Display server statistics
- `/debug` - View bot state (admin only)

## Technical Details

**Built With:**

- TypeScript + Bun runtime
- Discord.js for bot framework
- Prisma for database ORM
- React + Satori for report generation
- Zod for runtime validation
- Dagger for CI/CD

**Architecture:**

- Monorepo structure with multiple packages
- Automatic match polling every minute
- Beautiful SVG/PNG report generation
- SQLite database with optional S3 storage
- Docker containerization for deployment

**Project Structure:**

```
packages/
  backend/      - Discord bot service
  data/         - Shared types and utilities
  report/       - Report generation components
  frontend/     - Web frontend (Astro)
.dagger/        - CI/CD pipeline definitions
```

**Development:**

- Fast local checks with `mise check`
- Full CI validation with `dagger call check`
- Type-safe with strict TypeScript
- Comprehensive test coverage
- Automated linting and formatting

**Environment:**
The bot requires API tokens for Discord and Riot Games. In test mode (`NODE_ENV=test`), placeholder values are used automatically—no real tokens needed for development!

## Links

- **Website**: [scout-for-lol.com](https://scout-for-lol.com)
- **Documentation**: [scout-for-lol.com/docs](https://scout-for-lol.com/docs)
- **Add to Discord**: [Install Scout](https://discord.com/oauth2/authorize?client_id=1182800769188110366)
- **GitHub**: [shepherdjerred/scout-for-lol](https://github.com/shepherdjerred/scout-for-lol)
- **Support**: [GitHub Issues](https://github.com/shepherdjerred/scout-for-lol/issues)

## Privacy & Terms

Scout stores only the minimum data necessary to provide notifications: Riot IDs, aliases, Discord channel information, and match history for competitions. We don't collect personal information beyond what's required for the service.

See [Privacy Policy](https://scout-for-lol.com/privacy) and [Terms of Service](https://scout-for-lol.com/tos) for details.

---

**Never miss a League match again!** Track your friends' games and watch them climb (or fall) in real-time.
