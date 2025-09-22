import { test, expect } from "bun:test";
import {
  ArenaPlacementSchema,
  ArenaTeamIdSchema,
  LeaguePuuidSchema,
  type ArenaMatch,
  type ArenaTeam,
} from "@scout-for-lol/data";
import { arenaMatchToSvg, arenaMatchToImage } from "./index.tsx";
import { writeFileSync } from "fs";

function sampleArenaMatch(): ArenaMatch {
  const teams: ArenaTeam[] = Array.from(
    { length: 8 },
    (_, i): ArenaTeam => ({
      teamId: ArenaTeamIdSchema.parse(i + 1),
      placement: ArenaPlacementSchema.parse(((i + 3) % 8) + 1),
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
          augments: [{ id: 1, type: "id" }],
          arenaMetrics: {
            playerScore0: 1,
            playerScore1: 2,
            playerScore2: 3,
            playerScore3: 4,
            playerScore4: 5,
            playerScore5: 6,
            playerScore6: 7,
            playerScore7: 8,
            playerScore8: 9,
          },
          teamSupport: {
            damageShieldedOnTeammate: 0,
            healsOnTeammate: 0,
            damageTakenPercentage: 0,
          },
        },
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
          augments: [{ id: 2, type: "id" }],
          arenaMetrics: {
            playerScore0: 1,
            playerScore1: 2,
            playerScore2: 3,
            playerScore3: 4,
            playerScore4: 5,
            playerScore5: 6,
            playerScore6: 7,
            playerScore7: 8,
            playerScore8: 9,
          },
          teamSupport: {
            damageShieldedOnTeammate: 0,
            healsOnTeammate: 0,
            damageTakenPercentage: 0,
          },
        },
      ],
    })
  );
  return {
    durationInSeconds: 900,
    queueType: "arena",
    players: [
      {
        playerConfig: {
          alias: "Player#1",
          league: {
            leagueAccount: {
              puuid: LeaguePuuidSchema.parse("x"),
              region: "PBE",
            },
          },
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
          augments: [
            { id: 101, type: "id" },
            { id: 202, type: "id" },
          ],
          arenaMetrics: {
            playerScore0: 1,
            playerScore1: 2,
            playerScore2: 3,
            playerScore3: 4,
            playerScore4: 5,
            playerScore5: 6,
            playerScore6: 7,
            playerScore7: 8,
            playerScore8: 9,
          },
          teamSupport: {
            damageShieldedOnTeammate: 0,
            healsOnTeammate: 0,
            damageTakenPercentage: 0,
          },
        },
        teamId: 1,
        teammate: {
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
          augments: [{ id: 303, type: "id" }],
          arenaMetrics: {
            playerScore0: 1,
            playerScore1: 2,
            playerScore2: 3,
            playerScore3: 4,
            playerScore4: 5,
            playerScore5: 6,
            playerScore6: 7,
            playerScore7: 8,
            playerScore8: 9,
          },
          teamSupport: {
            damageShieldedOnTeammate: 0,
            healsOnTeammate: 0,
            damageTakenPercentage: 0,
          },
        },
      },
    ],
    teams,
  };
}

test("arena report renders svg and png", async () => {
  const match = sampleArenaMatch();
  const svg = await arenaMatchToSvg(match);
  const png = await arenaMatchToImage(match);
  writeFileSync(
    new URL("__snapshots__/arena_sample.png", import.meta.url),
    png
  );
  expect(svg).toMatchSnapshot();
});
