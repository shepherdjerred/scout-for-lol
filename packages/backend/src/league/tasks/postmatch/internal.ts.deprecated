import { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { z } from "zod";
import { api } from "../../api/api.ts";
import { AttachmentBuilder, EmbedBuilder, Message, MessageCreateOptions, MessagePayload } from "discord.js";
import { matchToSvg, arenaMatchToSvg, svgToPng } from "@scout-for-lol/report";
import {
  ApplicationState,
  CompletedMatch,
  type DiscordChannelId,
  getLaneOpponent,
  invertTeam,
  type LeaguePuuid,
  LoadingScreenState,
  parseQueueType,
  parseTeam,
  Player,
  PlayerConfigEntry,
  type Rank,
  type ArenaMatch,
} from "@scout-for-lol/data";
import { getState, setState } from "../../model/state.ts";
import { differenceWith, filter, map, pipe } from "remeda";
import { getOutcome } from "../../model/match.ts";
import { regionToRegionGroup } from "twisted/dist/constants/regions.js";
import { mapRegionToEnum } from "../../model/region.ts";
import { participantToChampion } from "../../model/champion.ts";
import { toArenaMatch } from "../../model/match.ts";
import { saveMatchToS3, saveImageToS3, saveSvgToS3 } from "../../../storage/s3.ts";
import { generateMatchReview } from "../../review/generator.ts";

export async function checkMatch(game: LoadingScreenState) {
  console.log(`[checkMatch] Starting match check for matchId: ${game.matchId.toString()}`);

  try {
    const firstPlayer = game.players[0];
    if (!firstPlayer) {
      throw new Error("No players found in game");
    }

    const region = mapRegionToEnum(firstPlayer.player.league.leagueAccount.region);
    const regionGroup = regionToRegionGroup(region);
    const matchIdForApi = `${region}_${game.matchId.toString()}`;

    const response = await api.MatchV5.get(matchIdForApi, regionGroup);

    return response.response;
  } catch (e) {
    const result = z.object({ status: z.number() }).safeParse(e);
    if (result.success) {
      if (result.data.status === 404) {
        return undefined;
      }
      if (result.data.status === 403) {
        console.error(`[checkMatch] 403 Forbidden for match ${game.matchId.toString()}, removing from queue`);
        const currentState = getState();
        const newGamesStarted = currentState.gamesStarted.filter((g) => g.matchId !== game.matchId);
        setState({
          ...currentState,
          gamesStarted: newGamesStarted,
        });
        return undefined;
      }
    }
    console.error(`[checkMatch] Error for match ${game.matchId.toString()}:`, e);
    return undefined;
  }
}

export async function saveMatch(match: MatchV5DTOs.MatchDto): Promise<void> {
  try {
    await saveMatchToS3(match);
  } catch (error) {
    console.error(`[saveMatch] Error saving match ${match.metadata.matchId}:`, error);
    // Don't throw - continue processing even if S3 storage fails
  }
}

async function getImage(
  match: CompletedMatch | ArenaMatch,
  matchId: string,
): Promise<[AttachmentBuilder, EmbedBuilder]> {
  const isArena = match.queueType === "arena";
  const svg = isArena ? await arenaMatchToSvg(match) : await matchToSvg(match);
  const image = svgToPng(svg);

  // Save both PNG and SVG to S3
  try {
    const queueTypeForStorage = isArena ? "arena" : (match.queueType ?? "unknown");
    await saveImageToS3(matchId, image, queueTypeForStorage);
    await saveSvgToS3(matchId, svg, queueTypeForStorage);
  } catch (error) {
    console.error(`[getImage] Failed to save images to S3:`, error);
  }

  const attachment = new AttachmentBuilder(image).setName("match.png");
  if (!attachment.name) {
    throw new Error("[getImage] Attachment name is null");
  }

  const embed = {
    image: {
      url: `attachment://${attachment.name}`,
    },
  };

  return [attachment, new EmbedBuilder(embed)];
}

async function createMatchObj(
  state: LoadingScreenState,
  match: MatchV5DTOs.MatchDto,
  getPlayerFn: (playerConfig: PlayerConfigEntry) => Promise<Player>,
) {
  console.log(`[createMatchObj] 🏗️  Starting match object creation for matchId: ${match.metadata.matchId}`);
  console.log(`[createMatchObj] 📊 State details:`, {
    playersCount: state.players.length,
    queue: state.queue,
    matchId: state.matchId.toString(),
    uuid: state.uuid,
  });

  // Get teams using backend/model/match.ts helpers
  const getTeams = (participants: MatchV5DTOs.ParticipantDto[]) => {
    console.log(`[createMatchObj] 👥 Processing ${participants.length.toString()} participants into teams`);
    const teams = {
      blue: pipe(participants.slice(0, 5), map(participantToChampion)),
      red: pipe(participants.slice(5, 10), map(participantToChampion)),
    };
    console.log(`[createMatchObj] 🔵 Blue team: ${teams.blue.length.toString()} players`);
    console.log(`[createMatchObj] 🔴 Red team: ${teams.red.length.toString()} players`);
    return teams;
  };

  const queueType = parseQueueType(match.info.queueId);
  if (queueType === "arena") {
    // Build ArenaMatch and short-circuit traditional flow
    // Process ALL tracked players in this arena match
    console.log(
      `[createMatchObj] 🎯 ARENA: state has ${state.players.length.toString()} tracked player(s): ${state.players.map((p) => p.player.alias).join(", ")}`,
    );

    if (state.players.length === 0) {
      throw new Error("No players found in game state for arena match");
    }
    const players = await Promise.all(state.players.map((playerState) => getPlayerFn(playerState.player)));
    const arena = await toArenaMatch(players, match);

    console.log(
      `[createMatchObj] ✅ ARENA: created match with ${arena.players.length.toString()} player(s): ${arena.players.map((p) => p.champion.riotIdGameName).join(", ")}`,
    );

    return arena;
  }
  const teams = getTeams(match.info.participants);
  console.log(
    `[createMatchObj] 🎯 Queue type: ${queueType ?? "unknown"} (ID: ${match.info.queueId.toString()}), participants: ${match.info.participants.length.toString()}`,
  );

  // Gather all relevant players
  console.log(`[createMatchObj] 👥 Processing ${state.players.length.toString()} players from loading screen`);
  const players = await Promise.all(
    state.players.map(async (playerState, index) => {
      console.log(
        `[createMatchObj] 🔍 Processing player ${(index + 1).toString()}/${state.players.length.toString()}: ${playerState.player.alias}`,
      );
      console.log(`[createMatchObj] 📋 Player details:`, {
        alias: playerState.player.alias,
        puuid: playerState.player.league.leagueAccount.puuid,
        region: playerState.player.league.leagueAccount.region,
        queue: state.queue,
      });

      // Find the participant in the match by puuid
      const participant = match.info.participants.find(
        (p) => p.puuid === playerState.player.league.leagueAccount.puuid,
      );
      if (!participant) {
        console.error(
          `[createMatchObj] ❌ Unable to find participant for player ${playerState.player.alias}:`,
          playerState.player,
        );
        console.error(
          `[createMatchObj] 📋 Available participants:`,
          match.info.participants.map((p) => ({
            puuid: p.puuid,
            riotId: p.riotIdName,
          })),
        );
        throw new Error(
          `unable to find participant for player ${JSON.stringify(playerState)}, match: ${JSON.stringify(match)}`,
        );
      }

      console.log(
        `[createMatchObj] ✅ Found participant for player ${(index + 1).toString()}: ${participant.riotIdName ?? "unknown"} (Champion: ${participant.championId.toString()})`,
      );
      console.log(`[createMatchObj] 📊 Participant stats:`, {
        championId: participant.championId,
        teamId: participant.teamId,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        win: participant.win,
      });

      const fullPlayer = await getPlayerFn(playerState.player);
      console.log(
        `[createMatchObj] ✅ Retrieved full player data for player ${(index + 1).toString()}: ${playerState.player.alias}`,
      );

      let rankBeforeMatch: Rank | undefined = undefined;
      let rankAfterMatch: Rank | undefined = undefined;
      if (state.queue === "solo" || state.queue === "flex") {
        rankBeforeMatch = playerState.rank;
        rankAfterMatch = fullPlayer.ranks[state.queue];
        console.log(`[createMatchObj] 📊 Rank data for player ${(index + 1).toString()}:`, {
          before: rankBeforeMatch?.tier,
          after: rankAfterMatch?.tier,
        });
      }

      const champion = participantToChampion(participant);
      console.log(`[createMatchObj] 🏆 Champion info:`, {
        championName: champion.championName,
        lane: champion.lane,
      });

      const team = parseTeam(participant.teamId);
      if (!team) {
        console.error(`[createMatchObj] ❌ Could not determine team for participant:`, participant);
        throw new Error(`Could not determine team for participant: ${JSON.stringify(participant)}`);
      }
      const enemyTeam = invertTeam(team);
      console.log(`[createMatchObj] ⚔️  Player team: ${team}, enemy team: ${enemyTeam}`);

      const outcome = getOutcome(participant);
      console.log(`[createMatchObj] 🎯 Match outcome for ${playerState.player.alias}: ${outcome}`);

      const laneOpponent = getLaneOpponent(champion, teams[enemyTeam]);
      console.log(`[createMatchObj] 🥊 Lane opponent for ${playerState.player.alias}:`, laneOpponent);

      console.log(`[createMatchObj] ✅ Player ${(index + 1).toString()} processed:`, {
        champion: champion.championName,
        team: team,
        outcome: outcome,
      });

      return {
        playerConfig: fullPlayer.config,
        rankBeforeMatch,
        rankAfterMatch,
        wins:
          state.queue === "solo" || state.queue === "flex"
            ? (fullPlayer.ranks[state.queue]?.wins ?? undefined)
            : undefined,
        losses:
          state.queue === "solo" || state.queue === "flex"
            ? (fullPlayer.ranks[state.queue]?.losses ?? undefined)
            : undefined,
        champion,
        outcome: outcome,
        team: team,
        lane: champion.lane,
        laneOpponent: laneOpponent,
      };
    }),
  );

  console.log(`[createMatchObj] ✅ Match object created successfully for matchId: ${match.metadata.matchId}`);
  console.log(`[createMatchObj] 📊 Final match object:`, {
    queueType: queueType,
    playersCount: players.length,
    durationInSeconds: match.info.gameDuration,
    teamsBlue: teams.blue.length,
    teamsRed: teams.red.length,
  });

  return {
    queueType,
    players,
    durationInSeconds: match.info.gameDuration,
    teams,
  };
}

export async function checkPostMatchInternal(
  state: ApplicationState,
  saveFn: (match: MatchV5DTOs.MatchDto) => Promise<void>,
  checkFn: (game: LoadingScreenState) => Promise<MatchV5DTOs.MatchDto | undefined>,
  sendFn: (message: string | MessagePayload | MessageCreateOptions, channelId: string) => Promise<Message>,
  getPlayerFn: (playerConfig: PlayerConfigEntry) => Promise<Player>,
  getSubscriptionsFn: (playerIds: LeaguePuuid[]) => Promise<{ channel: DiscordChannelId }[]>,
) {
  console.log("=== POST-MATCH CHECK START ===");
  console.log(`[checkPostMatchInternal] Found ${state.gamesStarted.length.toString()} games in progress`);

  if (state.gamesStarted.length === 0) {
    console.log("[checkPostMatchInternal] No games to check, skipping post-match processing");
    return;
  }

  // Log details about each game being checked
  state.gamesStarted.forEach((game, index) => {
    console.log(
      `[checkPostMatchInternal] Game ${(index + 1).toString()}: matchId=${game.matchId.toString()}, players=${game.players.length.toString()}, added=${game.added.toISOString()}`,
    );
  });

  console.log("[checkPostMatchInternal] Checking match API for all games");
  const games = await Promise.all(state.gamesStarted.map(checkFn));

  console.log(`[checkPostMatchInternal] API check results: ${games.length.toString()} responses`);
  games.forEach((game, index) => {
    if (game) {
      console.log(`[checkPostMatchInternal] Game ${(index + 1).toString()}: FINISHED - ${game.metadata.matchId}`);
    } else {
      console.log(`[checkPostMatchInternal] Game ${(index + 1).toString()}: STILL IN PROGRESS or ERROR`);
    }
  });

  console.log("[checkPostMatchInternal] Filtering finished games");
  // Helper to filter out tuples with undefined match data - allows TypeScript to narrow the type
  // Type predicate needed: TypeScript can't narrow tuple types through filter() without explicit type guard
  const isFinishedGame = (
    tuple: [LoadingScreenState, MatchV5DTOs.MatchDto | undefined],
    // eslint-disable-next-line no-restricted-syntax -- Type predicate necessary for tuple narrowing
  ): tuple is [LoadingScreenState, MatchV5DTOs.MatchDto] => {
    return tuple[1] !== undefined;
  };

  const finishedGames = pipe(
    state.gamesStarted,
    map((game) => {
      const firstPlayer = game.players[0];
      if (!firstPlayer) {
        throw new Error("No players found in game");
      }
      const region = mapRegionToEnum(firstPlayer.player.league.leagueAccount.region);
      const fullMatchId = `${region}_${game.matchId.toString()}`;
      return [game, games.find((g) => g?.metadata.matchId === fullMatchId)] satisfies [
        LoadingScreenState,
        MatchV5DTOs.MatchDto | undefined,
      ];
    }),
    filter(isFinishedGame),
  );

  console.log(`[checkPostMatchInternal] Found ${finishedGames.length.toString()} finished games to process`);

  if (finishedGames.length === 0) {
    console.log("[checkPostMatchInternal] No finished games to process, ending post-match check");
    return;
  }

  // TODO: send duo queue message
  console.log("[checkPostMatchInternal] Processing finished games and sending messages");
  await Promise.all(
    map(finishedGames, async ([state, matchDto]) => {
      console.log(`[checkPostMatchInternal] Processing finished game: ${matchDto.metadata.matchId}`);

      try {
        console.log(`[checkPostMatchInternal] Saving match: ${matchDto.metadata.matchId}`);
        await saveFn(matchDto);
        console.log(`[checkPostMatchInternal] Successfully saved match: ${matchDto.metadata.matchId}`);

        console.log(`[checkPostMatchInternal] Creating match object for: ${matchDto.metadata.matchId}`);
        const matchObj = await createMatchObj(state, matchDto, getPlayerFn);
        console.log(`[checkPostMatchInternal] Successfully created match object for: ${matchDto.metadata.matchId}`);

        console.log(`[checkPostMatchInternal] Generating image for: ${matchDto.metadata.matchId}`);
        const [attachment, embed] = await getImage(matchObj, matchDto.metadata.matchId);
        console.log(`[checkPostMatchInternal] Successfully generated image for: ${matchDto.metadata.matchId}`);

        console.log(`[checkPostMatchInternal] Generating review for: ${matchDto.metadata.matchId}`);
        const review = generateMatchReview(matchObj);
        console.log(`[checkPostMatchInternal] Successfully generated review for: ${matchDto.metadata.matchId}`);

        // figure out what channels to send the message to
        // server, see if they have a player in the game
        console.log(`[checkPostMatchInternal] Getting subscriptions for match: ${matchDto.metadata.matchId}`);
        const firstPlayer = state.players[0];
        if (!firstPlayer) {
          throw new Error("No players found in game");
        }
        const servers = await getSubscriptionsFn([firstPlayer.player.league.leagueAccount.puuid]);
        console.log(
          `[checkPostMatchInternal] Found ${servers.length.toString()} subscribed channels for match: ${matchDto.metadata.matchId}`,
        );

        if (servers.length === 0) {
          console.log(
            `[checkPostMatchInternal] No subscribed channels found for match: ${matchDto.metadata.matchId}, skipping message sending`,
          );
        } else {
          console.log(
            `[checkPostMatchInternal] Sending messages to ${servers.length.toString()} channels for match: ${matchDto.metadata.matchId}`,
          );
          const promises = servers.map((server) => {
            console.log(
              `[checkPostMatchInternal] Sending message to channel: ${server.channel} for match: ${matchDto.metadata.matchId}`,
            );
            return sendFn({ content: review, embeds: [embed], files: [attachment] }, server.channel);
          });
          await Promise.all(promises);
          console.log(
            `[checkPostMatchInternal] Successfully sent messages to all channels for match: ${matchDto.metadata.matchId}`,
          );
        }

        console.log(
          `[checkPostMatchInternal] Calculating new state after processing match: ${matchDto.metadata.matchId}`,
        );
        const newState = getState();
        const newMatches = differenceWith(
          newState.gamesStarted,
          map(finishedGames, (game) => game[0]),
          (left, right) => left.uuid === right.uuid,
        );

        console.log(
          `[checkPostMatchInternal] Saving updated state after processing match: ${matchDto.metadata.matchId}`,
        );
        setState({
          ...newState,
          gamesStarted: newMatches,
        });
        console.log(
          `[checkPostMatchInternal] Successfully updated state, removed ${finishedGames.length.toString()} finished games`,
        );
      } catch (error) {
        console.error(`[checkPostMatchInternal] Error processing match ${matchDto.metadata.matchId}:`, error);
        throw error; // Re-throw so it gets caught by logErrors
      }
    }),
  );

  console.log("=== POST-MATCH CHECK COMPLETE ===");
}
