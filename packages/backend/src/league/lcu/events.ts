import type {
  LiveGameEvent,
  KillEvent,
  FirstBloodEvent,
  MultikillEvent,
  AceEvent,
  ObjectiveEvent,
  GameStateEvent,
} from "./types.js";

/**
 * Check if an event is a kill event
 */
export function isKillEvent(event: LiveGameEvent): boolean {
  return event.EventName === "ChampionKill";
}

/**
 * Check if an event is first blood
 */
export function isFirstBloodEvent(event: LiveGameEvent): boolean {
  return event.EventName === "FirstBlood";
}

/**
 * Check if an event is a multikill
 */
export function isMultikillEvent(event: LiveGameEvent): boolean {
  return (
    event.EventName === "DoubleKill" ||
    event.EventName === "TripleKill" ||
    event.EventName === "QuadraKill" ||
    event.EventName === "PentaKill"
  );
}

/**
 * Check if an event is an ace
 */
export function isAceEvent(event: LiveGameEvent): boolean {
  return event.EventName === "Ace";
}

/**
 * Check if an event is an objective kill
 */
export function isObjectiveEvent(event: LiveGameEvent): boolean {
  return (
    event.EventName === "TurretKilled" ||
    event.EventName === "InhibKilled" ||
    event.EventName === "DragonKilled" ||
    event.EventName === "BaronKilled"
  );
}

/**
 * Check if an event is a game state change
 */
export function isGameStateEvent(event: LiveGameEvent): boolean {
  return event.EventName === "GameStart" || event.EventName === "GameEnd";
}

/**
 * Parse a kill event into structured data
 */
export function parseKillEvent(event: LiveGameEvent): KillEvent | null {
  if (!isKillEvent(event)) {
    return null;
  }

  if (!event.KillerName || !event.VictimName) {
    return null;
  }

  return {
    killer: event.KillerName,
    victim: event.VictimName,
    assists: event.Assisters ?? [],
    timestamp: event.EventTime,
    eventId: event.EventID,
  };
}

/**
 * Parse a first blood event
 */
export function parseFirstBloodEvent(event: LiveGameEvent): FirstBloodEvent | null {
  if (!isFirstBloodEvent(event)) {
    return null;
  }

  const recipient = event.KillerName ?? event.Acer;
  if (!recipient) {
    return null;
  }

  return {
    recipient,
    timestamp: event.EventTime,
    eventId: event.EventID,
  };
}

/**
 * Parse a multikill event
 */
export function parseMultikillEvent(event: LiveGameEvent): MultikillEvent | null {
  if (!isMultikillEvent(event)) {
    return null;
  }

  if (!event.KillerName) {
    return null;
  }

  const killStreakMap: Record<string, number> = {
    DoubleKill: 2,
    TripleKill: 3,
    QuadraKill: 4,
    PentaKill: 5,
  };

  const killStreak = killStreakMap[event.EventName] ?? 0;
  if (killStreak === 0) {
    return null;
  }

  return {
    killer: event.KillerName,
    killStreak,
    timestamp: event.EventTime,
    eventId: event.EventID,
  };
}

/**
 * Parse an ace event
 */
export function parseAceEvent(event: LiveGameEvent): AceEvent | null {
  if (!isAceEvent(event)) {
    return null;
  }

  if (!event.AcingTeam) {
    return null;
  }

  return {
    acingTeam: event.AcingTeam,
    timestamp: event.EventTime,
    eventId: event.EventID,
  };
}

/**
 * Parse an objective event
 */
export function parseObjectiveEvent(event: LiveGameEvent): ObjectiveEvent | null {
  if (!isObjectiveEvent(event)) {
    return null;
  }

  const objectiveTypeMap: Record<string, "turret" | "inhibitor" | "dragon" | "baron"> = {
    TurretKilled: "turret",
    InhibKilled: "inhibitor",
    DragonKilled: "dragon",
    BaronKilled: "baron",
  };

  const objectiveType = objectiveTypeMap[event.EventName];
  if (!objectiveType) {
    return null;
  }

  const killer = event.KillerName ?? "";
  const objectiveName =
    event.TurretKilled ?? event.InhibKilled ?? event.DragonKilled ?? event.BaronKilled;

  return {
    killer,
    objectiveType,
    objectiveName,
    assists: event.Assisters ?? [],
    timestamp: event.EventTime,
    eventId: event.EventID,
  };
}

/**
 * Parse a game state event
 */
export function parseGameStateEvent(event: LiveGameEvent): GameStateEvent | null {
  if (!isGameStateEvent(event)) {
    return null;
  }

  const eventType = event.EventName === "GameStart" ? "start" : "end";

  return {
    eventType,
    timestamp: event.EventTime,
    eventId: event.EventID,
  };
}

/**
 * Filter out events that have already been processed
 * Returns only new events that come after the last processed event ID
 */
export function filterNewEvents(
  events: LiveGameEvent[],
  lastProcessedEventId: number | null,
): LiveGameEvent[] {
  if (lastProcessedEventId === null) {
    // First time checking, return all events
    return events;
  }

  // Filter events that have an ID greater than the last processed one
  return events.filter((event) => event.EventID > lastProcessedEventId);
}

/**
 * Get the highest event ID from a list of events
 */
export function getHighestEventId(events: LiveGameEvent[]): number | null {
  if (events.length === 0) {
    return null;
  }

  return Math.max(...events.map((event) => event.EventID));
}
