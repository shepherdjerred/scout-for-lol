import type { Player, PlayerConfigEntry } from "@scout-for-lol/data";
import { getRanks } from "@scout-for-lol/backend/league/model/rank";

export async function getPlayer(playerConfig: PlayerConfigEntry): Promise<Player> {
  console.log(`[debug][getPlayer] Processing player: ${playerConfig.alias}`);
  console.log(`[debug][getPlayer] playerConfig keys:`, Object.keys(playerConfig));
  console.log(`[debug][getPlayer] playerConfig full structure:`, JSON.stringify(playerConfig, null, 2));

  if ("puuid" in playerConfig) {
    console.error(
      `[debug][getPlayer] ⚠️  ERROR: playerConfig has unexpected puuid field at top level!`,
      JSON.stringify(playerConfig, null, 2),
    );
  }

  // Check nested structure
  if ("puuid" in playerConfig.league) {
    console.error(
      `[debug][getPlayer] ⚠️  ERROR: playerConfig.league has unexpected puuid field!`,
      JSON.stringify(playerConfig.league, null, 2),
    );
  }
  console.log(`[debug][getPlayer] leagueAccount keys:`, Object.keys(playerConfig.league.leagueAccount));
  if ("puuid" in playerConfig.league.leagueAccount) {
    console.log(`[debug][getPlayer] ✅ leagueAccount has puuid (expected):`, playerConfig.league.leagueAccount.puuid);
  }

  const player: Player = {
    config: playerConfig,
    ranks: await getRanks(playerConfig),
  };

  console.log(`[debug][getPlayer] Built player object keys:`, Object.keys(player));
  if ("puuid" in player) {
    console.error(
      `[debug][getPlayer] ⚠️  ERROR: player object has unexpected puuid field!`,
      JSON.stringify(player, null, 2),
    );
  }
  console.log(`[debug][getPlayer] player.config keys:`, Object.keys(player.config));
  if ("puuid" in player.config) {
    console.error(
      `[debug][getPlayer] ⚠️  ERROR: player.config has unexpected puuid field!`,
      JSON.stringify(player.config, null, 2),
    );
  }

  // Deep check for puuid anywhere in config
  const configStr = JSON.stringify(player.config);
  if (configStr.includes('"puuid"') && !configStr.includes('"leagueAccount":{"puuid"')) {
    console.error(`[debug][getPlayer] ⚠️  ERROR: Found puuid outside of leagueAccount structure!`, configStr);
  }

  return player;
}
