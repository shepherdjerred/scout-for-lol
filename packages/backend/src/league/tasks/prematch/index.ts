import { CurrentGameInfoDTO } from "twisted/dist/models-dto/index.js";
import * as uuid from "uuid";
import {
  getPlayersNotInGame,
  LoadingScreenPlayer,
  type LoadingScreenState,
  parseQueueType,
  type PlayerConfigEntry,
} from "@scout-for-lol/data";
import { createDiscordMessage } from "./discord";
import { send } from "../../discord/channel";
import { getRanks } from "../../model/rank";
import { getState, setState } from "../../model/state";
import { getCurrentGame } from "../../api/index";
import {
  filter,
  groupBy,
  map,
  mapValues,
  pipe,
  uniqueBy,
  values,
  zip,
} from "remeda";
import {
  getAccounts,
  getChannelsSubscribedToPlayers,
} from "../../../database/index";

export async function checkPreMatch() {
  const players = await getAccounts();

  console.log("filtering out players in game");
  const playersNotInGame = getPlayersNotInGame(players, getState());

  console.log("calling spectator API");
  const playerStatus = await Promise.all(map(playersNotInGame, getCurrentGame));

  console.log("filtering players not in game");
  const playersInGame = pipe(
    playersNotInGame,
    zip(playerStatus),
    filter(
      (pair): pair is [PlayerConfigEntry, CurrentGameInfoDTO] =>
        pair[1] != undefined,
    ),
  );

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
      if (games.length === 0) {
        throw new Error("No games found in group");
      }
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
      const servers = await getChannelsSubscribedToPlayers(
        players.map((player) => player.league.leagueAccount.summonerId),
      );
      // Deduplicate by channel (string ID) using Remeda uniqueBy
      const uniqueChannels = uniqueBy(servers, (server) => server.channel);

      const promises = uniqueChannels.map((server) => {
        return send(message, server.channel);
      });
      void Promise.all(promises);

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
