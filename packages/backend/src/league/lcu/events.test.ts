import { describe, test, expect } from "bun:test";
import {
  isKillEvent,
  isFirstBloodEvent,
  isMultikillEvent,
  isAceEvent,
  isObjectiveEvent,
  isGameStateEvent,
  parseKillEvent,
  parseFirstBloodEvent,
  parseMultikillEvent,
  parseAceEvent,
  parseObjectiveEvent,
  parseGameStateEvent,
  filterNewEvents,
  getHighestEventId,
} from "./events.js";
import type { LiveGameEvent } from "./types.js";

describe("events", () => {
  const createMockEvent = (eventName: string, overrides: Partial<LiveGameEvent> = {}): LiveGameEvent => ({
    EventID: 1,
    EventName: eventName,
    EventTime: 1000,
    ...overrides,
  });

  describe("isKillEvent", () => {
    test("identifies kill events", () => {
      expect(isKillEvent(createMockEvent("ChampionKill"))).toBe(true);
      expect(isKillEvent(createMockEvent("FirstBlood"))).toBe(false);
    });
  });

  describe("isFirstBloodEvent", () => {
    test("identifies first blood events", () => {
      expect(isFirstBloodEvent(createMockEvent("FirstBlood"))).toBe(true);
      expect(isFirstBloodEvent(createMockEvent("ChampionKill"))).toBe(false);
    });
  });

  describe("isMultikillEvent", () => {
    test("identifies multikill events", () => {
      expect(isMultikillEvent(createMockEvent("DoubleKill"))).toBe(true);
      expect(isMultikillEvent(createMockEvent("TripleKill"))).toBe(true);
      expect(isMultikillEvent(createMockEvent("QuadraKill"))).toBe(true);
      expect(isMultikillEvent(createMockEvent("PentaKill"))).toBe(true);
      expect(isMultikillEvent(createMockEvent("ChampionKill"))).toBe(false);
    });
  });

  describe("isAceEvent", () => {
    test("identifies ace events", () => {
      expect(isAceEvent(createMockEvent("Ace"))).toBe(true);
      expect(isAceEvent(createMockEvent("ChampionKill"))).toBe(false);
    });
  });

  describe("isObjectiveEvent", () => {
    test("identifies objective events", () => {
      expect(isObjectiveEvent(createMockEvent("TurretKilled"))).toBe(true);
      expect(isObjectiveEvent(createMockEvent("InhibKilled"))).toBe(true);
      expect(isObjectiveEvent(createMockEvent("DragonKilled"))).toBe(true);
      expect(isObjectiveEvent(createMockEvent("BaronKilled"))).toBe(true);
      expect(isObjectiveEvent(createMockEvent("ChampionKill"))).toBe(false);
    });
  });

  describe("isGameStateEvent", () => {
    test("identifies game state events", () => {
      expect(isGameStateEvent(createMockEvent("GameStart"))).toBe(true);
      expect(isGameStateEvent(createMockEvent("GameEnd"))).toBe(true);
      expect(isGameStateEvent(createMockEvent("ChampionKill"))).toBe(false);
    });
  });

  describe("parseKillEvent", () => {
    test("parses valid kill event", () => {
      const event = createMockEvent("ChampionKill", {
        KillerName: "Yasuo",
        VictimName: "Zed",
        Assisters: ["Thresh"],
      });

      const result = parseKillEvent(event);
      expect(result).not.toBeNull();
      expect(result?.killer).toBe("Yasuo");
      expect(result?.victim).toBe("Zed");
      expect(result?.assists).toEqual(["Thresh"]);
    });

    test("returns null for non-kill event", () => {
      const event = createMockEvent("FirstBlood");
      expect(parseKillEvent(event)).toBeNull();
    });

    test("returns null for kill event without required fields", () => {
      const event = createMockEvent("ChampionKill", {
        KillerName: undefined,
      });
      expect(parseKillEvent(event)).toBeNull();
    });
  });

  describe("parseFirstBloodEvent", () => {
    test("parses valid first blood event", () => {
      const event = createMockEvent("FirstBlood", {
        KillerName: "Yasuo",
      });

      const result = parseFirstBloodEvent(event);
      expect(result).not.toBeNull();
      expect(result?.recipient).toBe("Yasuo");
    });

    test("uses Acer field if KillerName not available", () => {
      const event = createMockEvent("FirstBlood", {
        Acer: "Yasuo",
      });

      const result = parseFirstBloodEvent(event);
      expect(result).not.toBeNull();
      expect(result?.recipient).toBe("Yasuo");
    });
  });

  describe("parseMultikillEvent", () => {
    test("parses double kill", () => {
      const event = createMockEvent("DoubleKill", {
        KillerName: "Yasuo",
      });

      const result = parseMultikillEvent(event);
      expect(result).not.toBeNull();
      expect(result?.killStreak).toBe(2);
    });

    test("parses pentakill", () => {
      const event = createMockEvent("PentaKill", {
        KillerName: "Yasuo",
      });

      const result = parseMultikillEvent(event);
      expect(result).not.toBeNull();
      expect(result?.killStreak).toBe(5);
    });
  });

  describe("parseAceEvent", () => {
    test("parses ace event", () => {
      const event = createMockEvent("Ace", {
        AcingTeam: "ORDER",
      });

      const result = parseAceEvent(event);
      expect(result).not.toBeNull();
      expect(result?.acingTeam).toBe("ORDER");
    });
  });

  describe("parseObjectiveEvent", () => {
    test("parses turret kill", () => {
      const event = createMockEvent("TurretKilled", {
        KillerName: "Yasuo",
        TurretKilled: "Turret_T1_L_01_A",
      });

      const result = parseObjectiveEvent(event);
      expect(result).not.toBeNull();
      expect(result?.objectiveType).toBe("turret");
    });

    test("parses baron kill", () => {
      const event = createMockEvent("BaronKilled", {
        KillerName: "Yasuo",
        BaronKilled: "SRU_Baron",
      });

      const result = parseObjectiveEvent(event);
      expect(result).not.toBeNull();
      expect(result?.objectiveType).toBe("baron");
    });
  });

  describe("parseGameStateEvent", () => {
    test("parses game start", () => {
      const event = createMockEvent("GameStart");
      const result = parseGameStateEvent(event);
      expect(result).not.toBeNull();
      expect(result?.eventType).toBe("start");
    });

    test("parses game end", () => {
      const event = createMockEvent("GameEnd");
      const result = parseGameStateEvent(event);
      expect(result).not.toBeNull();
      expect(result?.eventType).toBe("end");
    });
  });

  describe("filterNewEvents", () => {
    test("returns all events if no last processed ID", () => {
      const events = [
        createMockEvent("ChampionKill", { EventID: 1 }),
        createMockEvent("ChampionKill", { EventID: 2 }),
      ];

      const result = filterNewEvents(events, null);
      expect(result).toHaveLength(2);
    });

    test("filters out already processed events", () => {
      const events = [
        createMockEvent("ChampionKill", { EventID: 1 }),
        createMockEvent("ChampionKill", { EventID: 2 }),
        createMockEvent("ChampionKill", { EventID: 3 }),
      ];

      const result = filterNewEvents(events, 1);
      expect(result).toHaveLength(2);
      expect(result[0]?.EventID).toBe(2);
      expect(result[1]?.EventID).toBe(3);
    });
  });

  describe("getHighestEventId", () => {
    test("returns highest event ID", () => {
      const events = [
        createMockEvent("ChampionKill", { EventID: 1 }),
        createMockEvent("ChampionKill", { EventID: 5 }),
        createMockEvent("ChampionKill", { EventID: 3 }),
      ];

      expect(getHighestEventId(events)).toBe(5);
    });

    test("returns null for empty array", () => {
      expect(getHighestEventId([])).toBeNull();
    });
  });
});
