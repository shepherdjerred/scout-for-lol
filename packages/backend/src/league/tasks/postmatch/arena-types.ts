import { z } from "zod";

/**
 * Base participant schema that covers common fields
 */
const BaseParticipantSchema = z.object({
  participantId: z.number(),
  teamId: z.number(),
  championId: z.number(),
  championName: z.string(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  win: z.boolean(),
  // Add other common fields as needed
});

/**
 * Classic mode participant (extends base with classic-specific fields)
 */
export const ClassicParticipantSchema = BaseParticipantSchema.extend({
  // Classic mode uses teamId (100 or 200) for team identification
  teamId: z.union([z.literal(100), z.literal(200)]),
});

/**
 * Arena mode participant (extends base with Arena-specific fields)
 */
export const ArenaParticipantSchema = BaseParticipantSchema.extend({
  // Arena-specific placement and team data
  placement: z.number().min(1).max(8),
  subteamPlacement: z.number().min(1).max(8),
  playerSubteamId: z.number().min(1).max(8),

  // Arena augments
  playerAugment1: z.number(),
  playerAugment2: z.number(),
  playerAugment3: z.number(),
  playerAugment4: z.number(),
  playerAugment5: z.number(),
  playerAugment6: z.number(),

  // Arena scoring system
  PlayerScore0: z.number(),
  PlayerScore1: z.number(),
  PlayerScore2: z.number(),
  PlayerScore3: z.number(),
  PlayerScore4: z.number(),
  PlayerScore5: z.number(),
  PlayerScore6: z.number(),
  PlayerScore7: z.number(),
  PlayerScore8: z.number(),
  PlayerScore9: z.number(),
  PlayerScore10: z.number(),
  PlayerScore11: z.number(),
});

/**
 * Match info schema for Arena matches
 */
export const ArenaMatchInfoSchema = z.object({
  gameMode: z.literal("CHERRY"),
  mapId: z.literal(30),
  queueId: z.literal(1700),
  participants: z.array(ArenaParticipantSchema).length(16),
  // Add other match info fields as needed
  gameCreation: z.number(),
  gameDuration: z.number(),
  gameEndTimestamp: z.number(),
  gameId: z.number(),
  gameStartTimestamp: z.number(),
  gameType: z.string(),
  gameVersion: z.string(),
  platformId: z.string(),
});

/**
 * Match info schema for Classic matches
 */
export const ClassicMatchInfoSchema = z.object({
  gameMode: z.string().refine((mode) => mode !== "CHERRY", {
    message: "Classic matches should not have CHERRY game mode",
  }),
  mapId: z.number().refine((id) => id !== 30, {
    message: "Classic matches should not use Arena map (30)",
  }),
  queueId: z.number().refine((id) => id !== 1700, {
    message: "Classic matches should not use Arena queue (1700)",
  }),
  participants: z.array(ClassicParticipantSchema),
  // Add other match info fields
  gameCreation: z.number(),
  gameDuration: z.number(),
  gameEndTimestamp: z.number(),
  gameId: z.number(),
  gameStartTimestamp: z.number(),
  gameType: z.string(),
  gameVersion: z.string(),
  platformId: z.string(),
});

/**
 * Complete Arena match schema
 */
export const ArenaMatchSchema = z.object({
  metadata: z.object({
    matchId: z.string(),
    participants: z.array(z.string()).length(16),
  }),
  info: ArenaMatchInfoSchema,
});

/**
 * Complete Classic match schema
 */
export const ClassicMatchSchema = z.object({
  metadata: z.object({
    matchId: z.string(),
    participants: z.array(z.string()),
  }),
  info: ClassicMatchInfoSchema,
});

/**
 * Union type for any valid match
 */
export const MatchSchema = z.union([ArenaMatchSchema, ClassicMatchSchema]);

/**
 * Type exports
 */
export type ArenaMatch = z.infer<typeof ArenaMatchSchema>;
export type ClassicMatch = z.infer<typeof ClassicMatchSchema>;
export type ValidMatch = z.infer<typeof MatchSchema>;
export type ArenaParticipant = z.infer<typeof ArenaParticipantSchema>;
export type ClassicParticipant = z.infer<typeof ClassicParticipantSchema>;

/**
 * Utility functions for match parsing and validation
 */
export function parseMatch(data: unknown): ValidMatch {
  return MatchSchema.parse(data);
}

export function parseArenaMatch(data: unknown): ArenaMatch {
  return ArenaMatchSchema.parse(data);
}

export function parseClassicMatch(data: unknown): ClassicMatch {
  return ClassicMatchSchema.parse(data);
}

export function isArenaMatch(data: unknown): data is ArenaMatch {
  return ArenaMatchSchema.safeParse(data).success;
}

export function isClassicMatch(data: unknown): data is ClassicMatch {
  return ClassicMatchSchema.safeParse(data).success;
}

/**
 * Team organization utilities
 */
export function organizeArenaTeams(arenaMatch: ArenaMatch) {
  const teams = new Map<number, ArenaParticipant[]>();

  for (const participant of arenaMatch.info.participants) {
    const subteamId = participant.playerSubteamId;
    if (!teams.has(subteamId)) {
      teams.set(subteamId, []);
    }
    const team = teams.get(subteamId);
    if (team) {
      team.push(participant);
    }
  }

  return Array.from(teams.entries()).map(([subteamId, participants]) => ({
    subteamId,
    participants,
    placement: participants[0]?.subteamPlacement ?? 0,
  }));
}

export function organizeClassicTeams(classicMatch: ClassicMatch) {
  const blueTeam = classicMatch.info.participants.filter(
    (p) => p.teamId === 100
  );
  const redTeam = classicMatch.info.participants.filter(
    (p) => p.teamId === 200
  );

  return {
    blue: blueTeam,
    red: redTeam,
  };
}

/**
 * Arena-specific match result from createMatchObj
 */
export const ArenaMatchResultSchema = z.object({
  matchType: z.literal("arena"),
  match: ArenaMatchSchema,
  queueType: z.string(),
  durationInSeconds: z.number(),
  arenaTeams: z.array(
    z.object({
      subteamId: z.number().min(1).max(8),
      participants: z.array(ArenaParticipantSchema),
      placement: z.number().min(1).max(8),
    })
  ),
  players: z.array(
    z.object({
      playerConfig: z.any(), // Will be properly typed elsewhere
      rankBeforeMatch: z.any().optional(),
      rankAfterMatch: z.any().optional(),
      wins: z.number().optional(),
      losses: z.number().optional(),
      champion: z.any(), // Champion type from existing system
      outcome: z.string(),
      arenaTeam: z.number().min(1).max(8), // Which subteam this player is on
      placement: z.number().min(1).max(8), // Final placement in the arena
      laneOpponent: z.any().optional(),
    })
  ),
});

/**
 * Classic-specific match result from createMatchObj
 */
export const ClassicMatchResultSchema = z.object({
  matchType: z.literal("classic"),
  match: ClassicMatchSchema,
  queueType: z.string(),
  durationInSeconds: z.number(),
  teams: z.object({
    blue: z.array(z.any()), // Champion types from existing system
    red: z.array(z.any()),
  }),
  players: z.array(
    z.object({
      playerConfig: z.any(),
      rankBeforeMatch: z.any().optional(),
      rankAfterMatch: z.any().optional(),
      wins: z.number().optional(),
      losses: z.number().optional(),
      champion: z.any(),
      outcome: z.string(),
      team: z.union([z.literal("blue"), z.literal("red")]),
      lane: z.string().optional(),
      laneOpponent: z.any().optional(),
    })
  ),
});

/**
 * Union type for match results
 */
export const MatchResultSchema = z.union([
  ArenaMatchResultSchema,
  ClassicMatchResultSchema,
]);

/**
 * Type exports for match results
 */
export type ArenaMatchResult = z.infer<typeof ArenaMatchResultSchema>;
export type ClassicMatchResult = z.infer<typeof ClassicMatchResultSchema>;
export type MatchResult = z.infer<typeof MatchResultSchema>;
