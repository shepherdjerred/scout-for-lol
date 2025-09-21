import { test, expect } from "bun:test";
import { writeFileSync } from "fs";
import { arenaMatchToImage } from "./index.tsx";
import type { ArenaMatch, ArenaSubteam } from "@scout-for-lol/data";
import { mapAugmentIdsToUnion } from "@scout-for-lol/data";

const RAW_FILE_PATHS = [
  "/workspaces/scout-for-lol/arena/matches_2025_09_19_NA1_5370969615.json",
  "/workspaces/scout-for-lol/arena/matches_2025_09_19_NA1_5370986469.json",
];

async function toChampion(p: unknown) {
  const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5].filter(
    (x: unknown) => typeof x === "number" && x !== 0
  );
  const spells = [p.summoner1Id, p.summoner2Id].filter(
    (x: unknown) => typeof x === "number"
  );
  const augmentIds = [
    p.playerAugment1,
    p.playerAugment2,
    p.playerAugment3,
    p.playerAugment4,
    p.playerAugment5,
    p.playerAugment6,
  ].filter((x: unknown) => typeof x === "number" && x !== 0);
  const augments = await mapAugmentIdsToUnion(augmentIds);

  return {
    riotIdGameName:
      typeof p.riotIdGameName === "string" && p.riotIdGameName.length > 0
        ? p.riotIdGameName
        : typeof p.summonerName === "string" && p.summonerName.length > 0
          ? p.summonerName
          : "Unknown",
    championName: p.championName ?? "Unknown",
    kills: p.kills ?? 0,
    deaths: p.deaths ?? 0,
    assists: p.assists ?? 0,
    items,
    spells,
    runes: [],
    creepScore: (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0),
    visionScore: p.visionScore ?? 0,
    damage: p.totalDamageDealtToChampions ?? 0,
    gold: p.goldEarned ?? 0,
    level: p.champLevel ?? 1,
    augments,
    arenaMetrics: {},
    teamSupport: {},
  };
}

async function toSubteams(participants: unknown[]): Promise<ArenaSubteam[]> {
  const bySubteam = new Map<number, unknown[]>();
  for (const p of participants) {
    const subId = p.playerSubteamId;
    if (typeof subId !== "number") continue;
    const arr = bySubteam.get(subId) ?? [];
    arr.push(p);
    bySubteam.set(subId, arr);
  }
  const result: ArenaSubteam[] = [];
  for (const [subteamId, players] of bySubteam) {
    const champions = await Promise.all(players.slice(0, 2).map(toChampion));
    const placement =
      typeof players[0]?.placement === "number" ? players[0].placement : 8;
    result.push({ subteamId, players: champions, placement });
  }
  // Ensure we always return 8 subteams for renderer layout
  return result.sort((a, b) => a.subteamId - b.subteamId).slice(0, 8);
}

async function loadArenaMatch(path: string): Promise<ArenaMatch> {
  const json = await Bun.file(path).json();
  const info = json.info;
  const participants = Array.isArray(info?.participants)
    ? info.participants
    : [];
  if (participants.length === 0)
    throw new Error("participants missing in real data file");

  const subteams = await toSubteams(participants);

  const tracked = participants[0];
  const trackedSubId = tracked.playerSubteamId;
  const teammate =
    participants.find(
      (p: unknown) =>
        p.playerSubteamId === trackedSubId && p.puuid !== tracked.puuid
    ) ?? participants[1];

  const match: ArenaMatch = {
    durationInSeconds: info.gameDuration ?? 0,
    queueType: "arena",
    players: [
      {
        playerConfig: {
          alias: "RealDataUser",
          league: { leagueAccount: { puuid: tracked.puuid, region: "PBE" } },
          discordAccount: null,
        },
        placement:
          typeof tracked.placement === "number" ? tracked.placement : 8,
        champion: await toChampion(tracked),
        team:
          typeof tracked.playerSubteamId === "number"
            ? tracked.playerSubteamId
            : 1,
        arenaTeammate: await toChampion(teammate),
      },
    ],
    subteams,
  };

  return match;
}

for (const path of RAW_FILE_PATHS) {
  test(`arena real data renders image for ${path.split("/").pop()}`, async () => {
    const match = await loadArenaMatch(path);
    const png = await arenaMatchToImage(match);
    expect(png.length).toBeGreaterThan(1024); // basic sanity check
    const fileName =
      path.split("/").pop()?.replace(".json", ".png") ?? "arena_real.png";
    writeFileSync(new URL(`__snapshots__/${fileName}`, import.meta.url), png);
  });
}
