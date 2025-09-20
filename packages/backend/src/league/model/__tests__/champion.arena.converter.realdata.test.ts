import { describe, it, expect } from "bun:test";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { participantToArenaChampion } from "../../model/champion.js";

const RAW_FILE_PATHS = [
  "/workspaces/scout-for-lol/arena/matches_2025_09_19_NA1_5370969615.json",
  "/workspaces/scout-for-lol/arena/matches_2025_09_19_NA1_5370986469.json",
];

async function loadParticipants(path: string): Promise<MatchV5DTOs.ParticipantDto[]> {
  const file = Bun.file(path);
  const json = await file.json();
  return json.info.participants as MatchV5DTOs.ParticipantDto[];
}

describe("participantToArenaChampion with real arena JSON", () => {
  it("extracts augments (non-zero) and maps metrics", async () => {
    for (const path of RAW_FILE_PATHS) {
      const participants = await loadParticipants(path);
      for (const dto of participants) {
        const champ = participantToArenaChampion(dto);
        // all augments non-zero
        expect(champ.augments.every((a) => a !== 0)).toBe(true);
        // at most 6
        expect(champ.augments.length).toBeLessThanOrEqual(6);
        // base fields present
        expect(typeof champ.championName).toBe("string");
        expect(typeof champ.level).toBe("number");
        // metrics present as numbers or undefined
        expect(typeof champ.teamSupport.damageShieldedOnTeammate === "number" || champ.teamSupport.damageShieldedOnTeammate === undefined).toBe(true);
        expect(typeof champ.teamSupport.healsOnTeammate === "number" || champ.teamSupport.healsOnTeammate === undefined).toBe(true);
      }
    }
  });
});
