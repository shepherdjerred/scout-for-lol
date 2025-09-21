import { describe, it, expect } from "bun:test";
import {
  type Champion,
  ArenaChampionSchema,
  ChampionSchema,
} from "@scout-for-lol/data";

describe("ArenaChampionSchema and augments", () => {
  const baseChampion: Champion = {
    riotIdGameName: "Player#NA1",
    championName: "Zed",
    kills: 10,
    deaths: 2,
    assists: 5,
    level: 20,
    items: [3031, 6692],
    spells: [4, 14],
    gold: 15000,
    runes: [],
    creepScore: 0,
    visionScore: 0,
    damage: 20000,
  };

  it("accepts augments up to 6 and preserves order", () => {
    const parsed = ArenaChampionSchema.parse({
      ...baseChampion,
      augments: [{ id: 11 }, { id: 22 }, { id: 33 }],
      arenaMetrics: {},
      teamSupport: {},
    });
    expect(parsed.augments.map((a) => ("id" in a ? a.id : undefined))).toEqual([
      11, 22, 33,
    ]);
  });

  it("fails when more than 6 augments provided", () => {
    expect(() =>
      ArenaChampionSchema.parse({
        ...baseChampion,
        augments: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
          { id: 4 },
          { id: 5 },
          { id: 6 },
          { id: 7 },
        ],
        arenaMetrics: {},
        teamSupport: {},
      })
    ).toThrow();
  });

  it("requires augments for ArenaChampion", () => {
    expect(() =>
      ArenaChampionSchema.parse({
        ...baseChampion,
        arenaMetrics: {},
        teamSupport: {},
      })
    ).toThrow();
  });

  it("accepts optional arena/team support metrics fields", () => {
    const parsed = ArenaChampionSchema.parse({
      ...baseChampion,
      augments: [{ id: 101 }, { id: 202 }],
      arenaMetrics: {
        playerScore0: 1,
        playerScore3: 0.5,
      },
      teamSupport: {
        damageShieldedOnTeammate: 1000,
      },
    });
    expect(parsed.arenaMetrics.playerScore0).toBe(1);
    expect(parsed.arenaMetrics.playerScore1).toBeUndefined();
    expect(parsed.teamSupport.damageShieldedOnTeammate).toBe(1000);
    expect(parsed.teamSupport.healsOnTeammate).toBeUndefined();
  });

  it("base ChampionSchema allows arena levels above 18", () => {
    const parsed = ChampionSchema.parse({
      ...baseChampion,
      level: 25,
    });
    expect(parsed.level).toBe(25);
  });
});
