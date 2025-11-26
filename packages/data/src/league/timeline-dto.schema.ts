import { z } from "zod";

/**
 * Zod schema for Match V5 Timeline API response from Riot Games
 *
 * The timeline contains frame-by-frame game data including:
 * - Participant stats evolution (gold, XP, position)
 * - Game events (kills, item purchases, objectives, etc.)
 */

/**
 * Position DTO - X/Y coordinates on the map
 */
export const TimelinePositionDtoSchema = z.object({
  x: z.number(),
  y: z.number(),
});

/**
 * Champion stats at a specific frame - subset of relevant stats
 */
export const TimelineChampionStatsSchema = z
  .object({
    abilityHaste: z.number().optional(),
    abilityPower: z.number().optional(),
    armor: z.number().optional(),
    armorPen: z.number().optional(),
    armorPenPercent: z.number().optional(),
    attackDamage: z.number().optional(),
    attackSpeed: z.number().optional(),
    bonusArmorPenPercent: z.number().optional(),
    bonusMagicPenPercent: z.number().optional(),
    ccReduction: z.number().optional(),
    cooldownReduction: z.number().optional(),
    health: z.number().optional(),
    healthMax: z.number().optional(),
    healthRegen: z.number().optional(),
    lifesteal: z.number().optional(),
    magicPen: z.number().optional(),
    magicPenPercent: z.number().optional(),
    magicResist: z.number().optional(),
    movementSpeed: z.number().optional(),
    omnivamp: z.number().optional(),
    physicalVamp: z.number().optional(),
    power: z.number().optional(),
    powerMax: z.number().optional(),
    powerRegen: z.number().optional(),
    spellVamp: z.number().optional(),
  })
  .loose();

/**
 * Damage stats for a participant at a specific frame
 */
export const TimelineDamageStatsSchema = z
  .object({
    magicDamageDone: z.number().optional(),
    magicDamageDoneToChampions: z.number().optional(),
    magicDamageTaken: z.number().optional(),
    physicalDamageDone: z.number().optional(),
    physicalDamageDoneToChampions: z.number().optional(),
    physicalDamageTaken: z.number().optional(),
    totalDamageDone: z.number().optional(),
    totalDamageDoneToChampions: z.number().optional(),
    totalDamageTaken: z.number().optional(),
    trueDamageDone: z.number().optional(),
    trueDamageDoneToChampions: z.number().optional(),
    trueDamageTaken: z.number().optional(),
  })
  .loose();

/**
 * Participant frame DTO - state of a participant at a specific frame
 */
export const TimelineParticipantFrameDtoSchema = z
  .object({
    championStats: TimelineChampionStatsSchema.optional(),
    currentGold: z.number(),
    damageStats: TimelineDamageStatsSchema.optional(),
    goldPerSecond: z.number(),
    jungleMinionsKilled: z.number(),
    level: z.number(),
    minionsKilled: z.number(),
    participantId: z.number(),
    position: TimelinePositionDtoSchema,
    timeEnemySpentControlled: z.number(),
    totalGold: z.number(),
    xp: z.number(),
  })
  .loose();

/**
 * Victim damage entry for kill events
 */
export const TimelineVictimDamageSchema = z
  .object({
    basic: z.boolean(),
    magicDamage: z.number(),
    name: z.string(),
    participantId: z.number(),
    physicalDamage: z.number(),
    spellName: z.string(),
    spellSlot: z.number(),
    trueDamage: z.number(),
    type: z.string(),
  })
  .loose();

/**
 * Event DTO - represents an event that occurred during the match
 * Events have varying structures depending on their type
 */
export const TimelineEventDtoSchema = z
  .object({
    // Common fields
    timestamp: z.number(),
    type: z.string(),

    // Kill event fields
    killerId: z.number().optional(),
    victimId: z.number().optional(),
    assistingParticipantIds: z.array(z.number()).optional(),
    position: TimelinePositionDtoSchema.optional(),
    bounty: z.number().optional(),
    killStreakLength: z.number().optional(),
    shutdownBounty: z.number().optional(),
    victimDamageDealt: z.array(TimelineVictimDamageSchema).optional(),
    victimDamageReceived: z.array(TimelineVictimDamageSchema).optional(),

    // Item event fields
    participantId: z.number().optional(),
    itemId: z.number().optional(),
    afterId: z.number().optional(),
    beforeId: z.number().optional(),

    // Skill event fields
    skillSlot: z.number().optional(),
    levelUpType: z.string().optional(),

    // Ward event fields
    wardType: z.string().optional(),
    creatorId: z.number().optional(),

    // Building event fields
    buildingType: z.string().optional(),
    laneType: z.string().optional(),
    teamId: z.number().optional(),
    towerType: z.string().optional(),

    // Monster event fields
    monsterType: z.string().optional(),
    monsterSubType: z.string().optional(),
    killerTeamId: z.number().optional(),

    // Level up fields
    level: z.number().optional(),

    // Gold transformation fields
    goldGain: z.number().optional(),

    // Real timestamp for specific events
    realTimestamp: z.number().optional(),

    // Game end fields
    gameId: z.number().optional(),
    winningTeam: z.number().optional(),
  })
  .loose();

/**
 * Frame DTO - game state at a specific timestamp
 */
export const TimelineFrameDtoSchema = z.object({
  events: z.array(TimelineEventDtoSchema),
  participantFrames: z.record(z.string(), TimelineParticipantFrameDtoSchema),
  timestamp: z.number(),
});

/**
 * Timeline participant info
 */
export const TimelineParticipantInfoSchema = z
  .object({
    participantId: z.number(),
    puuid: z.string(),
  })
  .loose();

/**
 * Timeline Info DTO - main timeline information
 */
export const TimelineInfoDtoSchema = z
  .object({
    endOfGameResult: z.string().optional(),
    frameInterval: z.number(),
    frames: z.array(TimelineFrameDtoSchema),
    gameId: z.number(),
    participants: z.array(TimelineParticipantInfoSchema),
  })
  .loose();

/**
 * Timeline Metadata DTO
 */
export const TimelineMetadataDtoSchema = z.object({
  dataVersion: z.string(),
  matchId: z.string(),
  participants: z.array(z.string()),
});

/**
 * Main TimelineDto schema - represents a match timeline from Riot Games Match V5 API
 */
export const TimelineDtoSchema = z.object({
  metadata: TimelineMetadataDtoSchema,
  info: TimelineInfoDtoSchema,
});

// Export types
export type TimelineDto = z.infer<typeof TimelineDtoSchema>;
export type TimelineInfoDto = z.infer<typeof TimelineInfoDtoSchema>;
export type TimelineMetadataDto = z.infer<typeof TimelineMetadataDtoSchema>;
export type TimelineFrameDto = z.infer<typeof TimelineFrameDtoSchema>;
export type TimelineEventDto = z.infer<typeof TimelineEventDtoSchema>;
export type TimelineParticipantFrameDto = z.infer<typeof TimelineParticipantFrameDtoSchema>;
export type TimelinePositionDto = z.infer<typeof TimelinePositionDtoSchema>;
