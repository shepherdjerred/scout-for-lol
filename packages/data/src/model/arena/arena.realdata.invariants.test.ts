import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RAW_FILE_PATHS = [
  join(__dirname, "testdata/matches_2025_09_19_NA1_5370969615.json"),
  join(__dirname, "testdata/matches_2025_09_19_NA1_5370986469.json"),
];

const RawArenaParticipantSchema = z.object({
  playerSubteamId: z.number(),
  placement: z.number(),
  playerAugment1: z.number().optional(),
  playerAugment2: z.number().optional(),
  playerAugment3: z.number().optional(),
  playerAugment4: z.number().optional(),
  playerAugment5: z.number().optional(),
  playerAugment6: z.number().optional(),
  totalDamageShieldedOnTeammates: z.number().optional(),
  totalHealsOnTeammates: z.number().optional(),
});

const RawArenaMatchSchema = z.object({
  info: z.object({
    gameMode: z.string(),
    mapId: z.number(),
    participants: z.array(RawArenaParticipantSchema),
    queueId: z.number().optional(),
  }),
  metadata: z.unknown().optional(),
});

async function loadRawMatch(filePath: string) {
  const file = Bun.file(filePath);
  const json = (await file.json());
  return RawArenaMatchSchema.parse(json);
}

describe("Real Arena JSON invariants", () => {
  it("has CHERRY gameMode, mapId 30, 16 participants, queue 1700 when present", async () => {
    for (const path of RAW_FILE_PATHS) {
      const match = await loadRawMatch(path);
      expect(match.info.gameMode).toBe("CHERRY");
      expect(match.info.mapId).toBe(30);
      expect(match.info.participants.length).toBe(16);
      if (typeof match.info.queueId === "number") {
        expect(match.info.queueId).toBe(1700);
      }
    }
  });

  it("groups into exactly 8 subteams of 2, with placement 1..8 and consistent within subteam", async () => {
    for (const path of RAW_FILE_PATHS) {
      const match = await loadRawMatch(path);
      const groups = new Map<
        number,
        { count: number; placements: Set<number> }
      >();
      for (const p of match.info.participants) {
        const g = groups.get(p.playerSubteamId) ?? {
          count: 0,
          placements: new Set<number>(),
        };
        g.count += 1;
        g.placements.add(p.placement);
        groups.set(p.playerSubteamId, g);
        expect(p.playerSubteamId).toBeGreaterThanOrEqual(1);
        expect(p.playerSubteamId).toBeLessThanOrEqual(8);
        expect(p.placement).toBeGreaterThanOrEqual(1);
        expect(p.placement).toBeLessThanOrEqual(8);
      }
      expect(groups.size).toBe(8);
      for (const [, g] of groups) {
        expect(g.count).toBe(2);
        expect(g.placements.size).toBe(1);
      }
    }
  });

  it("each participant has up to 6 augments with zeros meaning absent", async () => {
    for (const path of RAW_FILE_PATHS) {
      const match = await loadRawMatch(path);
      for (const p of match.info.participants) {
        const augs = [
          p.playerAugment1 ?? 0,
          p.playerAugment2 ?? 0,
          p.playerAugment3 ?? 0,
          p.playerAugment4 ?? 0,
          p.playerAugment5 ?? 0,
          p.playerAugment6 ?? 0,
        ];
        expect(augs.length).toBeLessThanOrEqual(6);
        const nonZero = augs.filter((x) => x !== 0);
        expect(nonZero.length).toBeLessThanOrEqual(6);
      }
    }
  });
});
