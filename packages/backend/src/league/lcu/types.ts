import { z } from "zod";

/**
 * LCU API base URL structure
 */
export interface LCUConnection {
  port: number;
  password: string;
  protocol: "https" | "http";
}

/**
 * Lockfile data from League client
 */
export const LockfileSchema = z.object({
  name: z.string(),
  pid: z.string(),
  port: z.string(),
  password: z.string(),
  protocol: z.string(),
});

export type Lockfile = z.infer<typeof LockfileSchema>;

/**
 * Live game event from LCU API
 * LCU API events can have various structures, so we use a flexible schema
 */
export const LiveGameEventSchema = z.object({
  EventID: z.number(),
  EventName: z.string(),
  EventTime: z.number(),
  KillerName: z.string().optional(),
  VictimName: z.string().optional(),
  Assisters: z.array(z.string()).optional(),
  TurretKilled: z.string().optional(),
  InhibKilled: z.string().optional(),
  DragonKilled: z.string().optional(),
  BaronKilled: z.string().optional(),
  Acer: z.string().optional(),
  AcingTeam: z.string().optional(),
}).passthrough(); // Allow additional fields

export type LiveGameEvent = z.infer<typeof LiveGameEventSchema>;

/**
 * Player data from live game
 */
export const LivePlayerSchema = z.object({
  championName: z.string(),
  summonerName: z.string(),
  team: z.string(),
  isBot: z.boolean().optional(),
});

export type LivePlayer = z.infer<typeof LivePlayerSchema>;

/**
 * Live game data from LCU API
 * The structure can vary, so we use passthrough to allow flexibility
 */
export const LiveGameDataSchema = z.object({
  activePlayer: z.object({
    championName: z.string(),
    summonerName: z.string(),
  }).passthrough().optional(),
  allPlayers: z.array(LivePlayerSchema),
  events: z.object({
    Events: z.array(LiveGameEventSchema),
  }).passthrough().optional(),
  gameData: z.object({
    gameMode: z.string().optional(),
    gameTime: z.number().optional(),
    mapName: z.string().optional(),
    mapNumber: z.number().optional(),
    mapTerrain: z.string().optional(),
  }).passthrough().optional(),
}).passthrough(); // Allow additional fields

export type LiveGameData = z.infer<typeof LiveGameDataSchema>;

/**
 * Kill event data (processed)
 */
export interface KillEvent {
  killer: string;
  victim: string;
  assists: string[];
  timestamp: number;
  eventId: number;
}

/**
 * First blood event
 */
export interface FirstBloodEvent {
  recipient: string;
  timestamp: number;
  eventId: number;
}

/**
 * Multikill event (Double, Triple, Quadra, Penta)
 */
export interface MultikillEvent {
  killer: string;
  killStreak: number; // 2, 3, 4, or 5
  timestamp: number;
  eventId: number;
}

/**
 * Ace event (team ace)
 */
export interface AceEvent {
  acingTeam: string; // "ORDER" or "CHAOS"
  timestamp: number;
  eventId: number;
}

/**
 * Objective event (turret, inhibitor, dragon, baron)
 */
export interface ObjectiveEvent {
  killer: string;
  objectiveType: "turret" | "inhibitor" | "dragon" | "baron";
  objectiveName?: string;
  assists: string[];
  timestamp: number;
  eventId: number;
}

/**
 * Game state event (start, end)
 */
export interface GameStateEvent {
  eventType: "start" | "end";
  timestamp: number;
  eventId: number;
}
