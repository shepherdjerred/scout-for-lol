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
import { filter, groupBy, map, mapValues, pipe, uniqueBy, values, zip } from "remeda";
import { getAccounts, getChannelsSubscribedToPlayers } from "../../../database/index";

export async function checkPreMatch() {
  console.log("=== PRE-MATCH CHECK START ===");
  const startTime = Date.now();

  console.log("🔍 Fetching all player accounts from database");
  const players = await getAccounts();
  console.log(`📊 Found ${players.length.toString()} total players to check`);

  console.log("🎮 Filtering out players already in tracked games");
  const currentState = getState();
  console.log(`📋 Current state has ${currentState.gamesStarted.length.toString()} games in progress`);

  const playersNotInGame = getPlayersNotInGame(players, currentState);
  console.log(`🔍 ${playersNotInGame.length.toString()} players not in tracked games`);

  if (playersNotInGame.length === 0) {
    console.log("⏸️  No players to check, skipping pre-match check");
    return;
  }

  console.log("🌐 Calling Riot spectator API for all players");
  const apiStartTime = Date.now();
  const playerStatus = await Promise.all(map(playersNotInGame, getCurrentGame));
  const apiTime = Date.now() - apiStartTime;
  console.log(`📡 API calls completed in ${apiTime.toString()}ms`);

  console.log("🔍 Filtering players currently in games");
  const playersInGame = pipe(
    playersNotInGame,
    zip(playerStatus),
    filter(
      // eslint-disable-next-line no-restricted-syntax -- Type guard needed for filtering undefined values
      (pair): pair is [PlayerConfigEntry, CurrentGameInfoDTO] => pair[1] != undefined,
    ),
  );

  console.log(`🎯 Found ${playersInGame.length.toString()} players currently in games`);

  if (playersInGame.length === 0) {
    console.log("⏸️  No players currently in games, skipping further processing");
    const totalTime = Date.now() - startTime;
    console.log(`=== PRE-MATCH CHECK COMPLETE (${totalTime.toString()}ms) ===`);
    return;
  }

  console.log("🆕 Checking for new games not already tracked");
  const newGames = filter(playersInGame, ([player, game]) => {
    const isNewGame = !pipe(
      getState().gamesStarted,
      map((trackedGame) => trackedGame.matchId),
      (matchIds) => matchIds.some((candidate) => candidate === game.gameId),
    );

    if (!isNewGame) {
      console.log(`⏭️  Player ${player.alias} is in already tracked game ${game.gameId.toString()}`);
    }

    return isNewGame;
  });

  console.log(`🎉 Found ${newGames.length.toString()} new games to process`);

  if (newGames.length === 0) {
    console.log("⏸️  No new games to process");
    const totalTime = Date.now() - startTime;
    console.log(`=== PRE-MATCH CHECK COMPLETE (${totalTime.toString()}ms) ===`);
    return;
  }

  console.log("🎮 Grouping players by game and processing each game");
  const gameGroups = groupBy(newGames, ([, game]) => game.gameId);
  console.log(`📊 Processing ${Object.keys(gameGroups).length.toString()} unique games`);

  const promises = pipe(
    gameGroups,
    mapValues(async (games) => {
      if (games.length === 0) {
        throw new Error("No games found in group");
      }

      const players = map(games, ([player]) => player);
      const game = games[0][1];
      const gameId = game.gameId.toString();

      console.log(`⚡ Processing game ${gameId} with ${players.length.toString()} players`);
      console.log(`📋 Players in game: ${players.map((p) => p.alias).join(", ")}`);

      console.log(`🎮 Game details: ${JSON.stringify(game)}`);

      const queueType = parseQueueType(game.gameQueueConfigId);
      console.log(`🎯 Queue type: ${queueType ?? "unknown"} (ID: ${game.gameQueueConfigId.toString()})`);

      // record the rank of each player before the game
      console.log(`📊 Fetching ranks for ${players.length.toString()} players`);
      const rankStartTime = Date.now();
      const playersWithRank = await Promise.all(
        map(players, async (player, index): Promise<LoadingScreenPlayer> => {
          console.log(
            `🔍 Fetching rank for player ${(index + 1).toString()}/${players.length.toString()}: ${player.alias}`,
          );
          const rank = await getRanks(player);
          if (queueType === "solo" || queueType === "flex") {
            console.log(`✅ Got ${queueType} rank for ${player.alias}`);
            return { player, rank: rank[queueType] };
          } else {
            console.log(`⚠️  No rank data needed for queue type ${queueType ?? "unknown"}`);
            return { player, rank: undefined };
          }
        }),
      );
      const rankTime = Date.now() - rankStartTime;
      console.log(`📊 Rank fetching completed in ${rankTime.toString()}ms`);

      console.log(`💾 Creating new state entry for game ${gameId}`);
      const entry: LoadingScreenState = {
        added: new Date(game.gameStartTime),
        matchId: game.gameId,
        uuid: uuid.v4(),
        players: playersWithRank,
        queue: queueType,
      };
      console.log(`🔑 Generated UUID: ${entry.uuid} for game ${gameId}`);

      console.log(`📝 Creating Discord message for game ${gameId}`);
      const message = createDiscordMessage(players, game, queueType);
      console.log(`📨 Message created: "${message}"`);

      // figure out what channels to send the message to
      console.log(`🔍 Finding subscribed channels for game ${gameId}`);
      const puuids = players.map((player) => player.league.leagueAccount.puuid);
      console.log(`📋 Looking up subscriptions for ${puuids.length.toString()} PUUIDs`);

      const servers = await getChannelsSubscribedToPlayers(puuids);
      console.log(`📺 Found ${servers.length.toString()} subscribed channels`);

      // Deduplicate by channel (string ID) using Remeda uniqueBy
      const uniqueChannels = uniqueBy(servers, (server) => server.channel);
      console.log(`📺 After deduplication: ${uniqueChannels.length.toString()} unique channels`);

      if (uniqueChannels.length === 0) {
        console.log(`⚠️  No channels to send message to for game ${gameId}`);
      } else {
        console.log(`📤 Sending messages to ${uniqueChannels.length.toString()} channels for game ${gameId}`);
        const promises = uniqueChannels.map((server) => {
          console.log(`📤 Sending to channel: ${server.channel}`);
          return send(message, server.channel);
        });
        void Promise.all(promises);
      }

      console.log(`💾 Saving state for game ${gameId}`);
      const currentState = getState();
      setState({
        ...currentState,
        gamesStarted: [...currentState.gamesStarted, entry],
      });
      console.log(`✅ Game ${gameId} added to state tracking`);
    }),
  );

  console.log("⏳ Waiting for all game processing to complete");
  await Promise.all(values(promises));

  const totalTime = Date.now() - startTime;
  console.log(`✅ Successfully processed ${Object.keys(gameGroups).length.toString()} new games`);
  console.log(`=== PRE-MATCH CHECK COMPLETE (${totalTime.toString()}ms) ===`);
}
