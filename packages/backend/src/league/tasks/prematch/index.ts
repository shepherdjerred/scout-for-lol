import { CurrentGameInfoDTO } from "twisted/dist/models-dto/index.js";
import * as uuid from "uuid";
import {
  getPlayersNotInGame,
  LoadingScreenPlayer,
  type LoadingScreenState,
  parseQueueType,
  PlayerConfigEntry,
} from "@scout/data";
import { createDiscordMessage } from "./discord.ts";
import { send } from "../../discord/channel.ts";
import { getRanks } from "../../model/rank.ts";
import { getState, setState } from "../../model/state.ts";
import { getCurrentGame } from "../../api/index.ts";
import { filter, groupBy, map, mapValues, pipe, values, zip } from "remeda";
import {
  getAccounts,
  getServersSubscribedToPlayers,
} from "../../../database/index.ts";

export async function checkPreMatch() {
  const players = await getAccounts();

  console.log("filtering out players in game");
  const playersNotInGame = getPlayersNotInGame(players, getState());

  console.log("calling spectator API");
  const playerStatus = await Promise.all(
    map(playersNotInGame, getCurrentGame),
  );

  console.log("filtering players not in game");
  const playersInGame = pipe(
    playersNotInGame,
    zip(playerStatus),
    filter(([_player, game]) => game != undefined),
  ) as [PlayerConfigEntry, CurrentGameInfoDTO][];

  console.log("removing games already seen");
  const newGames = filter(
    playersInGame,
    ([_player, game]) =>
      !pipe(
        getState().gamesStarted,
        map((game) => game.matchId),
        (matchIds) => matchIds.some((candidate) => candidate === game.gameId),
      ),
  );

  const promises = pipe(
    newGames,
    groupBy(([_player, game]) => game.gameId),
    mapValues(async (games) => {
      const players = map(games, ([player, _game]) => player);
      const game = games[0][1];

      const queueType = parseQueueType(game.gameQueueConfigId);

      // record the rank of each player before the game
      const playersWithRank = await Promise.all(
        map(players, async (player): Promise<LoadingScreenPlayer> => {
          const rank = await getRanks(player);
          if (queueType === "solo" || queueType === "flex") {
            return { player, rank: rank[queueType] };
          } else {
            return { player, rank: undefined };
          }
        }),
      );

      console.log("creating new state entries");
      const entry: LoadingScreenState = {
        added: new Date(game.gameStartTime),
        matchId: game.gameId,
        uuid: uuid.v4(),
        players: playersWithRank,
        queue: queueType,
      };

      const message = createDiscordMessage(players, game, queueType);

      // figure out what channels to send the message to
      // server, see if they have a player in the game
      const servers = await getServersSubscribedToPlayers(
        players.map((player) => player.league.leagueAccount.id),
      );

      const promises = servers.map((server) => {
        return send(message, server.channel);
      });
      Promise.all(promises);

      console.log("saving state");
      setState({
        ...getState(),
        gamesStarted: [...getState().gamesStarted, entry],
      });
    }),
  );

  console.log("sending messages");
  await Promise.all(values(promises));
}
