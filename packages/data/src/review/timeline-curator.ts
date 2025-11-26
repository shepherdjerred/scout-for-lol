import type { MatchDto, TimelineDto, TimelineEventDto, TimelineFrameDto } from "@scout-for-lol/data";
import type {
  CuratedTimeline,
  CuratedTimelineEvent,
  CuratedParticipantSnapshot,
} from "@scout-for-lol/data/review/curator-types.js";

type ParticipantInfo = { championName: string; team: "Blue" | "Red" };
type ParticipantMapping = Map<number, ParticipantInfo>;

/**
 * Build a mapping from participant ID to champion name and team
 */
function buildParticipantMapping(matchDto: MatchDto): ParticipantMapping {
  const mapping = new Map<number, ParticipantInfo>();

  for (const participant of matchDto.info.participants) {
    const participantId = matchDto.info.participants.findIndex((p) => p.puuid === participant.puuid) + 1;
    mapping.set(participantId, {
      championName: participant.championName,
      team: participant.teamId === 100 ? "Blue" : "Red",
    });
  }

  return mapping;
}

/**
 * Process a champion kill event
 */
function processChampionKill(event: TimelineEventDto, participantMapping: ParticipantMapping): CuratedTimelineEvent {
  const minuteMark = Math.floor(event.timestamp / 60000);
  const killerInfo = event.killerId ? participantMapping.get(event.killerId) : undefined;
  const victimInfo = event.victimId ? participantMapping.get(event.victimId) : undefined;
  const assistNames =
    event.assistingParticipantIds
      ?.map((id) => participantMapping.get(id)?.championName)
      .filter((name) => name !== undefined) ?? [];

  return {
    timestamp: event.timestamp,
    minuteMark,
    type: "CHAMPION_KILL",
    killer: killerInfo?.championName,
    victim: victimInfo?.championName,
    assists: assistNames,
    position: event.position,
    team: killerInfo?.team,
  };
}

/**
 * Process an elite monster kill event (dragon, baron, herald)
 */
function processEliteMonsterKill(event: TimelineEventDto): {
  keyEvent: CuratedTimelineEvent;
  dragonKill?: { team: "Blue" | "Red"; type: string; time: number };
  baronKill?: { team: "Blue" | "Red"; time: number };
  riftHeraldKill?: { team: "Blue" | "Red"; time: number };
} | null {
  const minuteMark = Math.floor(event.timestamp / 60000);
  const team: "Blue" | "Red" = event.killerTeamId === 100 ? "Blue" : "Red";

  if (event.monsterType === "DRAGON") {
    return {
      keyEvent: {
        timestamp: event.timestamp,
        minuteMark,
        type: "DRAGON_KILL",
        monsterType: event.monsterType,
        monsterSubType: event.monsterSubType,
        team,
      },
      dragonKill: { team, type: event.monsterSubType ?? "UNKNOWN", time: event.timestamp },
    };
  }

  if (event.monsterType === "BARON_NASHOR") {
    return {
      keyEvent: {
        timestamp: event.timestamp,
        minuteMark,
        type: "BARON_KILL",
        monsterType: event.monsterType,
        team,
      },
      baronKill: { team, time: event.timestamp },
    };
  }

  if (event.monsterType === "RIFTHERALD") {
    return {
      keyEvent: {
        timestamp: event.timestamp,
        minuteMark,
        type: "RIFTHERALD_KILL",
        monsterType: event.monsterType,
        team,
      },
      riftHeraldKill: { team, time: event.timestamp },
    };
  }

  return null;
}

/**
 * Process a building kill event (towers, inhibitors)
 */
function processBuildingKill(event: TimelineEventDto): CuratedTimelineEvent {
  const minuteMark = Math.floor(event.timestamp / 60000);
  // teamId is the team that LOST the building
  const team: "Blue" | "Red" = event.teamId === 100 ? "Red" : "Blue";

  return {
    timestamp: event.timestamp,
    minuteMark,
    type: "BUILDING_KILL",
    buildingType: event.buildingType,
    towerType: event.towerType,
    laneType: event.laneType,
    team,
  };
}

/**
 * Create a snapshot of participant stats at a specific frame
 */
function createFrameSnapshot(
  frame: TimelineFrameDto,
  minute: number,
  participantMapping: ParticipantMapping,
): { participants: CuratedParticipantSnapshot[]; goldDifference: number } | null {
  const participantSnapshots: CuratedParticipantSnapshot[] = [];
  let blueGold = 0;
  let redGold = 0;

  for (const [idStr, participantFrame] of Object.entries(frame.participantFrames)) {
    const participantId = parseInt(idStr, 10);
    const info = participantMapping.get(participantId);
    if (!info) {
      continue;
    }

    participantSnapshots.push({
      participantId,
      championName: info.championName,
      team: info.team,
      minute,
      totalGold: participantFrame.totalGold,
      level: participantFrame.level,
      minionsKilled: participantFrame.minionsKilled,
      jungleMinionsKilled: participantFrame.jungleMinionsKilled,
      totalDamageToChampions: participantFrame.damageStats?.totalDamageDoneToChampions,
    });

    if (info.team === "Blue") {
      blueGold += participantFrame.totalGold;
    } else {
      redGold += participantFrame.totalGold;
    }
  }

  if (participantSnapshots.length === 0) {
    return null;
  }

  const frameTimestamp = frame.timestamp;
  const gameMinutes = frameTimestamp / 60000;
  if (gameMinutes < minute - 1) {
    return null;
  }

  return { participants: participantSnapshots, goldDifference: blueGold - redGold };
}

/**
 * Curate timeline data into a format suitable for AI analysis
 *
 * Extracts key events (kills, objectives, towers) and creates snapshots
 * at regular intervals for tracking gold leads and game progression.
 */
export function curateTimelineData(timelineDto: TimelineDto, matchDto: MatchDto): CuratedTimeline {
  const participantMapping = buildParticipantMapping(matchDto);
  const keyEvents: CuratedTimelineEvent[] = [];
  const dragonsKilled: { team: "Blue" | "Red"; type: string; time: number }[] = [];
  const baronsKilled: { team: "Blue" | "Red"; time: number }[] = [];
  const riftHeraldsKilled: { team: "Blue" | "Red"; time: number }[] = [];
  let firstBloodTime: number | undefined;
  let firstTowerTime: number | undefined;
  let totalKills = 0;

  // Process all frames for events
  for (const frame of timelineDto.info.frames) {
    for (const event of frame.events) {
      if (event.type === "CHAMPION_KILL") {
        totalKills++;
        firstBloodTime ??= event.timestamp;
        keyEvents.push(processChampionKill(event, participantMapping));
      }

      if (event.type === "ELITE_MONSTER_KILL") {
        const result = processEliteMonsterKill(event);
        if (!result) {
          continue;
        }

        keyEvents.push(result.keyEvent);
        if (result.dragonKill) {
          dragonsKilled.push(result.dragonKill);
        }
        if (result.baronKill) {
          baronsKilled.push(result.baronKill);
        }
        if (result.riftHeraldKill) {
          riftHeraldsKilled.push(result.riftHeraldKill);
        }
        continue;
      }

      if (event.type === "BUILDING_KILL") {
        const isTower = event.buildingType === "TOWER_BUILDING";
        if (isTower) {
          firstTowerTime ??= event.timestamp;
        }
        keyEvents.push(processBuildingKill(event));
      }
    }
  }

  // Create snapshots at key intervals (every 5 minutes)
  const snapshotIntervals = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
  const snapshots: CuratedTimeline["snapshots"] = [];

  for (const minute of snapshotIntervals) {
    const frameIndex = Math.min(minute, timelineDto.info.frames.length - 1);
    const frame = timelineDto.info.frames[frameIndex];
    if (!frame) {
      continue;
    }

    const snapshot = createFrameSnapshot(frame, minute, participantMapping);
    if (snapshot) {
      snapshots.push({ minute, ...snapshot });
    }
  }

  return {
    keyEvents,
    snapshots,
    summary: {
      totalKills,
      firstBloodTime,
      firstTowerTime,
      dragonsKilled,
      baronsKilled,
      riftHeraldsKilled,
    },
  };
}
