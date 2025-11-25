import { Client, GatewayIntentBits } from "discord.js";
import { z } from "zod";
import type {
  KillEvent,
  FirstBloodEvent,
  MultikillEvent,
  AceEvent,
  ObjectiveEvent,
  GameStateEvent,
} from "./types.js";
import { getChampionDisplayName } from "@scout-for-lol/backend/utils/champion.js";

/**
 * Format a kill event into a Discord message
 */
export function formatKillMessage(event: KillEvent, championNames: Map<string, string>): string {
  const killerChampion = championNames.get(event.killer) ?? event.killer;
  const victimChampion = championNames.get(event.victim) ?? event.victim;

  if (event.assists.length === 0) {
    return `⚔️ **${killerChampion}** killed **${victimChampion}**`;
  }

  if (event.assists.length === 1) {
    const assistChampion = championNames.get(event.assists[0] ?? "") ?? event.assists[0];
    return `⚔️ **${killerChampion}** killed **${victimChampion}** (assist: ${assistChampion})`;
  }

  const assistChampions = event.assists
    .map((assist) => championNames.get(assist) ?? assist)
    .join(", ");
  return `⚔️ **${killerChampion}** killed **${victimChampion}** (assists: ${assistChampions})`;
}

/**
 * Format a first blood event into a Discord message
 */
export function formatFirstBloodMessage(event: FirstBloodEvent, championNames: Map<string, string>): string {
  const recipientChampion = championNames.get(event.recipient) ?? event.recipient;
  return `🩸 **FIRST BLOOD!** ${recipientChampion} got first blood!`;
}

/**
 * Format a multikill event into a Discord message
 */
export function formatMultikillMessage(event: MultikillEvent, championNames: Map<string, string>): string {
  const killerChampion = championNames.get(event.killer) ?? event.killer;
  const multikillNames: Record<number, string> = {
    2: "DOUBLE KILL",
    3: "TRIPLE KILL",
    4: "QUADRA KILL",
    5: "PENTAKILL",
  };
  const multikillName = multikillNames[event.killStreak] ?? `${event.killStreak.toString()}x KILL`;
  return `🔥 **${multikillName}!** ${killerChampion}`;
}

/**
 * Format an ace event into a Discord message
 */
export function formatAceMessage(event: AceEvent): string {
  const teamName = event.acingTeam === "ORDER" ? "Blue" : "Red";
  return `💀 **ACE!** ${teamName} team aced!`;
}

/**
 * Format an objective event into a Discord message
 */
export function formatObjectiveMessage(
  event: ObjectiveEvent,
  championNames: Map<string, string>,
): string {
  const killerChampion = championNames.get(event.killer) ?? event.killer;
  const objectiveEmojis: Record<string, string> = {
    turret: "🏰",
    inhibitor: "🛡️",
    dragon: "🐉",
    baron: "👹",
  };
  const emoji = objectiveEmojis[event.objectiveType] ?? "🎯";
  const objectiveName = event.objectiveName ?? event.objectiveType;

  if (event.assists.length === 0) {
    return `${emoji} **${killerChampion}** destroyed **${objectiveName}**`;
  }

  if (event.assists.length === 1) {
    const assistChampion = championNames.get(event.assists[0] ?? "") ?? event.assists[0];
    return `${emoji} **${killerChampion}** destroyed **${objectiveName}** (assist: ${assistChampion})`;
  }

  const assistChampions = event.assists
    .map((assist) => championNames.get(assist) ?? assist)
    .join(", ");
  return `${emoji} **${killerChampion}** destroyed **${objectiveName}** (assists: ${assistChampions})`;
}

/**
 * Format a game state event into a Discord message
 */
export function formatGameStateMessage(event: GameStateEvent): string {
  if (event.eventType === "start") {
    return `🎮 **Game Started!**`;
  }
  return `🏁 **Game Ended!**`;
}

/**
 * Create a Discord client for LCU spectator
 */
export function createDiscordClient(token: string): Client {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.on("error", (error) => {
    console.error("❌ Discord client error:", error);
  });

  client.on("warn", (warning) => {
    console.warn("⚠️  Discord client warning:", warning);
  });

  return client;
}

/**
 * Send a kill announcement to Discord
 */
export async function sendKillAnnouncement(
  client: Client,
  channelId: string,
  event: KillEvent,
  championNames: Map<string, string>,
): Promise<void> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error(`Channel ${channelId} is not a text channel`);
    }

    const message = formatKillMessage(event, championNames);
    await channel.send(message);
    console.log(`✅ Sent kill announcement: ${message}`);
  } catch (error) {
    const result = z.object({ message: z.string() }).safeParse(error);
    console.error(`❌ Failed to send kill announcement: ${result.success ? result.data.message : String(error)}`);
    throw error;
  }
}

/**
 * Send a first blood announcement to Discord
 */
export async function sendFirstBloodAnnouncement(
  client: Client,
  channelId: string,
  event: FirstBloodEvent,
  championNames: Map<string, string>,
): Promise<void> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error(`Channel ${channelId} is not a text channel`);
    }

    const message = formatFirstBloodMessage(event, championNames);
    await channel.send(message);
    console.log(`✅ Sent first blood announcement: ${message}`);
  } catch (error) {
    const result = z.object({ message: z.string() }).safeParse(error);
    console.error(`❌ Failed to send first blood announcement: ${result.success ? result.data.message : String(error)}`);
    throw error;
  }
}

/**
 * Send a multikill announcement to Discord
 */
export async function sendMultikillAnnouncement(
  client: Client,
  channelId: string,
  event: MultikillEvent,
  championNames: Map<string, string>,
): Promise<void> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error(`Channel ${channelId} is not a text channel`);
    }

    const message = formatMultikillMessage(event, championNames);
    await channel.send(message);
    console.log(`✅ Sent multikill announcement: ${message}`);
  } catch (error) {
    const result = z.object({ message: z.string() }).safeParse(error);
    console.error(`❌ Failed to send multikill announcement: ${result.success ? result.data.message : String(error)}`);
    throw error;
  }
}

/**
 * Send an ace announcement to Discord
 */
export async function sendAceAnnouncement(
  client: Client,
  channelId: string,
  event: AceEvent,
): Promise<void> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error(`Channel ${channelId} is not a text channel`);
    }

    const message = formatAceMessage(event);
    await channel.send(message);
    console.log(`✅ Sent ace announcement: ${message}`);
  } catch (error) {
    const result = z.object({ message: z.string() }).safeParse(error);
    console.error(`❌ Failed to send ace announcement: ${result.success ? result.data.message : String(error)}`);
    throw error;
  }
}

/**
 * Send an objective announcement to Discord
 */
export async function sendObjectiveAnnouncement(
  client: Client,
  channelId: string,
  event: ObjectiveEvent,
  championNames: Map<string, string>,
): Promise<void> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error(`Channel ${channelId} is not a text channel`);
    }

    const message = formatObjectiveMessage(event, championNames);
    await channel.send(message);
    console.log(`✅ Sent objective announcement: ${message}`);
  } catch (error) {
    const result = z.object({ message: z.string() }).safeParse(error);
    console.error(`❌ Failed to send objective announcement: ${result.success ? result.data.message : String(error)}`);
    throw error;
  }
}

/**
 * Send a game state announcement to Discord
 */
export async function sendGameStateAnnouncement(
  client: Client,
  channelId: string,
  event: GameStateEvent,
): Promise<void> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error(`Channel ${channelId} is not a text channel`);
    }

    const message = formatGameStateMessage(event);
    await channel.send(message);
    console.log(`✅ Sent game state announcement: ${message}`);
  } catch (error) {
    const result = z.object({ message: z.string() }).safeParse(error);
    console.error(`❌ Failed to send game state announcement: ${result.success ? result.data.message : String(error)}`);
    throw error;
  }
}

/**
 * Build a map of summoner names to champion names from live game data
 */
export function buildChampionNameMap(
  players: Array<{ summonerName: string; championName: string }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const player of players) {
    // Try to get display name from champion ID if championName is an ID
    const championId = Number.parseInt(player.championName, 10);
    if (!Number.isNaN(championId)) {
      const displayName = getChampionDisplayName(championId);
      map.set(player.summonerName, displayName);
    } else {
      // Already a name, use it directly
      map.set(player.summonerName, player.championName);
    }
  }
  return map;
}
