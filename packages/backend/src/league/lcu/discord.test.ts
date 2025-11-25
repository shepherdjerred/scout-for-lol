import { describe, test, expect, mock } from "bun:test";
import {
  formatKillMessage,
  formatFirstBloodMessage,
  formatMultikillMessage,
  formatAceMessage,
  formatObjectiveMessage,
  formatGameStateMessage,
  buildChampionNameMap,
} from "./discord.js";
import type { KillEvent, FirstBloodEvent, MultikillEvent, AceEvent, ObjectiveEvent, GameStateEvent } from "./types.js";

describe("discord", () => {
  const championNames = new Map<string, string>([
    ["Player1", "Yasuo"],
    ["Player2", "Zed"],
    ["Player3", "Thresh"],
  ]);

  describe("formatKillMessage", () => {
    test("formats kill without assists", () => {
      const event: KillEvent = {
        killer: "Player1",
        victim: "Player2",
        assists: [],
        timestamp: 1000,
        eventId: 1,
      };

      const message = formatKillMessage(event, championNames);
      expect(message).toContain("Yasuo");
      expect(message).toContain("Zed");
      expect(message).not.toContain("assist");
    });

    test("formats kill with single assist", () => {
      const event: KillEvent = {
        killer: "Player1",
        victim: "Player2",
        assists: ["Player3"],
        timestamp: 1000,
        eventId: 1,
      };

      const message = formatKillMessage(event, championNames);
      expect(message).toContain("assist: Thresh");
    });

    test("formats kill with multiple assists", () => {
      const event: KillEvent = {
        killer: "Player1",
        victim: "Player2",
        assists: ["Player3", "Player1"],
        timestamp: 1000,
        eventId: 1,
      };

      const message = formatKillMessage(event, championNames);
      expect(message).toContain("assists:");
    });
  });

  describe("formatFirstBloodMessage", () => {
    test("formats first blood", () => {
      const event: FirstBloodEvent = {
        recipient: "Player1",
        timestamp: 1000,
        eventId: 1,
      };

      const message = formatFirstBloodMessage(event, championNames);
      expect(message).toContain("FIRST BLOOD");
      expect(message).toContain("Yasuo");
    });
  });

  describe("formatMultikillMessage", () => {
    test("formats double kill", () => {
      const event: MultikillEvent = {
        killer: "Player1",
        killStreak: 2,
        timestamp: 1000,
        eventId: 1,
      };

      const message = formatMultikillMessage(event, championNames);
      expect(message).toContain("DOUBLE KILL");
      expect(message).toContain("Yasuo");
    });

    test("formats pentakill", () => {
      const event: MultikillEvent = {
        killer: "Player1",
        killStreak: 5,
        timestamp: 1000,
        eventId: 1,
      };

      const message = formatMultikillMessage(event, championNames);
      expect(message).toContain("PENTAKILL");
    });
  });

  describe("formatAceMessage", () => {
    test("formats ace for ORDER team", () => {
      const event: AceEvent = {
        acingTeam: "ORDER",
        timestamp: 1000,
        eventId: 1,
      };

      const message = formatAceMessage(event);
      expect(message).toContain("ACE");
      expect(message).toContain("Blue");
    });

    test("formats ace for CHAOS team", () => {
      const event: AceEvent = {
        acingTeam: "CHAOS",
        timestamp: 1000,
        eventId: 1,
      };

      const message = formatAceMessage(event);
      expect(message).toContain("Red");
    });
  });

  describe("formatObjectiveMessage", () => {
    test("formats turret kill", () => {
      const event: ObjectiveEvent = {
        killer: "Player1",
        objectiveType: "turret",
        objectiveName: "Turret_T1",
        assists: [],
        timestamp: 1000,
        eventId: 1,
      };

      const message = formatObjectiveMessage(event, championNames);
      expect(message).toContain("🏰");
      expect(message).toContain("Yasuo");
    });

    test("formats baron kill with assists", () => {
      const event: ObjectiveEvent = {
        killer: "Player1",
        objectiveType: "baron",
        objectiveName: "SRU_Baron",
        assists: ["Player2"],
        timestamp: 1000,
        eventId: 1,
      };

      const message = formatObjectiveMessage(event, championNames);
      expect(message).toContain("👹");
      expect(message).toContain("assist");
    });
  });

  describe("formatGameStateMessage", () => {
    test("formats game start", () => {
      const event: GameStateEvent = {
        eventType: "start",
        timestamp: 1000,
        eventId: 1,
      };

      const message = formatGameStateMessage(event);
      expect(message).toContain("Game Started");
    });

    test("formats game end", () => {
      const event: GameStateEvent = {
        eventType: "end",
        timestamp: 1000,
        eventId: 1,
      };

      const message = formatGameStateMessage(event);
      expect(message).toContain("Game Ended");
    });
  });

  describe("buildChampionNameMap", () => {
    test("builds map from player data", () => {
      const players = [
        { summonerName: "Player1", championName: "157" }, // Yasuo ID
        { summonerName: "Player2", championName: "Zed" },
      ];

      const map = buildChampionNameMap(players);
      expect(map.get("Player1")).toBe("Yasuo");
      expect(map.get("Player2")).toBe("Zed");
    });
  });
});
