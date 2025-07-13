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

export async function checkMatch(game: LoadingScreenState) {
  console.log(
    `[checkMatch] Starting match check for matchId: ${game.matchId.toString()}`
  );
  console.log(`[checkMatch] Game details:`, {
    matchId: game.matchId.toString(),
    playersCount: game.players.length,
    queue: game.queue,
    added: game.added.toISOString(),
  });

  try {
    const region = mapRegionToEnum(
      game.players[0].player.league.leagueAccount.region
    );
    console.log(`[checkMatch] Mapped region: ${region}`);

    const regionGroup = regionToRegionGroup(region);
    console.log(`[checkMatch] Region group: ${regionGroup}`);

    const matchIdForApi = `${region}_${game.matchId.toString()}`;
    console.log(`[checkMatch] Calling API with matchId: ${matchIdForApi}`);

    const response = await api.MatchV5.get(matchIdForApi, regionGroup);
    console.log(
      `[checkMatch] API response received for match: ${game.matchId.toString()}`
    );
    console.log(
      `[checkMatch] Match status: ${response.response.info.gameEndTimestamp ? "FINISHED" : "IN_PROGRESS"}`
    );
    return response.response;
  } catch (e) {
    console.log(
      `[checkMatch] Error occurred for match ${game.matchId.toString()}:`,
      e
    );
    const result = z.object({ status: z.number() }).safeParse(e);
    if (result.success) {
      console.log(
        `[checkMatch] HTTP status code: ${result.data.status.toString()}`
      );
      if (result.data.status == 404) {
        // game not done
        console.log(
          `[checkMatch] Match ${game.matchId.toString()} not finished yet (404)`
        );
        return undefined;
      }
      if (result.data.status == 403) {
        // Not recoverable: log and remove from queue
        console.error(
          `[checkMatch] 403 Forbidden for match ${game.matchId.toString()}, removing from queue.`
        );
        setState({
          ...getState(),
          gamesStarted: getState().gamesStarted.filter(
            (g) => g.matchId !== game.matchId
          ),
        });
        return undefined;
      }
    }
    console.error(
      `[checkMatch] Unhandled error for match ${game.matchId.toString()}:`,
      e
    );
    return undefined;
  }
}

export function saveMatch(_match: MatchV5DTOs.MatchDto) {
  console.log(`[saveMatch] Saving match: ${_match.metadata.matchId}`);
  // TODO
  console.log(
    `[saveMatch] Match saving not implemented yet for: ${_match.metadata.matchId}`
  );
}

async function getImage(
  match: CompletedMatch
): Promise<[AttachmentBuilder, EmbedBuilder]> {
  console.log(`[getImage] Starting image generation for match`);
  console.log(`[getImage] Match details:`, {
    queueType: match.queueType,
    playersCount: match.players.length,
    durationInSeconds: match.durationInSeconds,
  });

  try {
    const image = await matchToImage(match);
    console.log(
      `[getImage] Image generated successfully, size: ${image.length.toString()} bytes`
    );

    const attachment = new AttachmentBuilder(image).setName("match.png");
    if (!attachment.name) {
      throw new Error("[getImage] Attachment name is null");
    }
    console.log(`[getImage] Attachment created with name: ${attachment.name}`);

    const embed = {
      image: {
        url: `attachment://${attachment.name}`,
      },
    };
    console.log(`[getImage] Embed created successfully`);

    return [attachment, new EmbedBuilder(embed)];
  } catch (error) {
    console.error(`[getImage] Error generating image:`, error);
    throw error;
  }
}

async function createMatchObj(
  state: LoadingScreenState,
  match: MatchV5DTOs.MatchDto,
  getPlayerFn: (playerConfig: PlayerConfigEntry) => Promise<Player>
) {
  console.log(
    `[createMatchObj] Starting match object creation for matchId: ${match.metadata.matchId}`
  );
  console.log(`[createMatchObj] State details:`, {
    playersCount: state.players.length,
    queue: state.queue,
    matchId: state.matchId.toString(),
  });

  // Get teams using backend/model/match.ts helpers
  const getTeams = (participants: MatchV5DTOs.ParticipantDto[]) => {
    return {
      blue: pipe(participants.slice(0, 5), map(participantToChampion)),
      red: pipe(participants.slice(5, 10), map(participantToChampion)),
    };
  };
  const teams = getTeams(match.info.participants);
  const queueType = parseQueueType(match.info.queueId);
  console.log(
    `[createMatchObj] Queue type: ${queueType ?? "unknown"}, participants: ${match.info.participants.length.toString()}`
  );

  // Gather all relevant players
  console.log(
    `[createMatchObj] Processing ${state.players.length.toString()} players`
  );
  const players = await Promise.all(
    state.players.map(async (playerState, index) => {
      console.log(
        `[createMatchObj] Processing player ${(index + 1).toString()}/${state.players.length.toString()}:`,
        {
          puuid: playerState.player.league.leagueAccount.puuid,
          queue: state.queue,
        }
      );

      // Find the participant in the match by puuid
      const participant = match.info.participants.find(
        (p) => p.puuid === playerState.player.league.leagueAccount.puuid
      );
      if (!participant) {
        console.error(
          `[createMatchObj] Unable to find participant for player:`,
          playerState
        );
        throw new Error(
          `unable to find participant for player ${JSON.stringify(playerState)}, match: ${JSON.stringify(match)}`
        );
      }
      console.log(
        `[createMatchObj] Found participant for player ${(index + 1).toString()}:`,
        {
          championId: participant.championId,
          teamId: participant.teamId,
          win: participant.win,
        }
      );

      const fullPlayer = await getPlayerFn(playerState.player);
      console.log(
        `[createMatchObj] Retrieved full player data for player ${(index + 1).toString()}`
      );

      let rankBeforeMatch: Rank | undefined = undefined;
      let rankAfterMatch: Rank | undefined = undefined;
      if (state.queue === "solo" || state.queue === "flex") {
        rankBeforeMatch = playerState.rank;
        rankAfterMatch = fullPlayer.ranks[state.queue];
        console.log(
          `[createMatchObj] Rank data for player ${(index + 1).toString()}:`,
          {
            before: rankBeforeMatch?.tier,
            after: rankAfterMatch?.tier,
          }
        );
      }

      const champion = participantToChampion(participant);
      const team = parseTeam(participant.teamId);
      if (!team) {
        console.error(
          `[createMatchObj] Could not determine team for participant:`,
          participant
        );
        throw new Error(
          `Could not determine team for participant: ${JSON.stringify(participant)}`
        );
      }
      const enemyTeam = invertTeam(team);

      console.log(
        `[createMatchObj] Player ${(index + 1).toString()} processed:`,
        {
          champion: champion.championName,
          team: team,
          outcome: getOutcome(participant),
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
        outcome: getOutcome(participant),
        team: team,
        lane: champion.lane,
        laneOpponent: getLaneOpponent(champion, teams[enemyTeam]),
      };
    })
  );

  console.log(
    `[createMatchObj] Match object created successfully for matchId: ${match.metadata.matchId}`
  );
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
    map(
      (game) =>
        [
          game,
          games.find((g) => g?.metadata.matchId === game.matchId.toString()),
        ] satisfies [LoadingScreenState, MatchV5DTOs.MatchDto | undefined]
    ),
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
        const servers = await getSubscriptionsFn([
          state.players[0].player.league.leagueAccount.puuid,
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
