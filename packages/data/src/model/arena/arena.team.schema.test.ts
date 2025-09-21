import { describe, it, expect } from "bun:test";
import {
  ArenaTeamSchema,
  type ArenaChampion,
  ArenaChampionSchema,
} from "@scout-for-lol/data";

const sampleArenaChampion = (): ArenaChampion =>
  ArenaChampionSchema.parse({
    riotIdGameName: "P#NA1",
    championName: "Lux",
    kills: 5,
    deaths: 1,
    assists: 7,
    level: 18,
    items: [6655],
    spells: [4, 7],
    gold: 12000,
    runes: [],
    creepScore: 0,
    visionScore: 0,
    damage: 15000,
    augments: [{ id: 101 }, { id: 202 }],
    arenaMetrics: {},
    teamSupport: {},
  });

describe("Arena team schemas and utilities", () => {
  it("validates ArenaSubteamSchema with exactly two players", () => {
    const parsed = ArenaTeamSchema.safeParse({
      subteamId: 1,
      players: [sampleArenaChampion(), sampleArenaChampion()],
      placement: 3,
    });
    expect(parsed.success).toBe(true);
  });

  it("fails when players length is not 2", () => {
    const one = ArenaTeamSchema.safeParse({
      subteamId: 1,
      players: [sampleArenaChampion()],
      placement: 3,
    });
    const three = ArenaTeamSchema.safeParse({
      subteamId: 1,
      players: [
        sampleArenaChampion(),
        sampleArenaChampion(),
        sampleArenaChampion(),
      ],
      placement: 3,
    });
    expect(one.success).toBe(false);
    expect(three.success).toBe(false);
  });

  it("enforces subteamId and placement bounds", () => {
    expect(
      ArenaTeamSchema.safeParse({
        subteamId: 0,
        players: [sampleArenaChampion(), sampleArenaChampion()],
        placement: 3,
      }).success
    ).toBe(false);
    expect(
      ArenaTeamSchema.safeParse({
        subteamId: 1,
        players: [sampleArenaChampion(), sampleArenaChampion()],
        placement: 9,
      }).success
    ).toBe(false);
  });
});
