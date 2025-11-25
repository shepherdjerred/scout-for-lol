import type { Player, PlayerConfigEntry } from "@scout-for-lol/data";
import { getRanks } from "@scout-for-lol/backend/league/model/rank";

export async function getPlayer(playerConfig: PlayerConfigEntry): Promise<Player> {
  console.log(`[debug][getPlayer] Processing player: ${playerConfig.alias}`);
  console.log(`[debug][getPlayer] playerConfig keys:`, Object.keys(playerConfig));
  if ("puuid" in playerConfig) {
    console.error(
      `[debug][getPlayer] ⚠️  WARNING: playerConfig has unexpected puuid field at top level!`,
      playerConfig,
    );
  }

  const player: Player = {
    config: playerConfig,
    ranks: await getRanks(playerConfig),
  };

  console.log(`[debug][getPlayer] Built player object keys:`, Object.keys(player));
  if ("puuid" in player) {
    console.error(`[debug][getPlayer] ⚠️  WARNING: player object has unexpected puuid field!`, player);
  }
  console.log(`[debug][getPlayer] player.config keys:`, Object.keys(player.config));
  if ("puuid" in player.config) {
    console.error(`[debug][getPlayer] ⚠️  WARNING: player.config has unexpected puuid field!`, player.config);
  }

  return player;
}
