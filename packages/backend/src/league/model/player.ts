import { Player } from "@scout-for-lol/data";
import { PlayerConfigEntry } from "@scout-for-lol/data";
import { getRanks } from "./rank";

export async function getPlayer(playerConfig: PlayerConfigEntry): Promise<Player> {
  return {
    config: playerConfig,
    ranks: await getRanks(playerConfig),
  };
}
