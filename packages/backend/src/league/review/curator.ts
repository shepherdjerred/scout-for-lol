import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { getItemInfo, summoner, getRuneInfo, getRuneTreeName, getChampionInfo } from "@scout-for-lol/report";
import { first, keys, pickBy } from "remeda";

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
  items: Array<{ id: number; name: string; description: string; plaintext?: string | undefined }>;
  itemsPurchased: number;
  consumablesPurchased: number;

  // Summoner spells (translated with descriptions)
  summonerSpells: Array<{ id: number; name: string; description: string; casts: number }>;

  // Runes (translated with descriptions)
  perks: {
    primaryStyle: { id: number; name: string };
    subStyle: { id: number; name: string };
    primarySelections: Array<{
      id: number;
      name: string;
      description: string;
      var1: number;
      var2: number;
      var3: number;
    }>;
    subSelections: Array<{ id: number; name: string; description: string; var1: number; var2: number; var3: number }>;
    statPerks: { offense: number; flex: number; defense: number };
  };

  // Champion abilities (with descriptions)
  championAbilities?:
    | {
        passive: { name: string; description: string };
        spells: Array<{ name: string; description: string; tooltip: string }>;
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

  // Challenges (comprehensive set)
  challenges: {
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
  };

  // Outcome
  win: boolean;
  gameEndedInSurrender: boolean;
  gameEndedInEarlySurrender: boolean;
};

function getSummonerSpellName(spellId: number): string | undefined {
  return first(keys(pickBy(summoner.data, (s) => s.key === spellId.toString())));
}

export async function curateParticipantData(participant: MatchV5DTOs.ParticipantDto): Promise<CuratedParticipant> {
  // Translate items
  const itemIds = [
    participant.item0,
    participant.item1,
    participant.item2,
    participant.item3,
    participant.item4,
    participant.item5,
    participant.item6,
  ];

  const items = itemIds
    .filter((id) => id !== 0)
    .map((id) => {
      const info = getItemInfo(id);
      return {
        id,
        name: info?.name ?? `Item ${id.toString()}`,
        description: info?.description ?? "",
        plaintext: info?.plaintext,
      };
    });

  // Translate summoner spells
  const spell1Name = getSummonerSpellName(participant.summoner1Id);
  const spell2Name = getSummonerSpellName(participant.summoner2Id);

  const summonerSpells = [
    {
      id: participant.summoner1Id,
      name: spell1Name ?? `Spell ${participant.summoner1Id.toString()}`,
      description: spell1Name ? (summoner.data[spell1Name]?.description ?? "") : "",
      casts: participant.summoner1Casts,
    },
    {
      id: participant.summoner2Id,
      name: spell2Name ?? `Spell ${participant.summoner2Id.toString()}`,
      description: spell2Name ? (summoner.data[spell2Name]?.description ?? "") : "",
      casts: participant.summoner2Casts,
    },
  ];

  // Translate runes
  const primaryStyle = participant.perks.styles[0];
  const subStyle = participant.perks.styles[1];

  const primarySelections =
    primaryStyle?.selections.map((sel) => {
      const info = getRuneInfo(sel.perk);
      return {
        id: sel.perk,
        name: info?.name ?? `Rune ${sel.perk.toString()}`,
        description: info?.longDesc ?? info?.shortDesc ?? "",
        var1: sel.var1,
        var2: sel.var2,
        var3: sel.var3,
      };
    }) ?? [];

  const subSelections =
    subStyle?.selections.map((sel) => {
      const info = getRuneInfo(sel.perk);
      return {
        id: sel.perk,
        name: info?.name ?? `Rune ${sel.perk.toString()}`,
        description: info?.longDesc ?? info?.shortDesc ?? "",
        var1: sel.var1,
        var2: sel.var2,
        var3: sel.var3,
      };
    }) ?? [];

  const perks = {
    primaryStyle: {
      id: primaryStyle?.style ?? 0,
      name: getRuneTreeName(primaryStyle?.style ?? 0) ?? "Unknown",
    },
    subStyle: {
      id: subStyle?.style ?? 0,
      name: getRuneTreeName(subStyle?.style ?? 0) ?? "Unknown",
    },
    primarySelections,
    subSelections,
    statPerks: participant.perks.statPerks,
  };

  // Get champion ability info
  const championAbilities = await getChampionInfo(participant.championName);

  return {
    // Identity
    riotIdGameName: participant.riotIdGameName ?? "Unknown",
    championName: participant.championName,
    championId: participant.championId,
    teamId: participant.teamId === 100 ? "Blue" : "Red",
    teamPosition: participant.teamPosition,
    individualPosition: participant.individualPosition,

    // Core stats
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    champLevel: participant.champLevel,
    champExperience: participant.champExperience,

    // Multikills & Sprees
    doubleKills: participant.doubleKills,
    tripleKills: participant.tripleKills,
    quadraKills: participant.quadraKills,
    pentaKills: participant.pentaKills,
    largestKillingSpree: participant.largestKillingSpree,
    largestMultiKill: participant.largestMultiKill,
    killingSprees: participant.killingSprees,

    // First actions
    firstBloodKill: participant.firstBloodKill,
    firstBloodAssist: participant.firstBloodAssist,
    firstTowerKill: participant.firstTowerKill,
    firstTowerAssist: participant.firstTowerAssist,

    // Items
    items,
    itemsPurchased: participant.itemsPurchased,
    consumablesPurchased: participant.consumablesPurchased,

    // Summoner spells
    summonerSpells,

    // Runes
    perks,

    // Champion abilities
    championAbilities,

    // Ability casts
    spell1Casts: participant.spell1Casts,
    spell2Casts: participant.spell2Casts,
    spell3Casts: participant.spell3Casts,
    spell4Casts: participant.spell4Casts,

    // Economy
    goldEarned: participant.goldEarned,
    goldSpent: participant.goldSpent,

    // Damage - Champion
    totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
    physicalDamageDealtToChampions: participant.physicalDamageDealtToChampions,
    magicDamageDealtToChampions: participant.magicDamageDealtToChampions,
    trueDamageDealtToChampions: participant.trueDamageDealtToChampions,
    largestCriticalStrike: participant.largestCriticalStrike,

    // Damage - Taken
    totalDamageTaken: participant.totalDamageTaken,
    physicalDamageTaken: participant.physicalDamageTaken,
    magicDamageTaken: participant.magicDamageTaken,
    trueDamageTaken: participant.trueDamageTaken,
    damageSelfMitigated: participant.damageSelfMitigated,

    // Healing & Shielding
    totalHeal: participant.totalHeal,
    totalHealsOnTeammates: participant.totalHealsOnTeammates,
    totalDamageShieldedOnTeammates: participant.totalDamageShieldedOnTeammates,
    totalUnitsHealed: participant.totalUnitsHealed,

    // CS & Farming
    totalMinionsKilled: participant.totalMinionsKilled,
    neutralMinionsKilled: participant.neutralMinionsKilled,

    // Vision
    visionScore: participant.visionScore,
    wardsPlaced: participant.wardsPlaced,
    wardsKilled: participant.wardsKilled,
    detectorWardsPlaced: participant.detectorWardsPlaced,
    visionWardsBoughtInGame: participant.visionWardsBoughtInGame,

    // Communication
    allInPings: participant.allInPings,
    assistMePings: participant.assistMePings,
    baitPings: participant.baitPings,
    basicPings: participant.basicPings,
    commandPings: participant.commandPings,
    dangerPings: participant.dangerPings,
    enemyMissingPings: participant.enemyMissingPings,
    enemyVisionPings: participant.enemyVisionPings,
    getBackPings: participant.getBackPings,
    holdPings: participant.holdPings,
    needVisionPings: participant.needVisionPings,
    onMyWayPings: participant.onMyWayPings,
    pushPings: participant.pushPings,
    visionClearedPings: participant.visionClearedPings,

    // Objectives
    baronKills: participant.baronKills,
    dragonKills: participant.dragonKills,
    inhibitorKills: participant.inhibitorKills,
    turretKills: participant.turretKills,
    turretTakedowns: participant.turretTakedowns,
    damageDealtToTurrets: participant.damageDealtToTurrets,
    damageDealtToObjectives: participant.damageDealtToObjectives,
    damageDealtToBuildings: participant.damageDealtToBuildings,

    // CC
    timeCCingOthers: participant.timeCCingOthers,
    totalTimeCCDealt: participant.totalTimeCCDealt,

    // Time
    timePlayed: participant.timePlayed,
    totalTimeSpentDead: participant.totalTimeSpentDead,
    longestTimeSpentLiving: participant.longestTimeSpentLiving,

    // Challenges
    challenges: {
      killParticipation: participant.challenges.killParticipation,
      soloKills: participant.challenges.soloKills,
      damagePerMinute: participant.challenges.damagePerMinute,
      goldPerMinute: participant.challenges.goldPerMinute,
      visionScorePerMinute: participant.challenges.visionScorePerMinute,
      skillshotsHit: participant.challenges.skillshotsHit,
      skillshotsDodged: participant.challenges.skillshotsDodged,
      enemyChampionImmobilizations: participant.challenges.enemyChampionImmobilizations,
      teamDamagePercentage: participant.challenges.teamDamagePercentage,
      damageTakenOnTeamPercentage: participant.challenges.damageTakenOnTeamPercentage,
      controlWardsPlaced: participant.challenges.controlWardsPlaced,
      controlWardTimeCoverageInRiverOrEnemyHalf: participant.challenges.controlWardTimeCoverageInRiverOrEnemyHalf,
      visionScoreAdvantageLaneOpponent: participant.challenges.visionScoreAdvantageLaneOpponent,
      turretPlatesTaken: participant.challenges.turretPlatesTaken,
      riftHeraldTakedowns: participant.challenges.riftHeraldTakedowns,
      baronTakedowns: participant.challenges.baronTakedowns,
      dragonTakedowns: participant.challenges.dragonTakedowns,
      buffsStolen: participant.challenges.buffsStolen,
      alliedJungleMonsterKills: participant.challenges.alliedJungleMonsterKills,
      enemyJungleMonsterKills: participant.challenges.enemyJungleMonsterKills,
      scuttleCrabKills: participant.challenges.scuttleCrabKills,
      jungleCsBefore10Minutes: participant.challenges.jungleCsBefore10Minutes,
      initialBuffCount: participant.challenges.initialBuffCount,
      initialCrabCount: participant.challenges.initialCrabCount,
      laneMinionsFirst10Minutes: participant.challenges.laneMinionsFirst10Minutes,
      maxCsAdvantageOnLaneOpponent: participant.challenges.maxCsAdvantageOnLaneOpponent,
      maxLevelLeadLaneOpponent: participant.challenges.maxLevelLeadLaneOpponent,
      earlyLaningPhaseGoldExpAdvantage: participant.challenges.earlyLaningPhaseGoldExpAdvantage,
      laningPhaseGoldExpAdvantage: participant.challenges.laningPhaseGoldExpAdvantage,
      multikills: participant.challenges.multikills,
      multikillsAfterAggressiveFlash: participant.challenges.multikillsAfterAggressiveFlash,
      killsNearEnemyTurret: participant.challenges.killsNearEnemyTurret,
      killsUnderOwnTurret: participant.challenges.killsUnderOwnTurret,
      outnumberedKills: participant.challenges.outnumberedKills,
      killsWithHelpFromEpicMonster: participant.challenges.killsWithHelpFromEpicMonster,
      immobilizeAndKillWithAlly: participant.challenges.immobilizeAndKillWithAlly,
      pickKillWithAlly: participant.challenges.pickKillWithAlly,
      knockEnemyIntoTeamAndKill: participant.challenges.knockEnemyIntoTeamAndKill,
      saveAllyFromDeath: participant.challenges.saveAllyFromDeath,
      survivedSingleDigitHpCount: participant.challenges.survivedSingleDigitHpCount,
      survivedThreeImmobilizesInFight: participant.challenges.survivedThreeImmobilizesInFight,
      tookLargeDamageSurvived: participant.challenges.tookLargeDamageSurvived,
      quickCleanse: participant.challenges.quickCleanse,
      quickFirstTurret: participant.challenges.quickFirstTurret,
      quickSoloKills: participant.challenges.quickSoloKills,
      effectiveHealAndShielding: participant.challenges.effectiveHealAndShielding,
      perfectGame: participant.challenges.perfectGame,
      flawlessAces: participant.challenges.flawlessAces,
      perfectDragonSoulsTaken: participant.challenges.perfectDragonSoulsTaken,
      soloBaronKills: participant.challenges.soloBaronKills,
      takedownsFirstXMinutes: participant.challenges.takedownsFirstXMinutes,
      bountyGold: participant.challenges.bountyGold,
      completeSupportQuestInTime: participant.challenges.completeSupportQuestInTime,
    },

    // Outcome
    win: participant.win,
    gameEndedInSurrender: participant.gameEndedInSurrender,
    gameEndedInEarlySurrender: participant.gameEndedInEarlySurrender,
  };
}

export type CuratedMatchData = {
  gameInfo: {
    gameDuration: number;
    gameMode: string;
    queueId: number;
  };
  participants: CuratedParticipant[];
};

export async function curateMatchData(matchDto: MatchV5DTOs.MatchDto): Promise<CuratedMatchData> {
  const participants = await Promise.all(matchDto.info.participants.map(curateParticipantData));

  return {
    gameInfo: {
      gameDuration: matchDto.info.gameDuration,
      gameMode: matchDto.info.gameMode,
      queueId: matchDto.info.queueId,
    },
    participants,
  };
}
