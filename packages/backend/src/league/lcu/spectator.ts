import { LCUClient } from "./client.js";
import { getLCUConnection } from "./lockfile.js";
import {
  filterNewEvents,
  getHighestEventId,
  parseKillEvent,
  isKillEvent,
  isFirstBloodEvent,
  parseFirstBloodEvent,
  isMultikillEvent,
  parseMultikillEvent,
  isAceEvent,
  parseAceEvent,
  isObjectiveEvent,
  parseObjectiveEvent,
  isGameStateEvent,
  parseGameStateEvent,
} from "./events.js";
import {
  sendKillAnnouncement,
  sendFirstBloodAnnouncement,
  sendMultikillAnnouncement,
  sendAceAnnouncement,
  sendObjectiveAnnouncement,
  sendGameStateAnnouncement,
  buildChampionNameMap,
  createDiscordClient,
} from "./discord.js";
import type { Client } from "discord.js";
import type { LiveGameEvent, LiveGameData } from "./types.js";

/**
 * Configuration for the spectator service
 */
export interface SpectatorConfig {
  discordToken: string;
  discordChannelId: string;
  lockfilePath?: string;
  pollIntervalMs?: number;
}

/**
 * Main spectator service that monitors live games and sends Discord notifications
 */
export class SpectatorService {
  private lcuClient: LCUClient;
  private discordClient: Client;
  private channelId: string;
  private pollIntervalMs: number;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private lastProcessedEventId: number | null = null;
  private championNameMap: Map<string, string> = new Map();
  private isRunning = false;

  constructor(config: SpectatorConfig) {
    this.lcuClient = new LCUClient();
    this.discordClient = createDiscordClient(config.discordToken);
    this.channelId = config.discordChannelId;
    this.pollIntervalMs = config.pollIntervalMs ?? 2000; // Default 2 seconds
  }

  /**
   * Initialize the service by connecting to LCU and Discord
   */
  async initialize(): Promise<void> {
    console.log("🔌 Connecting to League client...");
    const connection = await getLCUConnection();
    this.lcuClient.connect(connection);
    console.log(`✅ Connected to LCU on port ${connection.port.toString()}`);

    console.log("🔌 Logging into Discord...");
    await this.discordClient.login();
    console.log(`✅ Logged into Discord as ${this.discordClient.user?.tag ?? "unknown"}`);

    // Wait for Discord to be ready
    await new Promise<void>((resolve) => {
      if (this.discordClient.isReady()) {
        resolve();
      } else {
        this.discordClient.once("ready", () => {
          resolve();
        });
      }
    });
  }

  /**
   * Update champion name map from live game data
   */
  private updateChampionNameMap(gameData: LiveGameData): void {
    if (!gameData.allPlayers || gameData.allPlayers.length === 0) {
      return;
    }
    const players = gameData.allPlayers.map((p) => ({
      summonerName: p.summonerName,
      championName: p.championName,
    }));
    this.championNameMap = buildChampionNameMap(players);
  }

  /**
   * Process live game events and send announcements
   */
  private async processGameEvents(events: LiveGameEvent[]): Promise<void> {
    const newEvents = filterNewEvents(events, this.lastProcessedEventId);

    // Process all event types
    for (const event of newEvents) {
      try {
        // First Blood
        if (isFirstBloodEvent(event)) {
          const firstBlood = parseFirstBloodEvent(event);
          if (firstBlood) {
            await sendFirstBloodAnnouncement(this.discordClient, this.channelId, firstBlood, this.championNameMap);
          }
        }

        // Multikills (Double, Triple, Quadra, Penta)
        if (isMultikillEvent(event)) {
          const multikill = parseMultikillEvent(event);
          if (multikill) {
            await sendMultikillAnnouncement(this.discordClient, this.channelId, multikill, this.championNameMap);
          }
        }

        // Ace
        if (isAceEvent(event)) {
          const ace = parseAceEvent(event);
          if (ace) {
            await sendAceAnnouncement(this.discordClient, this.channelId, ace);
          }
        }

        // Objectives (Turrets, Inhibitors, Dragons, Baron)
        if (isObjectiveEvent(event)) {
          const objective = parseObjectiveEvent(event);
          if (objective) {
            await sendObjectiveAnnouncement(this.discordClient, this.channelId, objective, this.championNameMap);
          }
        }

        // Regular kills (process after multikills to avoid duplicates)
        if (isKillEvent(event)) {
          const kill = parseKillEvent(event);
          if (kill) {
            await sendKillAnnouncement(this.discordClient, this.channelId, kill, this.championNameMap);
          }
        }

        // Game state (start/end)
        if (isGameStateEvent(event)) {
          const gameState = parseGameStateEvent(event);
          if (gameState) {
            await sendGameStateAnnouncement(this.discordClient, this.channelId, gameState);
          }
        }
      } catch (error) {
        console.error(`Failed to process event ${event.EventID.toString()}:`, error);
        // Continue processing other events even if one fails
      }
    }

    // Update last processed event ID
    const highestId = getHighestEventId(events);
    if (highestId !== null) {
      this.lastProcessedEventId = highestId;
    }
  }

  /**
   * Poll for live game data and process events
   */
  private async poll(): Promise<void> {
    try {
      const isActive = await this.lcuClient.isGameActive();
      if (!isActive) {
        // No active game, reset state
        if (this.lastProcessedEventId !== null) {
          console.log("ℹ️  No active game detected, resetting state");
          this.lastProcessedEventId = null;
          this.championNameMap.clear();
        }
        return;
      }

      // Get live game data
      const gameData = await this.lcuClient.getLiveGameData();
      if (!gameData) {
        return;
      }

      // Update champion name map if we have player data
      if (gameData.allPlayers && gameData.allPlayers.length > 0) {
        this.updateChampionNameMap(gameData);
      }

      // Get and process events
      const events = await this.lcuClient.getLiveGameEvents();
      await this.processGameEvents(events);
    } catch (error) {
      console.error("❌ Error polling LCU:", error);
    }
  }

  /**
   * Start the spectator service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("⚠️  Spectator service is already running");
      return;
    }

    await this.initialize();
    this.isRunning = true;

    console.log(`🎮 Starting spectator service (polling every ${this.pollIntervalMs.toString()}ms)`);
    console.log(`📢 Kill announcements will be sent to Discord channel: ${this.channelId}`);

    // Start polling
    this.pollInterval = setInterval(() => {
      void this.poll();
    }, this.pollIntervalMs);

    // Do an initial poll
    void this.poll();
  }

  /**
   * Stop the spectator service
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log("🛑 Stopping spectator service");
    this.isRunning = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.discordClient.destroy();
  }
}
