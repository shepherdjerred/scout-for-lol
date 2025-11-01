import { describe, it, expect } from "bun:test";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { ArenaMatchSchema, LeaguePuuidSchema, type Player } from "@scout-for-lol/data";
import { toArenaMatch } from "../match.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { testGuildId, testAccountId, testChannelId, testPuuid, testDate } from "../../../testing/test-ids.js";

const currentDir = dirname(fileURLToPath(import.meta.url));

const RAW_FILE_PATHS = [
  join(currentDir, "testdata/matches_2025_09_19_NA1_5370969615.json"),
  join(currentDir, "testdata/matches_2025_09_19_NA1_5370986469.json"),
];

async function loadMatch(path: string): Promise<MatchV5DTOs.MatchDto> {
  const file = Bun.file(path);
  const json = (await file.json()) as unknown;
  return json as MatchV5DTOs.MatchDto;
}

describe("toArenaMatch with real arena JSON", () => {
  it("produces valid ArenaMatch for each provided real match JSON", async () => {
    for (const path of RAW_FILE_PATHS) {
      const matchDto = await loadMatch(path);
      expect(matchDto.info.queueId).toBe(1700);
      expect(matchDto.info.gameMode).toBe("CHERRY");
      expect(matchDto.info.mapId).toBe(30);
      expect(matchDto.info.participants.length).toBe(16);
      // choose first participant as the tracked player
      const tracked = matchDto.info.participants[0];
      if (!tracked) throw new Error("participants should not be empty in real data test");

      const player = {
        config: {
          alias: "RealDataUser",
          league: {
            leagueAccount: {
              puuid: LeaguePuuidSchema.parse(tracked.puuid),
              region: "PBE",
            },
          },
          discordAccount: undefined,
        },
        ranks: {},
      } satisfies Player;

      const arenaMatch = await toArenaMatch([player], matchDto);
      const parsed = ArenaMatchSchema.parse(arenaMatch);

      expect(parsed).toMatchSnapshot();
    }
  });
});
