import {
  type CompletedMatch,
  type ArenaMatch,
  DiscordAccountIdSchema,
  LeaguePuuidSchema,
} from "@scout-for-lol/data";
import { matchToSvg, svgToPng } from "./index.js";
import { test, expect } from "bun:test";
import { writeFileSync } from "fs";
import { createHash } from "crypto";

/**
 * Hash SVG content for snapshot testing.
 * This provides a stable hash for comparison while keeping snapshots manageable.
 */
function hashSvg(svg: string): string {
  return createHash("sha256").update(svg).digest("hex");
}

function getMatch(): CompletedMatch {
  return {
    queueType: "solo",
    players: [
      {
        playerConfig: {
          alias: "name",
          league: {
            leagueAccount: {
              puuid: LeaguePuuidSchema.parse(
                "XtEsV464OFaO3c0_q9REa6wYF0HpC2LK4laLnyM7WhfAVeuDz9biieJ5ZRD049AUCBjLjyBeeezTaw"
              ),
              region: "AMERICA_NORTH",
            },
          },
          discordAccount: {
            id: DiscordAccountIdSchema.parse("12345678901234567"),
          },
        },
        rankBeforeMatch: {
          division: 4,
          tier: "gold",
          lp: 90,
          wins: 10,
          losses: 20,
        },
        rankAfterMatch: {
          division: 3,
          tier: "gold",
          lp: 0,
          wins: 50,
          losses: 30,
        },
        wins: 10,
        losses: 20,
        champion: {
          riotIdGameName: "zombie villager",
          championName: "Aatrox",
          kills: 8,
          deaths: 9,
          assists: 4,
          items: [1031, 0, 3047, 3814, 6691, 6694, 3364],
          spells: [4, 12],
          runes: [],
          lane: "top",
          creepScore: 180,
          visionScore: 19,
          damage: 18645,
          gold: 12053,
          level: 16,
        },
        outcome: "Defeat",
        team: "blue",
        lane: "top",
        laneOpponent: {
          riotIdGameName: "CPHS WARRIOR",
          championName: "Garen",
          kills: 16,
          deaths: 7,
          assists: 1,
          items: [3078, 3181, 3046, 3071, 3035, 3006, 3340],
          spells: [14, 4],
          runes: [],
          lane: "top",
          creepScore: 219,
          visionScore: 25,
          damage: 29663,
          gold: 17426,
          level: 18,
        },
      },
    ],
    durationInSeconds: 1851,
    teams: {
      blue: [
        {
          riotIdGameName: "Mr Spaghetti",
          championName: "Aatrox",
          kills: 8,
          deaths: 9,
          assists: 4,
          items: [1031, 0, 3047, 3814, 6691, 6694, 3364],
          spells: [4, 12],
          runes: [],
          lane: "top",
          creepScore: 180,
          visionScore: 19,
          damage: 18645,
          gold: 12053,
          level: 16,
        },
        {
          riotIdGameName: "zainji",
          championName: "Nocturne",
          kills: 9,
          deaths: 8,
          assists: 10,
          items: [1031, 6631, 3133, 3156, 3047, 3071, 3363],
          spells: [4, 11],
          runes: [],
          lane: "jungle",
          creepScore: 188,
          visionScore: 21,
          damage: 22737,
          gold: 13930,
          level: 15,
        },
        {
          riotIdGameName: "Neeeeeeelson",
          championName: "Akali",
          kills: 8,
          deaths: 2,
          assists: 11,
          items: [3089, 3111, 3152, 2055, 1082, 4645, 3364],
          spells: [12, 4],
          runes: [],
          lane: "middle",
          creepScore: 215,
          visionScore: 27,
          damage: 23266,
          gold: 12686,
          level: 16,
        },
        {
          riotIdGameName: "aaronchou",
          championName: "Zeri",
          kills: 7,
          deaths: 10,
          assists: 9,
          items: [1055, 3006, 3095, 6675, 3046, 3035, 3363],
          spells: [7, 4],
          runes: [],
          lane: "adc",
          creepScore: 202,
          visionScore: 16,
          damage: 25720,
          gold: 12583,
          level: 14,
        },
        {
          riotIdGameName: "hellorandom",
          championName: "Lulu",
          kills: 1,
          deaths: 4,
          assists: 18,
          items: [3853, 3222, 2055, 3158, 3012, 6620, 3364],
          spells: [14, 4],
          runes: [],
          lane: "support",
          creepScore: 23,
          visionScore: 42,
          damage: 8947,
          gold: 7665,
          level: 13,
        },
      ],
      red: [
        {
          riotIdGameName: "how2smo",
          championName: "Garen",
          kills: 16,
          deaths: 7,
          assists: 1,
          items: [3078, 3181, 3046, 3071, 3035, 3006, 3340],
          spells: [14, 4],
          runes: [],
          lane: "top",
          creepScore: 219,
          visionScore: 25,
          damage: 29663,
          gold: 17426,
          level: 18,
        },
        {
          riotIdGameName: "Oroulerd",
          championName: "Zac",
          kills: 0,
          deaths: 7,
          assists: 10,
          items: [6665, 2055, 3047, 1033, 3068, 0, 3364],
          spells: [11, 4],
          runes: [],
          lane: "jungle",
          creepScore: 134,
          visionScore: 32,
          damage: 10916,
          gold: 9051,
          level: 14,
        },
        {
          riotIdGameName: "suggsyman",
          championName: "Viktor",
          kills: 4,
          deaths: 7,
          assists: 4,
          items: [1056, 6653, 3020, 4645, 3135, 0, 3340],
          spells: [12, 4],
          runes: [],
          lane: "middle",
          creepScore: 193,
          visionScore: 21,
          damage: 15943,
          gold: 11613,
          level: 15,
        },
        {
          riotIdGameName: "zombie villager",
          championName: "Yasuo",
          kills: 9,
          deaths: 7,
          assists: 8,
          items: [3026, 3031, 0, 6672, 6673, 3006, 3363],
          spells: [3, 4],
          runes: [],
          lane: "adc",
          creepScore: 247,
          visionScore: 23,
          damage: 24510,
          gold: 15965,
          level: 16,
        },
        {
          riotIdGameName: "sjerred",
          championName: "Xerath",
          kills: 4,
          deaths: 5,
          assists: 15,
          items: [3853, 4645, 6653, 1052, 3020, 1058, 3364],
          spells: [12, 4],
          runes: [],
          lane: "support",
          creepScore: 38,
          visionScore: 67,
          damage: 24395,
          gold: 10759,
          level: 14,
        },
      ],
    },
  };
}

test("sanity check", async () => {
  const svg = await matchToSvg(getMatch());
  const png = svgToPng(svg);
  writeFileSync(new URL("__snapshots__/match.png", import.meta.url), png);

  expect(hashSvg(svg)).toMatchSnapshot();
});

test("no items test", async () => {
  const matchNoItems = getMatch();
  if (matchNoItems.players[0]?.champion) {
    matchNoItems.players[0].champion.items = [0, 0, 0, 0, 0, 0, 0];
  }
  matchNoItems.teams.blue.forEach(
    (player) => (player.items = [0, 0, 0, 0, 0, 0, 0])
  );
  matchNoItems.teams.red.forEach(
    (player) => (player.items = [0, 0, 0, 0, 0, 0, 0])
  );

  const svg = await matchToSvg(matchNoItems);
  const png = svgToPng(svg);
  writeFileSync(
    new URL("__snapshots__/match_no_items.png", import.meta.url),
    png
  );

  expect(hashSvg(svg)).toMatchSnapshot();
});

test("all fields zeroed out test", async () => {
  const matchZeroedOut = getMatch();
  matchZeroedOut.durationInSeconds = 0;
  matchZeroedOut.players.forEach((player) => {
    player.rankBeforeMatch = {
      wins: 0,
      losses: 0,
      tier: "iron",
      division: 4,
      lp: 0,
    };
    player.rankAfterMatch = {
      wins: 0,
      losses: 0,
      tier: "iron",
      division: 4,
      lp: 0,
    };
    player.wins = 0;
    player.losses = 0;

    player.champion.kills = 0;
    player.champion.deaths = 0;
    player.champion.assists = 0;
    player.champion.items = [0, 0, 0, 0, 0, 0, 0];
    player.champion.creepScore = 0;
    player.champion.visionScore = 0;
    player.champion.damage = 0;
    player.champion.gold = 0;
    player.champion.level = 0;
  });
  matchZeroedOut.teams.blue.forEach((player) => {
    player.kills = 0;
    player.deaths = 0;
    player.assists = 0;
    player.items = [0, 0, 0, 0, 0, 0, 0];
    player.creepScore = 0;
    player.visionScore = 0;
    player.damage = 0;
    player.gold = 0;
    player.level = 0;
  });
  matchZeroedOut.teams.red.forEach((player) => {
    player.kills = 0;
    player.deaths = 0;
    player.assists = 0;
    player.items = [0, 0, 0, 0, 0, 0, 0];
    player.creepScore = 0;
    player.visionScore = 0;
    player.damage = 0;
    player.gold = 0;
    player.level = 0;
  });

  const svg = await matchToSvg(matchZeroedOut);
  const png = svgToPng(svg);
  writeFileSync(
    new URL("__snapshots__/match_zeroed_out.png", import.meta.url),
    png
  );

  expect(hashSvg(svg)).toMatchSnapshot();
});

test("no rank test", async () => {
  const matchNoRank = getMatch();
  matchNoRank.players.forEach((player) => {
    player.rankBeforeMatch = undefined;
    player.rankAfterMatch = undefined;
  });

  const svg = await matchToSvg(matchNoRank);
  const png = svgToPng(svg);
  writeFileSync(
    new URL("__snapshots__/match_no_rank.png", import.meta.url),
    png
  );

  expect(hashSvg(svg)).toMatchSnapshot();
});

test("large values test", async () => {
  const matchLargeValues = getMatch();
  matchLargeValues.players.forEach((player) => {
    player.playerConfig.alias = "SummonerName12345";
    player.champion.championName = "Nunu & Willump";
    player.champion.kills = 45;
  });
  matchLargeValues.durationInSeconds = 3660; // 1 hour and 1 minute

  matchLargeValues.teams.blue.forEach((player) => {
    player.riotIdGameName = "SummonerName12345";
    player.championName = "Nunu & Willump";
    player.kills = 45;
    player.deaths = 40;
    player.assists = 50;
    player.items = [3031, 3031, 3031, 3031, 3031, 3031, 3031];
    player.creepScore = 999;
    player.visionScore = 500;
    player.damage = 999999;
    player.gold = 500000;
    player.level = 25;
  });

  matchLargeValues.teams.red.forEach((player) => {
    player.riotIdGameName = "SummonerName12345";
    player.championName = "Nunu & Willump";
    player.kills = 45;
    player.deaths = 0;
    player.assists = 50;
    player.items = [3031, 3031, 3031, 3031, 3031, 3031, 3031];
    player.creepScore = 999;
    player.visionScore = 500;
    player.damage = 999999;
    player.gold = 500000;
    player.level = 25;
  });

  const svg = await matchToSvg(matchLargeValues);
  const png = svgToPng(svg);
  writeFileSync(
    new URL("__snapshots__/match_large_values.png", import.meta.url),
    png
  );

  expect(hashSvg(svg)).toMatchSnapshot();
});

test("victory test", async () => {
  const matchVictory = getMatch();
  matchVictory.players.forEach((player) => {
    player.outcome = "Victory";
  });

  const svg = await matchToSvg(matchVictory);
  const png = svgToPng(svg);
  writeFileSync(
    new URL("__snapshots__/match_victory.png", import.meta.url),
    png
  );

  expect(hashSvg(svg)).toMatchSnapshot();
});

test("surrender test", async () => {
  const matchSurrender = getMatch();
  matchSurrender.players.forEach((player) => {
    player.outcome = "Surrender";
  });

  const svg = await matchToSvg(matchSurrender);
  const png = svgToPng(svg);
  writeFileSync(
    new URL("__snapshots__/match_surrender.png", import.meta.url),
    png
  );

  expect(hashSvg(svg)).toMatchSnapshot();
});

test("no rank before match test", async () => {
  const matchNoRankBefore = getMatch();
  matchNoRankBefore.players.forEach((player) => {
    player.rankBeforeMatch = undefined;
    player.rankAfterMatch = {
      wins: 50,
      losses: 30,
      tier: "gold",
      division: 3,
      lp: 0,
    };
  });

  const svg = await matchToSvg(matchNoRankBefore);
  const png = svgToPng(svg);
  writeFileSync(
    new URL("__snapshots__/match_no_rank_before.png", import.meta.url),
    png
  );

  expect(hashSvg(svg)).toMatchSnapshot();
});

test("multiple highlighted players test", async () => {
  const match: CompletedMatch = getMatch();
  // Add a second highlighted player
  match.players.push({
    playerConfig: {
      alias: "second player",
      league: {
        leagueAccount: {
          puuid: LeaguePuuidSchema.parse(
            "XtEsV464OFaO3c0_q9REa6wYF0HpC2LK4laLnyM7WhfAVeuDa9biieJ5ZRD049AUCBjLjyBeeezTaw"
          ),
          region: "AMERICA_NORTH",
        },
      },
      discordAccount: {
        id: DiscordAccountIdSchema.parse("98765432109876543"),
      },
    },
    rankBeforeMatch: {
      division: 2,
      tier: "silver",
      lp: 50,
      wins: 20,
      losses: 10,
    },
    rankAfterMatch: {
      division: 1,
      tier: "silver",
      lp: 0,
      wins: 25,
      losses: 12,
    },
    wins: 20,
    losses: 10,
    champion: {
      riotIdGameName: "Mr Spaghetti",
      championName: "Aatrox",
      kills: 5,
      deaths: 2,
      assists: 15,
      items: [1056, 3285, 3020, 3165, 3102, 3089, 3363],
      spells: [4, 7],
      runes: [],
      lane: "middle",
      creepScore: 210,
      visionScore: 25,
      damage: 22000,
      gold: 13000,
      level: 17,
    },
    outcome: "Victory",
    team: "blue",
    lane: "middle",
    laneOpponent: {
      riotIdGameName: "enemy mid",
      championName: "Zed",
      kills: 7,
      deaths: 7,
      assists: 7,
      items: [3142, 6692, 3158, 3071, 3814, 6694, 3364],
      spells: [4, 14],
      runes: [],
      lane: "middle",
      creepScore: 185,
      visionScore: 15,
      damage: 18000,
      gold: 12000,
      level: 16,
    },
  });

  const svg = await matchToSvg(match);
  const png = svgToPng(svg);
  writeFileSync(
    new URL(
      "__snapshots__/match_multiple_highlighted_players.png",
      import.meta.url
    ),
    png
  );

  expect(hashSvg(svg)).toMatchSnapshot();
});

test("16-player Arena match test", async () => {
  const arenaMatch: ArenaMatch = {
    queueType: "arena",
    players: [
      {
        playerConfig: {
          alias: "Arena Player 1",
          league: {
            leagueAccount: {
              puuid: LeaguePuuidSchema.parse(
                "XtEsV464OFaO3c0_q9REa6wYF0HpC2LK4laLnyM7WhfAVeuDz9biieJ5ZRD049AUCBjLjyBeeezTaw"
              ),
              region: "AMERICA_NORTH",
            },
          },
          discordAccount: {
            id: DiscordAccountIdSchema.parse("11111111111111111"),
          },
        },
        rankBeforeMatch: {
          division: 2,
          tier: "gold",
          lp: 75,
          wins: 15,
          losses: 10,
        },
        rankAfterMatch: {
          division: 1,
          tier: "gold",
          lp: 25,
          wins: 16,
          losses: 10,
        },
        wins: 15,
        losses: 10,
        champion: {
          riotIdGameName: "Arena Player 1",
          championName: "Yasuo",
          kills: 8,
          deaths: 3,
          assists: 12,
          items: [3031, 3006, 3814, 6673, 3046, 3035, 3364],
          spells: [3, 4],
          runes: [],
          lane: "middle",
          creepScore: 0, // Arena has no CS
          visionScore: 15,
          damage: 25000,
          gold: 15000,
          level: 15,
        },
        outcome: "Victory",
        team: 1,
        placement: 1,
        teammateChampion: {
          riotIdGameName: "Arena Player 2",
          championName: "Jinx",
          kills: 6,
          deaths: 4,
          assists: 10,
          items: [3031, 3006, 3094, 6675, 3046, 3035, 3364],
          spells: [7, 4],
          runes: [],
          lane: "adc",
          creepScore: 0,
          visionScore: 12,
          damage: 28000,
          gold: 16000,
          level: 15,
        },
      },
    ],
    durationInSeconds: 1200, // 20 minutes
    teams: {
      team1: [
        {
          riotIdGameName: "Arena Player 1",
          championName: "Yasuo",
          kills: 8,
          deaths: 3,
          assists: 12,
          items: [3031, 3006, 3814, 6673, 3046, 3035, 3364],
          spells: [3, 4],
          runes: [],
          lane: "middle",
          creepScore: 0,
          visionScore: 15,
          damage: 25000,
          gold: 15000,
          level: 15,
        },
        {
          riotIdGameName: "Arena Player 2",
          championName: "Jinx",
          kills: 6,
          deaths: 4,
          assists: 10,
          items: [3031, 3006, 3094, 6675, 3046, 3035, 3364],
          spells: [7, 4],
          runes: [],
          lane: "adc",
          creepScore: 0,
          visionScore: 12,
          damage: 28000,
          gold: 16000,
          level: 15,
        },
      ],
      team2: [
        {
          riotIdGameName: "Arena Player 3",
          championName: "Akali",
          kills: 7,
          deaths: 5,
          assists: 8,
          items: [3089, 3020, 3152, 4645, 3135, 3006, 3364],
          spells: [12, 4],
          runes: [],
          lane: "middle",
          creepScore: 0,
          visionScore: 18,
          damage: 24000,
          gold: 14500,
          level: 14,
        },
        {
          riotIdGameName: "Arena Player 4",
          championName: "Graves",
          kills: 5,
          deaths: 6,
          assists: 9,
          items: [3031, 3006, 3814, 6675, 3046, 3035, 3364],
          spells: [4, 11],
          runes: [],
          lane: "jungle",
          creepScore: 0,
          visionScore: 10,
          damage: 22000,
          gold: 13000,
          level: 14,
        },
      ],
      team3: [
        {
          riotIdGameName: "Arena Player 5",
          championName: "Zed",
          kills: 6,
          deaths: 7,
          assists: 7,
          items: [3142, 6692, 3158, 3071, 3814, 6694, 3364],
          spells: [4, 14],
          runes: [],
          lane: "middle",
          creepScore: 0,
          visionScore: 14,
          damage: 20000,
          gold: 12000,
          level: 13,
        },
        {
          riotIdGameName: "Arena Player 6",
          championName: "Caitlyn",
          kills: 4,
          deaths: 8,
          assists: 6,
          items: [3031, 3006, 3094, 6675, 3046, 3035, 3364],
          spells: [7, 4],
          runes: [],
          lane: "adc",
          creepScore: 0,
          visionScore: 8,
          damage: 18000,
          gold: 11000,
          level: 13,
        },
      ],
      team4: [
        {
          riotIdGameName: "Arena Player 7",
          championName: "Fiora",
          kills: 5,
          deaths: 9,
          assists: 5,
          items: [3078, 3181, 3046, 3071, 3035, 3006, 3364],
          spells: [14, 4],
          runes: [],
          lane: "top",
          creepScore: 0,
          visionScore: 12,
          damage: 19000,
          gold: 10500,
          level: 12,
        },
        {
          riotIdGameName: "Arena Player 8",
          championName: "Leona",
          kills: 2,
          deaths: 10,
          assists: 8,
          items: [3853, 3222, 2055, 3158, 3012, 6620, 3364],
          spells: [14, 4],
          runes: [],
          lane: "support",
          creepScore: 0,
          visionScore: 25,
          damage: 8000,
          gold: 8000,
          level: 12,
        },
      ],
      team5: [
        {
          riotIdGameName: "Arena Player 9",
          championName: "Riven",
          kills: 3,
          deaths: 11,
          assists: 4,
          items: [3078, 3181, 3046, 3071, 3035, 3006, 3364],
          spells: [14, 4],
          runes: [],
          lane: "top",
          creepScore: 0,
          visionScore: 10,
          damage: 16000,
          gold: 9000,
          level: 11,
        },
        {
          riotIdGameName: "Arena Player 10",
          championName: "Thresh",
          kills: 1,
          deaths: 12,
          assists: 7,
          items: [3853, 3222, 2055, 3158, 3012, 6620, 3364],
          spells: [14, 4],
          runes: [],
          lane: "support",
          creepScore: 0,
          visionScore: 22,
          damage: 7000,
          gold: 7500,
          level: 11,
        },
      ],
      team6: [
        {
          riotIdGameName: "Arena Player 11",
          championName: "Darius",
          kills: 2,
          deaths: 13,
          assists: 3,
          items: [3078, 3181, 3046, 3071, 3035, 3006, 3364],
          spells: [14, 4],
          runes: [],
          lane: "top",
          creepScore: 0,
          visionScore: 8,
          damage: 14000,
          gold: 8500,
          level: 10,
        },
        {
          riotIdGameName: "Arena Player 12",
          championName: "Blitzcrank",
          kills: 0,
          deaths: 14,
          assists: 5,
          items: [3853, 3222, 2055, 3158, 3012, 6620, 3364],
          spells: [14, 4],
          runes: [],
          lane: "support",
          creepScore: 0,
          visionScore: 18,
          damage: 6000,
          gold: 7000,
          level: 10,
        },
      ],
      team7: [
        {
          riotIdGameName: "Arena Player 13",
          championName: "Garen",
          kills: 1,
          deaths: 15,
          assists: 2,
          items: [3078, 3181, 3046, 3071, 3035, 3006, 3364],
          spells: [14, 4],
          runes: [],
          lane: "top",
          creepScore: 0,
          visionScore: 6,
          damage: 12000,
          gold: 6500,
          level: 9,
        },
        {
          riotIdGameName: "Arena Player 14",
          championName: "Soraka",
          kills: 0,
          deaths: 16,
          assists: 3,
          items: [3853, 3222, 2055, 3158, 3012, 6620, 3364],
          spells: [14, 4],
          runes: [],
          lane: "support",
          creepScore: 0,
          visionScore: 15,
          damage: 4000,
          gold: 6000,
          level: 9,
        },
      ],
      team8: [
        {
          riotIdGameName: "Arena Player 15",
          championName: "Teemo",
          kills: 0,
          deaths: 17,
          assists: 1,
          items: [3089, 3020, 3152, 4645, 3135, 3006, 3364],
          spells: [12, 4],
          runes: [],
          lane: "top",
          creepScore: 0,
          visionScore: 4,
          damage: 10000,
          gold: 5500,
          level: 8,
        },
        {
          riotIdGameName: "Arena Player 16",
          championName: "Yuumi",
          kills: 0,
          deaths: 18,
          assists: 2,
          items: [3853, 3222, 2055, 3158, 3012, 6620, 3364],
          spells: [14, 4],
          runes: [],
          lane: "support",
          creepScore: 0,
          visionScore: 12,
          damage: 3000,
          gold: 5000,
          level: 8,
        },
      ],
    },
  };

  const svg = await matchToSvg(arenaMatch);
  const png = svgToPng(svg);
  writeFileSync(
    new URL("__snapshots__/arena_16_players.png", import.meta.url),
    png
  );

  expect(hashSvg(svg)).toMatchSnapshot();
});
