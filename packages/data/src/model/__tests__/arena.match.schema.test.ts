import { describe, it, expect } from "bun:test";
import {
  ArenaMatchSchema,
  ArenaChampionSchema,
  type ArenaChampion,
  ArenaSubteamSchema,
} from "@scout-for-lol/data";

const arenaChamp = (): ArenaChampion =>
  ArenaChampionSchema.parse({
    riotIdGameName: "P#NA1",
    championName: "Jhin",
    kills: 6,
    deaths: 2,
    assists: 4,
    level: 18,
    items: [6671],
    spells: [4, 7],
    gold: 11000,
    runes: [],
    creepScore: 0,
    visionScore: 0,
    damage: 18000,
    augments: [301, 401],
    arenaMetrics: {},
    teamSupport: {},
  });

const subteam = (id: number, placement: number) =>
  ArenaSubteamSchema.parse({
    subteamId: id,
    players: [arenaChamp(), arenaChamp()],
    placement,
  });

describe("ArenaMatchSchema", () => {
  it("accepts exactly 8 subteams of 2 players each", () => {
    const match = ArenaMatchSchema.parse({
      durationInSeconds: 900,
      players: [],
      subteams: [
        subteam(1, 4),
        subteam(2, 8),
        subteam(3, 2),
        subteam(4, 6),
        subteam(5, 1),
        subteam(6, 7),
        subteam(7, 3),
        subteam(8, 5),
      ],
    });
    expect(match.subteams.length).toBe(8);
  });

  it("rejects when subteams length is not 8", () => {
    expect(() =>
      ArenaMatchSchema.parse({
        durationInSeconds: 900,
        players: [],
        subteams: [subteam(1, 1)],
      }),
    ).toThrow();
  });
});
