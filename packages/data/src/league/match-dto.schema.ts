import { z } from "zod";

/**
 * Zod schema for MatchV5DTOs.MatchDto from the twisted library
 * Based on Riot Games Match V5 API
 *
 * This schema validates the structure of match data received from Riot API or read from S3.
 * While the data in S3 is trusted (we control what goes in), validation provides:
 * 1. Runtime type safety and early error detection
 * 2. Documentation of the expected structure
 * 3. Protection against API changes or data corruption
 */

// Enum types
const DescriptionSchema = z.enum(["primaryStyle", "subStyle"]);

const PositionSchema = z.enum(["", "Invalid", "TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]);

const RoleSchema = z.enum(["SOLO", "NONE", "CARRY", "SUPPORT"]);

const LaneSchema = z.enum(["TOP", "JUNGLE", "MIDDLE", "BOTTOM"]);

// Nested DTOs
const EpicMonsterKillDtoSchema = z
  .object({
    featState: z.number(),
  })
  .strict();

const FeatsDtoSchema = z
  .object({
    EPIC_MONSTER_KILL: EpicMonsterKillDtoSchema,
    FIRST_BLOOD: EpicMonsterKillDtoSchema,
    FIRST_TURRET: EpicMonsterKillDtoSchema,
  })
  .strict();

const ObjectiveDtoSchema = z
  .object({
    first: z.boolean(),
    kills: z.number(),
  })
  .strict();

const ObjectivesDtoSchema = z
  .object({
    baron: ObjectiveDtoSchema,
    champion: ObjectiveDtoSchema,
    dragon: ObjectiveDtoSchema,
    inhibitor: ObjectiveDtoSchema,
    riftHerald: ObjectiveDtoSchema,
    tower: ObjectiveDtoSchema,
    horde: ObjectiveDtoSchema.optional(),
    atakhan: ObjectiveDtoSchema.optional(),
  })
  .strict();

const BanDtoSchema = z
  .object({
    championId: z.number(),
    pickTurn: z.number(),
  })
  .strict();

const TeamDtoSchema = z
  .object({
    bans: z.array(BanDtoSchema),
    objectives: ObjectivesDtoSchema,
    feats: FeatsDtoSchema.optional(),
    teamId: z.number(),
    win: z.boolean(),
  })
  .strict();

const PerkStyleSelectionDtoSchema = z
  .object({
    perk: z.number(),
    var1: z.number(),
    var2: z.number(),
    var3: z.number(),
  })
  .strict();

const PerkStyleDtoSchema = z
  .object({
    description: DescriptionSchema,
    selections: z.array(PerkStyleSelectionDtoSchema),
    style: z.number(),
  })
  .strict();

const PerkStatsDtoSchema = z
  .object({
    defense: z.number(),
    flex: z.number(),
    offense: z.number(),
  })
  .strict();

const PerksDtoSchema = z
  .object({
    statPerks: PerkStatsDtoSchema,
    styles: z.array(PerkStyleDtoSchema),
  })
  .strict();

/**
 * Missions DTO - Arena games only
 * Values are only set in arena games
 */
const MissionsDtoSchema = z
  .object({
    playerScore0: z.number(),
    playerScore1: z.number(),
    playerScore2: z.number(),
    playerScore3: z.number(),
    playerScore4: z.number(),
    playerScore5: z.number(),
    playerScore6: z.number(),
    playerScore7: z.number(),
    playerScore8: z.number(),
    playerScore9: z.number(),
    playerScore10: z.number(),
    playerScore11: z.number(),
  })
  .strict();

/**
 * Challenges DTO - Contains detailed match statistics and challenges
 * Most fields are required. Some fields are optional based on the twisted library types.
 */
const ChallengesDtoSchema = z
  .object({
    "12AssistStreakCount": z.number(),
    HealFromMapSources: z.number(),
    InfernalScalePickup: z.number(),
    SWARM_DefeatAatrox: z.number(),
    SWARM_DefeatBriar: z.number(),
    SWARM_DefeatMiniBosses: z.number(),
    SWARM_EvolveWeapon: z.number(),
    SWARM_Have3Passives: z.number(),
    SWARM_KillEnemy: z.number(),
    SWARM_PickupGold: z.number(),
    SWARM_ReachLevel50: z.number(),
    SWARM_Survive15Min: z.number(),
    SWARM_WinWith5EvolvedWeapons: z.number(),
    abilityUses: z.number(),
    acesBefore15Minutes: z.number(),
    alliedJungleMonsterKills: z.number(),
    baronBuffGoldAdvantageOverThreshold: z.number().optional(),
    baronTakedowns: z.number(),
    blastConeOppositeOpponentCount: z.number(),
    bountyGold: z.number(),
    buffsStolen: z.number(),
    completeSupportQuestInTime: z.number(),
    controlWardTimeCoverageInRiverOrEnemyHalf: z.number().optional(),
    controlWardsPlaced: z.number(),
    damagePerMinute: z.number(),
    damageTakenOnTeamPercentage: z.number(),
    dancedWithRiftHerald: z.number(),
    deathsByEnemyChamps: z.number(),
    dodgeSkillShotsSmallWindow: z.number(),
    doubleAces: z.number(),
    dragonTakedowns: z.number(),
    earliestBaron: z.number().optional(),
    earliestDragonTakedown: z.number().optional(),
    earlyLaningPhaseGoldExpAdvantage: z.number().optional(),
    effectiveHealAndShielding: z.number(),
    elderDragonKillsWithOpposingSoul: z.number(),
    elderDragonMultikills: z.number(),
    enemyChampionImmobilizations: z.number(),
    enemyJungleMonsterKills: z.number(),
    epicMonsterKillsNearEnemyJungler: z.number(),
    epicMonsterKillsWithin30SecondsOfSpawn: z.number(),
    epicMonsterSteals: z.number(),
    epicMonsterStolenWithoutSmite: z.number(),
    firstTurretKilled: z.number(),
    firstTurretKilledTime: z.number().optional(),
    fistBumpParticipation: z.number(),
    flawlessAces: z.number(),
    fullTeamTakedown: z.number(),
    gameLength: z.number(),
    getTakedownsInAllLanesEarlyJungleAsLaner: z.number().optional(),
    goldPerMinute: z.number(),
    hadOpenNexus: z.number(),
    highestCrowdControlScore: z.number().optional(),
    immobilizeAndKillWithAlly: z.number(),
    initialBuffCount: z.number(),
    initialCrabCount: z.number(),
    jungleCsBefore10Minutes: z.number(),
    junglerTakedownsNearDamagedEpicMonster: z.number(),
    junglerKillsEarlyJungle: z.number().optional(),
    kTurretsDestroyedBeforePlatesFall: z.number(),
    kda: z.number(),
    killAfterHiddenWithAlly: z.number(),
    killParticipation: z.number(),
    killedChampTookFullTeamDamageSurvived: z.number(),
    killingSprees: z.number(),
    killsNearEnemyTurret: z.number(),
    killsOnOtherLanesEarlyJungleAsLaner: z.number(),
    killsOnRecentlyHealedByAramPack: z.number(),
    killsUnderOwnTurret: z.number(),
    killsWithHelpFromEpicMonster: z.number(),
    knockEnemyIntoTeamAndKill: z.number(),
    landSkillShotsEarlyGame: z.number(),
    laneMinionsFirst10Minutes: z.number(),
    laningPhaseGoldExpAdvantage: z.number().optional(),
    legendaryCount: z.number(),
    legendaryItemUsed: z.array(z.number()),
    lostAnInhibitor: z.number(),
    maxCsAdvantageOnLaneOpponent: z.number().optional(),
    maxKillDeficit: z.number(),
    maxLevelLeadLaneOpponent: z.number().optional(),
    mejaisFullStackInTime: z.number(),
    moreEnemyJungleThanOpponent: z.number(),
    multiKillOneSpell: z.number(),
    multiTurretRiftHeraldCount: z.number(),
    multikills: z.number(),
    multikillsAfterAggressiveFlash: z.number(),
    mythicItemUsed: z.number().optional(),
    outerTurretExecutesBefore10Minutes: z.number(),
    outnumberedKills: z.number(),
    outnumberedNexusKill: z.number(),
    perfectDragonSoulsTaken: z.number(),
    perfectGame: z.number(),
    pickKillWithAlly: z.number(),
    playedChampSelectPosition: z.number().optional(),
    poroExplosions: z.number(),
    quickCleanse: z.number(),
    quickFirstTurret: z.number(),
    quickSoloKills: z.number(),
    riftHeraldTakedowns: z.number(),
    saveAllyFromDeath: z.number(),
    scuttleCrabKills: z.number(),
    shortestTimeToAceFromFirstTakedown: z.number().optional(),
    skillshotsDodged: z.number(),
    skillshotsHit: z.number(),
    snowballsHit: z.number(),
    soloBaronKills: z.number(),
    soloKills: z.number(),
    stealthWardsPlaced: z.number(),
    survivedSingleDigitHpCount: z.number(),
    survivedThreeImmobilizesInFight: z.number(),
    takedownOnFirstTurret: z.number(),
    takedowns: z.number(),
    takedownsAfterGainingLevelAdvantage: z.number(),
    takedownsBeforeJungleMinionSpawn: z.number(),
    takedownsFirstXMinutes: z.number(),
    takedownsInAlcove: z.number(),
    takedownsInEnemyFountain: z.number(),
    teamBaronKills: z.number(),
    teamDamagePercentage: z.number(),
    teamElderDragonKills: z.number(),
    teamRiftHeraldKills: z.number(),
    threeWardsOneSweeperCount: z.number().optional(),
    tookLargeDamageSurvived: z.number(),
    turretPlatesTaken: z.number(),
    turretTakedowns: z.number(),
    turretsTakenWithRiftHerald: z.number(),
    twentyMinionsIn3SecondsCount: z.number(),
    twoWardsOneSweeperCount: z.number(),
    unseenRecalls: z.number(),
    visionScoreAdvantageLaneOpponent: z.number().optional(),
    visionScorePerMinute: z.number(),
    voidMonsterKill: z.number(),
    wardTakedowns: z.number(),
    wardTakedownsBefore20M: z.number(),
    wardsGuarded: z.number(),
    fastestLegendary: z.number().optional(),
    highestChampionDamage: z.number().optional(),
    killsOnLanersEarlyJungleAsJungler: z.number().optional(),
    highestWardKills: z.number().optional(),
    soloTurretsLategame: z.number().optional(),
    fasterSupportQuestCompletion: z.number().optional(),
    hadAfkTeammate: z.number().optional(),
    earliestElderDragon: z.number().optional(),
  })
  .strict();

/**
 * Participant DTO - Contains all data for a single participant in a match
 * Many fields are optional as they may not be present in all game modes (e.g., Arena vs Classic)
 */
const ParticipantDtoSchema = z
  .object({
    assists: z.number(),
    baitPings: z.number().optional(),
    baronKills: z.number(),
    basicPings: z.number(),
    bountyLevel: z.number().optional(),
    challenges: ChallengesDtoSchema,
    champExperience: z.number(),
    champLevel: z.number(),
    championId: z.number(),
    championName: z.string(),
    championTransform: z.number(),
    allInPings: z.number(),
    assistMePings: z.number(),
    commandPings: z.number(),
    retreatPings: z.number(),
    visionClearedPings: z.number(),
    consumablesPurchased: z.number(),
    damageDealtToBuildings: z.number(),
    damageDealtToObjectives: z.number(),
    damageDealtToTurrets: z.number(),
    damageSelfMitigated: z.number(),
    dangerPings: z.number(),
    deaths: z.number(),
    detectorWardsPlaced: z.number(),
    doubleKills: z.number(),
    dragonKills: z.number(),
    eligibleForProgression: z.boolean(),
    enemyMissingPings: z.number(),
    enemyVisionPings: z.number(),
    firstBloodAssist: z.boolean(),
    firstBloodKill: z.boolean(),
    firstTowerAssist: z.boolean(),
    firstTowerKill: z.boolean(),
    gameEndedInEarlySurrender: z.boolean(),
    gameEndedInSurrender: z.boolean(),
    getBackPings: z.number(),
    goldEarned: z.number(),
    goldSpent: z.number(),
    holdPings: z.number(),
    individualPosition: PositionSchema,
    inhibitorKills: z.number(),
    inhibitorTakedowns: z.number(),
    inhibitorsLost: z.number(),
    item0: z.number(),
    item1: z.number(),
    item2: z.number(),
    item3: z.number(),
    item4: z.number(),
    item5: z.number(),
    item6: z.number(),
    itemsPurchased: z.number(),
    killingSprees: z.number(),
    kills: z.number(),
    lane: LaneSchema,
    largestCriticalStrike: z.number(),
    largestKillingSpree: z.number(),
    largestMultiKill: z.number(),
    longestTimeSpentLiving: z.number(),
    magicDamageDealt: z.number(),
    magicDamageDealtToChampions: z.number(),
    magicDamageTaken: z.number(),
    missions: MissionsDtoSchema,
    needVisionPings: z.number(),
    neutralMinionsKilled: z.number(),
    nexusKills: z.number(),
    nexusLost: z.number(),
    nexusTakedowns: z.number(),
    objectivesStolen: z.number(),
    objectivesStolenAssists: z.number(),
    onMyWayPings: z.number(),
    participantId: z.number(),
    pentaKills: z.number(),
    perks: PerksDtoSchema,
    physicalDamageDealt: z.number(),
    physicalDamageDealtToChampions: z.number(),
    physicalDamageTaken: z.number(),
    profileIcon: z.number(),
    pushPings: z.number(),
    puuid: z.string(),
    quadraKills: z.number(),
    riotIdName: z.string().optional(),
    riotIdGameName: z.string().optional(),
    riotIdTagline: z.string(),
    role: RoleSchema,
    sightWardsBoughtInGame: z.number(),
    spell1Casts: z.number(),
    spell2Casts: z.number(),
    spell3Casts: z.number(),
    spell4Casts: z.number(),
    summoner1Casts: z.number(),
    summoner1Id: z.number(),
    summoner2Casts: z.number(),
    summoner2Id: z.number(),
    summonerId: z.string(),
    summonerLevel: z.number(),
    summonerName: z.string(),
    teamEarlySurrendered: z.boolean(),
    teamId: z.number(),
    teamPosition: PositionSchema,
    timeCCingOthers: z.number(),
    timePlayed: z.number(),
    totalAllyJungleMinionsKilled: z.number(),
    totalDamageDealt: z.number(),
    totalDamageDealtToChampions: z.number(),
    totalDamageShieldedOnTeammates: z.number(),
    totalDamageTaken: z.number(),
    totalEnemyJungleMinionsKilled: z.number(),
    totalHeal: z.number(),
    totalHealsOnTeammates: z.number(),
    totalMinionsKilled: z.number(),
    totalTimeCCDealt: z.number(),
    totalTimeSpentDead: z.number(),
    totalUnitsHealed: z.number(),
    tripleKills: z.number(),
    trueDamageDealt: z.number(),
    trueDamageDealtToChampions: z.number(),
    trueDamageTaken: z.number(),
    turretKills: z.number(),
    turretTakedowns: z.number(),
    turretsLost: z.number(),
    unrealKills: z.number(),
    visionScore: z.number(),
    visionWardsBoughtInGame: z.number(),
    wardsKilled: z.number(),
    wardsPlaced: z.number(),
    win: z.boolean(),
    // Arena only values (optional, only present in Arena games)
    PlayerScore0: z.number().optional(),
    PlayerScore1: z.number().optional(),
    PlayerScore2: z.number().optional(),
    PlayerScore3: z.number().optional(),
    PlayerScore4: z.number().optional(),
    PlayerScore5: z.number().optional(),
    PlayerScore6: z.number().optional(),
    PlayerScore7: z.number().optional(),
    PlayerScore8: z.number().optional(),
    PlayerScore9: z.number().optional(),
    PlayerScore10: z.number().optional(),
    PlayerScore11: z.number().optional(),
    // Lowercase versions (actual API uses these)
    playerScore0: z.number().optional(),
    playerScore1: z.number().optional(),
    playerScore2: z.number().optional(),
    playerScore3: z.number().optional(),
    playerScore4: z.number().optional(),
    playerScore5: z.number().optional(),
    playerScore6: z.number().optional(),
    playerScore7: z.number().optional(),
    playerScore8: z.number().optional(),
    playerScore9: z.number().optional(),
    playerScore10: z.number().optional(),
    playerScore11: z.number().optional(),
    playerAugment1: z.number().optional(),
    playerAugment2: z.number().optional(),
    playerAugment3: z.number().optional(),
    playerAugment4: z.number().optional(),
    playerAugment5: z.number().optional(),
    playerAugment6: z.number().optional(),
    playerSubteamId: z.number().optional(),
    placement: z.number().optional(),
    subteamPlacement: z.number().optional(),
  })
  .strict();

/**
 * Metadata DTO - Contains match identification information
 */
const MetadataDtoSchema = z
  .object({
    dataVersion: z.string(),
    matchId: z.string(),
    participants: z.array(z.string()),
  })
  .strict();

/**
 * Info DTO - Contains the main match information
 */
const InfoDtoSchema = z
  .object({
    endOfGameResult: z.string(),
    gameCreation: z.number(),
    gameDuration: z.number(),
    gameEndTimestamp: z.number(),
    gameId: z.number(),
    gameMode: z.string(),
    gameName: z.string(),
    gameStartTimestamp: z.number(),
    gameType: z.string(),
    gameVersion: z.string(),
    mapId: z.number(),
    participants: z.array(ParticipantDtoSchema),
    platformId: z.string(),
    queueId: z.number(),
    teams: z.array(TeamDtoSchema),
    tournamentCode: z.string(),
  })
  .strict();

/**
 * Main MatchDto schema
 * Represents a complete match from Riot Games Match V5 API
 */
export const MatchDtoSchema = z
  .object({
    metadata: MetadataDtoSchema,
    info: InfoDtoSchema,
  })
  .strict();

// Type inference from the Zod schema
export type MatchDto = z.infer<typeof MatchDtoSchema>;
export type MetadataDto = z.infer<typeof MetadataDtoSchema>;
export type InfoDto = z.infer<typeof InfoDtoSchema>;
export type ParticipantDto = z.infer<typeof ParticipantDtoSchema>;
export type ChallengesDto = z.infer<typeof ChallengesDtoSchema>;
export type PerksDto = z.infer<typeof PerksDtoSchema>;
export type TeamDto = z.infer<typeof TeamDtoSchema>;
export type ObjectivesDto = z.infer<typeof ObjectivesDtoSchema>;
export type MissionsDto = z.infer<typeof MissionsDtoSchema>;
// Internal enum schemas - not exported to avoid conflicts with @scout-for-lol/data/model types
// These are specific to the Riot API MatchDto format
// export { PositionSchema, RoleSchema, LaneSchema, DescriptionSchema };
