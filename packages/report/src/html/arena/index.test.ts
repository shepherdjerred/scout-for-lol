import { test, expect } from "bun:test";
import { type ArenaMatch } from "@scout-for-lol/data";
import { arenaMatchToSvg, arenaMatchToImage } from "./index.tsx";
import { writeFileSync } from "fs";

function sampleArenaMatch(): ArenaMatch {
  return {
    durationInSeconds: 900,
    queueType: "arena",
    players: [
      {
        playerConfig: {
          alias: "Player#1",
          league: { leagueAccount: { puuid: "x" as any, region: "PBE" } },
          discordAccount: null,
        },
        placement: 3,
        champion: {
          riotIdGameName: "Player#1",
          championName: "Lux",
          kills: 3,
          deaths: 1,
          assists: 4,
          items: [],
          spells: [],
          runes: [],
          creepScore: 0,
          visionScore: 0,
          damage: 12000,
          gold: 9000,
          level: 18,
          augments: [101, 202],
        } as any,
        team: 1,
        arenaTeammate: {
          riotIdGameName: "Mate#1",
          championName: "Jhin",
          kills: 2,
          deaths: 2,
          assists: 5,
          items: [],
          spells: [],
          runes: [],
          creepScore: 0,
          visionScore: 0,
          damage: 10000,
          gold: 8000,
          level: 18,
          augments: [303],
        } as any,
      },
    ],
    subteams: Array.from({ length: 8 }, (_, i) => ({
      subteamId: i + 1,
      placement: (i + 3) % 8 + 1,
      players: [
        {
          riotIdGameName: "A",
          championName: "Lux",
          kills: 0,
          deaths: 0,
          assists: 0,
          items: [],
          spells: [],
          runes: [],
          creepScore: 0,
          visionScore: 0,
          damage: 0,
          gold: 0,
          level: 1,
          augments: [1],
        } as any,
        {
          riotIdGameName: "B",
          championName: "Jhin",
          kills: 0,
          deaths: 0,
          assists: 0,
          items: [],
          spells: [],
          runes: [],
          creepScore: 0,
          visionScore: 0,
          damage: 0,
          gold: 0,
          level: 1,
          augments: [2],
        } as any,
      ],
    })),
  };
}

test("arena report renders svg and png", async () => {
  const match = sampleArenaMatch();
  const svg = await arenaMatchToSvg(match);
  const png = await arenaMatchToImage(match);
  writeFileSync(new URL("__snapshots__/arena_sample.png", import.meta.url), png);
  expect(svg).toMatchSnapshot();
});
