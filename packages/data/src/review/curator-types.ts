/**
 * Type definitions for curated match data used in AI review generation
 */

export type CuratedParticipant = {
  // Identity
  riotIdGameName: string;
  championName: string;
  championId: number;
  teamId: "Blue" | "Red";
  teamPosition: string;
  individualPosition: string;

  // Core stats
  kills: number;
  deaths: number;
  assists: number;
  champLevel: number;
  champExperience: number;

  // Multikills & Sprees
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  killingSprees: number;

  // First actions
  firstBloodKill: boolean;
  firstBloodAssist: boolean;
  firstTowerKill: boolean;
  firstTowerAssist: boolean;

  // Items (translated with descriptions)
  items: { id: number; name: string; description: string; plaintext?: string | undefined }[];
  itemsPurchased: number;
  consumablesPurchased: number;

  // Summoner spells (translated with descriptions)
  summonerSpells: { id: number; name: string; description: string; casts: number }[];

  // Runes (translated with descriptions)
  perks: {
    primaryStyle: { id: number; name: string };
    subStyle: { id: number; name: string };
    primarySelections: {
      id: number;
      name: string;
      description: string;
      var1: number;
      var2: number;
      var3: number;
    }[];
    subSelections: { id: number; name: string; description: string; var1: number; var2: number; var3: number }[];
    statPerks: { offense: number; flex: number; defense: number };
  };

  // Champion abilities (with descriptions)
  championAbilities?:
    | {
        passive: { name: string; description: string };
        spells: { name: string; description: string; tooltip: string }[];
      }
    | undefined;

  // Ability casts
  spell1Casts: number;
  spell2Casts: number;
  spell3Casts: number;
  spell4Casts: number;

  // Economy
  goldEarned: number;
  goldSpent: number;

  // Damage - Champion
  totalDamageDealtToChampions: number;
  physicalDamageDealtToChampions: number;
  magicDamageDealtToChampions: number;
  trueDamageDealtToChampions: number;
  largestCriticalStrike: number;

  // Damage - Taken
  totalDamageTaken: number;
  physicalDamageTaken: number;
  magicDamageTaken: number;
  trueDamageTaken: number;
  damageSelfMitigated: number;

  // Healing & Shielding
  totalHeal: number;
  totalHealsOnTeammates: number;
  totalDamageShieldedOnTeammates: number;
  totalUnitsHealed: number;

  // CS & Farming
  totalMinionsKilled: number;
  neutralMinionsKilled: number;

  // Vision
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  detectorWardsPlaced: number;
  visionWardsBoughtInGame: number;

  // Communication (Pings)
  allInPings: number;
  assistMePings: number;
  baitPings: number;
  basicPings: number;
  commandPings: number;
  dangerPings: number;
  enemyMissingPings: number;
  enemyVisionPings: number;
  getBackPings: number;
  holdPings: number;
  needVisionPings: number;
  onMyWayPings: number;
  pushPings: number;
  visionClearedPings: number;

  // Objectives
  baronKills: number;
  dragonKills: number;
  inhibitorKills: number;
  turretKills: number;
  turretTakedowns: number;
  damageDealtToTurrets: number;
  damageDealtToObjectives: number;
  damageDealtToBuildings: number;

  // CC & Crowd Control
  timeCCingOthers: number;
  totalTimeCCDealt: number;

  // Time stats
  timePlayed: number;
  totalTimeSpentDead: number;
  longestTimeSpentLiving: number;

  // Challenges (comprehensive set) - optional as some game modes don't include this data
  challenges?:
    | {
        // Core performance
        killParticipation?: number | undefined;
        soloKills?: number | undefined;
        damagePerMinute?: number | undefined;
        goldPerMinute?: number | undefined;
        visionScorePerMinute?: number | undefined;

        // Mechanics
        skillshotsHit?: number | undefined;
        skillshotsDodged?: number | undefined;
        enemyChampionImmobilizations?: number | undefined;

        // Damage metrics
        teamDamagePercentage?: number | undefined;
        damageTakenOnTeamPercentage?: number | undefined;

        // Vision
        controlWardsPlaced?: number | undefined;
        controlWardTimeCoverageInRiverOrEnemyHalf?: number | undefined;
        visionScoreAdvantageLaneOpponent?: number | undefined;

        // Objectives
        turretPlatesTaken?: number | undefined;
        riftHeraldTakedowns?: number | undefined;
        baronTakedowns?: number | undefined;
        dragonTakedowns?: number | undefined;

        // Jungle stats
        buffsStolen?: number | undefined;
        alliedJungleMonsterKills?: number | undefined;
        enemyJungleMonsterKills?: number | undefined;
        scuttleCrabKills?: number | undefined;
        jungleCsBefore10Minutes?: number | undefined;
        initialBuffCount?: number | undefined;
        initialCrabCount?: number | undefined;

        // Laning phase
        laneMinionsFirst10Minutes?: number | undefined;
        maxCsAdvantageOnLaneOpponent?: number | undefined;
        maxLevelLeadLaneOpponent?: number | undefined;
        earlyLaningPhaseGoldExpAdvantage?: number | undefined;
        laningPhaseGoldExpAdvantage?: number | undefined;

        // Combat achievements
        multikills?: number | undefined;
        multikillsAfterAggressiveFlash?: number | undefined;
        killsNearEnemyTurret?: number | undefined;
        killsUnderOwnTurret?: number | undefined;
        outnumberedKills?: number | undefined;
        killsWithHelpFromEpicMonster?: number | undefined;

        // Teamwork
        immobilizeAndKillWithAlly?: number | undefined;
        pickKillWithAlly?: number | undefined;
        knockEnemyIntoTeamAndKill?: number | undefined;
        saveAllyFromDeath?: number | undefined;

        // Survival & Clutch
        survivedSingleDigitHpCount?: number | undefined;
        survivedThreeImmobilizesInFight?: number | undefined;
        tookLargeDamageSurvived?: number | undefined;

        // Efficiency & Timing
        quickCleanse?: number | undefined;
        quickFirstTurret?: number | undefined;
        quickSoloKills?: number | undefined;
        effectiveHealAndShielding?: number | undefined;

        // Rare achievements
        perfectGame?: number | undefined;
        flawlessAces?: number | undefined;
        perfectDragonSoulsTaken?: number | undefined;
        soloBaronKills?: number | undefined;

        // Other notable
        takedownsFirstXMinutes?: number | undefined;
        bountyGold?: number | undefined;
        completeSupportQuestInTime?: number | undefined;
      }
    | undefined;

  // Outcome
  win: boolean;
  gameEndedInSurrender: boolean;
  gameEndedInEarlySurrender: boolean;
};

/**
 * Curated timeline event - simplified and enriched event data
 */
export type CuratedTimelineEvent = {
  timestamp: number; // Milliseconds into the game
  minuteMark: number; // Approximate minute (timestamp / 60000)
  type: string;

  // Kill event details
  killer?: string | undefined; // Champion name of killer
  victim?: string | undefined; // Champion name of victim
  assists?: string[] | undefined; // Champion names of assisters
  position?: { x: number; y: number } | undefined;

  // Objective events
  monsterType?: string | undefined; // DRAGON, BARON_NASHOR, RIFTHERALD, etc.
  monsterSubType?: string | undefined; // FIRE_DRAGON, WATER_DRAGON, etc.

  // Building events
  buildingType?: string | undefined; // TOWER_BUILDING, INHIBITOR_BUILDING
  towerType?: string | undefined; // OUTER_TURRET, INNER_TURRET, etc.
  laneType?: string | undefined; // TOP_LANE, MID_LANE, BOT_LANE

  // Team info
  team?: "Blue" | "Red" | undefined;
};

/**
 * Curated participant snapshot at a specific game minute
 */
export type CuratedParticipantSnapshot = {
  participantId: number;
  championName: string; // Resolved from participant mapping
  team: "Blue" | "Red";
  minute: number;
  totalGold: number;
  level: number;
  minionsKilled: number;
  jungleMinionsKilled: number;
  // Cumulative damage at this point
  totalDamageToChampions?: number | undefined;
};

/**
 * Curated timeline data - key events and snapshots for AI analysis
 */
export type CuratedTimeline = {
  // Key game events (kills, objectives, towers)
  keyEvents: CuratedTimelineEvent[];

  // Gold/level snapshots at key intervals (e.g., every 5 minutes)
  snapshots: {
    minute: number;
    participants: CuratedParticipantSnapshot[];
    goldDifference: number; // Blue team total gold - Red team total gold
  }[];

  // Summary statistics
  summary: {
    totalKills: number;
    firstBloodTime?: number | undefined;
    firstTowerTime?: number | undefined;
    dragonsKilled: { team: "Blue" | "Red"; type: string; time: number }[];
    baronsKilled: { team: "Blue" | "Red"; time: number }[];
    riftHeraldsKilled: { team: "Blue" | "Red"; time: number }[];
  };
};

export type CuratedMatchData = {
  gameInfo: {
    gameDuration: number;
    gameMode: string;
    queueId: number;
  };
  participants: CuratedParticipant[];
  timeline?: CuratedTimeline | undefined;
  /** AI-generated narrative summary of how the game unfolded */
  timelineSummary?: string | undefined;
  /** AI-generated lane-aware analysis using full match data */
  matchAnalysis?: string | undefined;
};
