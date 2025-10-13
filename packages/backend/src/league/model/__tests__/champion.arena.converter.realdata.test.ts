import { describe, it, expect } from "bun:test";
import { z } from "zod";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { participantToArenaChampion } from "../../model/champion.js";

import { dirname, join } from "path";
import { fileURLToPath } from "url";

const currentDir = dirname(fileURLToPath(import.meta.url));

const RAW_FILE_PATHS = [
  join(currentDir, "testdata/matches_2025_09_19_NA1_5370969615.json"),
  join(currentDir, "testdata/matches_2025_09_19_NA1_5370986469.json"),
];

async function loadParticipants(path: string): Promise<MatchV5DTOs.ParticipantDto[]> {
  const file = Bun.file(path);

  const json = (await file.json()) as unknown as MatchV5DTOs.MatchDto;
  return json.info.participants;
}

describe("participantToArenaChampion with real arena JSON", () => {
  it("extracts augments (non-zero) and maps metrics", async () => {
    for (const path of RAW_FILE_PATHS) {
      const participants = await loadParticipants(path);
      for (const dto of participants) {
        const champ = await participantToArenaChampion(dto);
        // all augments non-zero (for id-only fallback and full augment objects)
        expect(
          champ.augments.every((a) => (z.object({ id: z.number() }).safeParse(a).success ? a.id : 0) !== 0),
        ).toBe(true);
        // at most 6
        expect(champ.augments.length).toBeLessThanOrEqual(6);
        // base fields present
        expect(z.string().safeParse(champ.championName).success).toBe(true);
        expect(z.number().safeParse(champ.level).success).toBe(true);
        // metrics present as numbers or undefined
        expect(z.number().safeParse(champ.teamSupport.damageShieldedOnTeammate).success).toBe(true);
        expect(z.number().safeParse(champ.teamSupport.healsOnTeammate).success).toBe(true);
      }
    }
  });
});
