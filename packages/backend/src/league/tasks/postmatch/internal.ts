import { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { z } from "zod";
import { api } from "../../api/api.ts";
import {
  AttachmentBuilder,
  EmbedBuilder,
  Message,
  MessageCreateOptions,
  MessagePayload,
} from "discord.js";
import { matchToImage } from "@scout-for-lol/report";
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
} from "@scout-for-lol/data";
import { getState, setState } from "../../model/state.ts";
import { differenceWith, filter, map, pipe } from "remeda";
import { getOutcome } from "../../model/match.ts";
import { regionToRegionGroup } from "twisted/dist/constants/regions.js";
import { mapRegionToEnum } from "../../model/region.ts";
import { participantToChampion } from "../../model/champion.ts";
import { saveMatchToS3 } from "../../../storage/s3.ts";

export async function checkMatch(game: LoadingScreenState) {
  console.log(
    `[checkMatch] 🔍 Starting match check for matchId: ${game.matchId.toString()}`
  );
  console.log(`[checkMatch] 📊 Game details:`, {
    matchId: game.matchId.toString(),
    playersCount: game.players.length,
    queue: game.queue,
    added: game.added.toISOString(),
    uuid: game.uuid,
  });

  try {
    const firstPlayer = game.players[0];
    if (!firstPlayer) {
      throw new Error("No players found in game");
    }

    const region = mapRegionToEnum(
      firstPlayer.player.league.leagueAccount.region
    );
    console.log(`[checkMatch] 🌍 Mapped region: ${region}`);

    const regionGroup = regionToRegionGroup(region);
    console.log(`[checkMatch] 🌐 Region group: ${regionGroup}`);

    const matchIdForApi = `${region}_${game.matchId.toString()}`;
    console.log(`[checkMatch] 🔗 Calling API with matchId: ${matchIdForApi}`);

    const apiStartTime = Date.now();
    const response = await api.MatchV5.get(matchIdForApi, regionGroup);
    const apiTime = Date.now() - apiStartTime;

    console.log(
      `[checkMatch] ✅ API response received for match: ${game.matchId.toString()} in ${apiTime.toString()}ms`
    );
    console.log(
      `[checkMatch] 📊 Match status: ${response.response.info.gameEndTimestamp ? "FINISHED" : "IN_PROGRESS"}`
    );

    if (response.response.info.gameEndTimestamp) {
      console.log(
        `[checkMatch] 🏁 Match finished at: ${new Date(response.response.info.gameEndTimestamp).toISOString()}`
      );
      console.log(
        `[checkMatch] ⏱️  Game duration: ${response.response.info.gameDuration.toString()}s`
      );
    }

    return response.response;
  } catch (e) {
    console.error(
      `[checkMatch] ❌ Error occurred for match ${game.matchId.toString()}:`,
      e
    );
    const result = z.object({ status: z.number() }).safeParse(e);
    if (result.success) {
      console.log(
        `[checkMatch] 🔢 HTTP status code: ${result.data.status.toString()}`
      );
      if (result.data.status === 404) {
        // game not done
        console.log(
          `[checkMatch] ⏳ Match ${game.matchId.toString()} not finished yet (404)`
        );
        return undefined;
      }
      if (result.data.status === 403) {
        // Not recoverable: log and remove from queue
        console.error(
          `[checkMatch] 🚫 403 Forbidden for match ${game.matchId.toString()}, removing from queue`
        );
        const currentState = getState();
        const newGamesStarted = currentState.gamesStarted.filter(
          (g) => g.matchId !== game.matchId
        );
        setState({
          ...currentState,
          gamesStarted: newGamesStarted,
        });
        console.log(
          `[checkMatch] 🗑️  Removed match ${game.matchId.toString()} from tracking`
        );
        return undefined;
      }
    }
    console.error(
      `[checkMatch] 💥 Unhandled error for match ${game.matchId.toString()}:`,
      e
    );
    return undefined;
  }
}

export async function saveMatch(match: MatchV5DTOs.MatchDto): Promise<void> {
  console.log(`[saveMatch] 💾 Saving match: ${match.metadata.matchId}`);
  console.log(`[saveMatch] 📊 Match details:`, {
    matchId: match.metadata.matchId,
    participants: match.info.participants.length,
    gameMode: match.info.gameMode,
    queueId: match.info.queueId,
    gameEndTimestamp: match.info.gameEndTimestamp,
    gameDuration: match.info.gameDuration,
  });

  try {
    // Save the match to S3
    await saveMatchToS3(match);

    console.log(`[saveMatch] ✅ Successfully saved match: ${match.metadata.matchId}`);
  } catch (error) {
    console.error(`[saveMatch] ❌ Error saving match ${match.metadata.matchId}:`, error);

    // Don't throw the error to prevent disrupting the entire post-match flow
    // The match processing should continue even if S3 storage fails
    console.warn(`[saveMatch] ⚠️  Continuing post-match processing despite storage failure`);
  }
}

async function getImage(
  match: CompletedMatch
): Promise<[AttachmentBuilder, EmbedBuilder]> {
  console.log(`[getImage] 🖼️  Starting image generation for match`);
  console.log(`[getImage] 📊 Match details:`, {
    queueType: match.queueType,
    playersCount: match.players.length,
    durationInSeconds: match.durationInSeconds,
    teamsBlue: match.teams.blue.length,
    teamsRed: match.teams.red.length,
  });

  try {
    const imageStartTime = Date.now();
    const image = await matchToImage(match);
    const imageTime = Date.now() - imageStartTime;

    console.log(
      `[getImage] ✅ Image generated successfully in ${imageTime.toString()}ms, size: ${image.length.toString()} bytes`
    );

    const attachment = new AttachmentBuilder(image).setName("match.png");
    if (!attachment.name) {
      console.error(`[getImage] ❌ Attachment name is null`);
      throw new Error("[getImage] Attachment name is null");
    }
    console.log(
      `[getImage] 📎 Attachment created with name: ${attachment.name}`
    );

    const embed = {
      image: {
        url: `attachment://${attachment.name}`,
      },
    };
    console.log(`[getImage] 🎨 Embed created successfully`);

    return [attachment, new EmbedBuilder(embed)];
  } catch (error) {
    console.error(`[getImage] 💥 Error generating image:`, error);
    throw error;
  }
}

async function createMatchObj(
  state: LoadingScreenState,
  match: MatchV5DTOs.MatchDto,
  getPlayerFn: (playerConfig: PlayerConfigEntry) => Promise<Player>
) {
  console.log(
    `[createMatchObj] 🏗️  Starting match object creation for matchId: ${match.metadata.matchId}`
  );
  console.log(`[createMatchObj] 📊 State details:`, {
    playersCount: state.players.length,
    queue: state.queue,
    matchId: state.matchId.toString(),
    uuid: state.uuid,
  });

  // Get teams using backend/model/match.ts helpers
  const getTeams = (participants: MatchV5DTOs.ParticipantDto[]) => {
    console.log(
      `[createMatchObj] 👥 Processing ${participants.length.toString()} participants into teams`
    );
    const teams = {
      blue: pipe(participants.slice(0, 5), map(participantToChampion)),
      red: pipe(participants.slice(5, 10), map(participantToChampion)),
    };
    console.log(
      `[createMatchObj] 🔵 Blue team: ${teams.blue.length.toString()} players`
    );
    console.log(
      `[createMatchObj] 🔴 Red team: ${teams.red.length.toString()} players`
    );
    return teams;
  };

  const teams = getTeams(match.info.participants);
  const queueType = parseQueueType(match.info.queueId);
  console.log(
    `[createMatchObj] 🎯 Queue type: ${queueType ?? "unknown"} (ID: ${match.info.queueId.toString()}), participants: ${match.info.participants.length.toString()}`
  );

  // Gather all relevant players
  console.log(
    `[createMatchObj] 👥 Processing ${state.players.length.toString()} players from loading screen`
  );
  const players = await Promise.all(
    state.players.map(async (playerState, index) => {
      console.log(
        `[createMatchObj] 🔍 Processing player ${(index + 1).toString()}/${state.players.length.toString()}: ${playerState.player.alias}`
      );
      console.log(`[createMatchObj] 📋 Player details:`, {
        alias: playerState.player.alias,
        puuid: playerState.player.league.leagueAccount.puuid,
        region: playerState.player.league.leagueAccount.region,
        queue: state.queue,
      });

      // Find the participant in the match by puuid
      const participant = match.info.participants.find(
        (p) => p.puuid === playerState.player.league.leagueAccount.puuid
      );
      if (!participant) {
        console.error(
          `[createMatchObj] ❌ Unable to find participant for player ${playerState.player.alias}:`,
          playerState.player
        );
        console.error(
          `[createMatchObj] 📋 Available participants:`,
          match.info.participants.map((p) => ({
            puuid: p.puuid,
            summonerName: p.summonerName,
          }))
        );
        throw new Error(
          `unable to find participant for player ${JSON.stringify(playerState)}, match: ${JSON.stringify(match)}`
        );
      }

      console.log(
        `[createMatchObj] ✅ Found participant for player ${(index + 1).toString()}: ${participant.summonerName} (Champion: ${participant.championId.toString()})`
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
        `[createMatchObj] ✅ Retrieved full player data for player ${(index + 1).toString()}: ${playerState.player.alias}`
      );

      let rankBeforeMatch: Rank | undefined = undefined;
      let rankAfterMatch: Rank | undefined = undefined;
      if (state.queue === "solo" || state.queue === "flex") {
        rankBeforeMatch = playerState.rank;
        rankAfterMatch = fullPlayer.ranks[state.queue];
        console.log(
          `[createMatchObj] 📊 Rank data for player ${(index + 1).toString()}:`,
          {
            before: rankBeforeMatch?.tier,
            after: rankAfterMatch?.tier,
          }
        );
      }

      const champion = participantToChampion(participant);
      console.log(`[createMatchObj] 🏆 Champion info:`, {
        championName: champion.championName,
        lane: champion.lane,
      });

      const team = parseTeam(participant.teamId);
      if (!team) {
        console.error(
          `[createMatchObj] ❌ Could not determine team for participant:`,
          participant
        );
        throw new Error(
          `Could not determine team for participant: ${JSON.stringify(participant)}`
        );
      }
      const enemyTeam = invertTeam(team);
      console.log(
        `[createMatchObj] ⚔️  Player team: ${team}, enemy team: ${enemyTeam}`
      );

      const outcome = getOutcome(participant);
      console.log(
        `[createMatchObj] 🎯 Match outcome for ${playerState.player.alias}: ${outcome}`
      );

      const laneOpponent = getLaneOpponent(champion, teams[enemyTeam]);
      console.log(
        `[createMatchObj] 🥊 Lane opponent for ${playerState.player.alias}:`,
        laneOpponent
      );

      console.log(
        `[createMatchObj] ✅ Player ${(index + 1).toString()} processed:`,
        {
          champion: champion.championName,
          team: team,
          outcome: outcome,
        }
      );

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
    })
  );

  console.log(
    `[createMatchObj] ✅ Match object created successfully for matchId: ${match.metadata.matchId}`
  );
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
  checkFn: (
    game: LoadingScreenState
  ) => Promise<MatchV5DTOs.MatchDto | undefined>,
  sendFn: (
    message: string | MessagePayload | MessageCreateOptions,
    channelId: string
  ) => Promise<Message<true> | Message<false>>,
  getPlayerFn: (playerConfig: PlayerConfigEntry) => Promise<Player>,
  getSubscriptionsFn: (
    playerIds: LeaguePuuid[]
  ) => Promise<{ channel: DiscordChannelId }[]>
) {
  console.log("=== POST-MATCH CHECK START ===");
  console.log(
    `[checkPostMatchInternal] Found ${state.gamesStarted.length.toString()} games in progress`
  );

  if (state.gamesStarted.length === 0) {
    console.log(
      "[checkPostMatchInternal] No games to check, skipping post-match processing"
    );
    return;
  }

  // Log details about each game being checked
  state.gamesStarted.forEach((game, index) => {
    console.log(
      `[checkPostMatchInternal] Game ${(index + 1).toString()}: matchId=${game.matchId.toString()}, players=${game.players.length.toString()}, added=${game.added.toISOString()}`
    );
  });

  console.log("[checkPostMatchInternal] Checking match API for all games");
  const games = await Promise.all(state.gamesStarted.map(checkFn));

  console.log(
    `[checkPostMatchInternal] API check results: ${games.length.toString()} responses`
  );
  games.forEach((game, index) => {
    if (game) {
      console.log(
        `[checkPostMatchInternal] Game ${(index + 1).toString()}: FINISHED - ${game.metadata.matchId.toString()}`
      );
    } else {
      console.log(
        `[checkPostMatchInternal] Game ${(index + 1).toString()}: STILL IN PROGRESS or ERROR`
      );
    }
  });

  console.log("[checkPostMatchInternal] Filtering finished games");
  const finishedGames = pipe(
    state.gamesStarted,
    map((game) => {
      const firstPlayer = game.players[0];
      if (!firstPlayer) {
        throw new Error("No players found in game");
      }
      const region = mapRegionToEnum(
        firstPlayer.player.league.leagueAccount.region
      );
      const fullMatchId = `${region}_${game.matchId.toString()}`;
      return [
        game,
        games.find((g) => g?.metadata.matchId === fullMatchId),
      ] satisfies [LoadingScreenState, MatchV5DTOs.MatchDto | undefined];
    }),
    filter(([_game, match]) => match != undefined)
    // this case is required to get rid of the undefined type
  ) as unknown as [LoadingScreenState, MatchV5DTOs.MatchDto][];

  console.log(
    `[checkPostMatchInternal] Found ${finishedGames.length.toString()} finished games to process`
  );

  if (finishedGames.length === 0) {
    console.log(
      "[checkPostMatchInternal] No finished games to process, ending post-match check"
    );
    return;
  }

  // TODO: send duo queue message
  console.log(
    "[checkPostMatchInternal] Processing finished games and sending messages"
  );
  await Promise.all(
    map(finishedGames, async ([state, matchDto]) => {
      console.log(
        `[checkPostMatchInternal] Processing finished game: ${matchDto.metadata.matchId.toString()}`
      );

      try {
        console.log(
          `[checkPostMatchInternal] Saving match: ${matchDto.metadata.matchId}`
        );
        await saveFn(matchDto);
        console.log(
          `[checkPostMatchInternal] Successfully saved match: ${matchDto.metadata.matchId}`
        );

        console.log(
          `[checkPostMatchInternal] Creating match object for: ${matchDto.metadata.matchId}`
        );
        const matchObj = await createMatchObj(state, matchDto, getPlayerFn);
        console.log(
          `[checkPostMatchInternal] Successfully created match object for: ${matchDto.metadata.matchId}`
        );

        console.log(
          `[checkPostMatchInternal] Generating image for: ${matchDto.metadata.matchId}`
        );
        const [attachment, embed] = await getImage(matchObj);
        console.log(
          `[checkPostMatchInternal] Successfully generated image for: ${matchDto.metadata.matchId}`
        );

        // figure out what channels to send the message to
        // server, see if they have a player in the game
        console.log(
          `[checkPostMatchInternal] Getting subscriptions for match: ${matchDto.metadata.matchId}`
        );
        const firstPlayer = state.players[0];
        if (!firstPlayer) {
          throw new Error("No players found in game");
        }
        const servers = await getSubscriptionsFn([
          firstPlayer.player.league.leagueAccount.puuid,
        ]);
        console.log(
          `[checkPostMatchInternal] Found ${servers.length.toString()} subscribed channels for match: ${matchDto.metadata.matchId.toString()}`
        );

        if (servers.length === 0) {
          console.log(
            `[checkPostMatchInternal] No subscribed channels found for match: ${matchDto.metadata.matchId}, skipping message sending`
          );
        } else {
          console.log(
            `[checkPostMatchInternal] Sending messages to ${servers.length.toString()} channels for match: ${matchDto.metadata.matchId}`
          );
          const promises = servers.map((server) => {
            console.log(
              `[checkPostMatchInternal] Sending message to channel: ${server.channel} for match: ${matchDto.metadata.matchId}`
            );
            return sendFn(
              { embeds: [embed], files: [attachment] },
              server.channel
            );
          });
          await Promise.all(promises);
          console.log(
            `[checkPostMatchInternal] Successfully sent messages to all channels for match: ${matchDto.metadata.matchId}`
          );
        }

        console.log(
          `[checkPostMatchInternal] Calculating new state after processing match: ${matchDto.metadata.matchId}`
        );
        const newState = getState();
        const newMatches = differenceWith(
          newState.gamesStarted,
          map(finishedGames, (game) => game[0]),
          (left, right) => left.uuid === right.uuid
        );

        console.log(
          `[checkPostMatchInternal] Saving updated state after processing match: ${matchDto.metadata.matchId}`
        );
        setState({
          ...newState,
          gamesStarted: newMatches,
        });
        console.log(
          `[checkPostMatchInternal] Successfully updated state, removed ${finishedGames.length.toString()} finished games`
        );
      } catch (error) {
        console.error(
          `[checkPostMatchInternal] Error processing match ${matchDto.metadata.matchId}:`,
          error
        );
        throw error; // Re-throw so it gets caught by logErrors
      }
    })
  );

  console.log("=== POST-MATCH CHECK COMPLETE ===");
}
