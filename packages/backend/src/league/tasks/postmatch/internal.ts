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
  try {
    const region = mapRegionToEnum(
      game.players[0].player.league.leagueAccount.region
    );

    const response = await api.MatchV5.get(
      `${region}_${game.matchId.toString()}`,
      regionToRegionGroup(region)
    );
    return response.response;
  } catch (e) {
    const result = z.object({ status: z.number() }).safeParse(e);
    if (result.success) {
      if (result.data.status == 404) {
        // game not done
        return undefined;
      }
      if (result.data.status == 403) {
        // Not recoverable: log and remove from queue
        console.error(
          `403 Forbidden for match ${game.matchId.toString()}, removing from queue.`
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
    console.error(e);
    return undefined;
  }
}

export async function saveMatch(_match: MatchV5DTOs.MatchDto) {
  // TODO
}

async function getImage(
  match: CompletedMatch
): Promise<[AttachmentBuilder, EmbedBuilder]> {
  const image = await matchToImage(match);
  const attachment = new AttachmentBuilder(image).setName("match.png");
  if (!attachment.name) {
    throw new Error("Attachment name is null");
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
  getPlayerFn: (playerConfig: PlayerConfigEntry) => Promise<Player>
) {
  // Get teams using backend/model/match.ts helpers
  const getTeams = (participants: MatchV5DTOs.ParticipantDto[]) => {
    return {
      blue: pipe(participants.slice(0, 5), map(participantToChampion)),
      red: pipe(participants.slice(5, 10), map(participantToChampion)),
    };
  };
  const teams = getTeams(match.info.participants);
  const queueType = parseQueueType(match.info.queueId);

  // Gather all relevant players
  const players = await Promise.all(
    state.players.map(async (playerState) => {
      // Find the participant in the match by puuid
      const participant = match.info.participants.find(
        (p) => p.puuid === playerState.player.league.leagueAccount.puuid
      );
      if (!participant) {
        throw new Error(
          `unable to find participant for player ${JSON.stringify(playerState)}, match: ${JSON.stringify(match)}`
        );
      }
      const fullPlayer = await getPlayerFn(playerState.player);
      let rankBeforeMatch: Rank | undefined = undefined;
      let rankAfterMatch: Rank | undefined = undefined;
      if (state.queue === "solo" || state.queue === "flex") {
        rankBeforeMatch = playerState.rank;
        rankAfterMatch = fullPlayer.ranks[state.queue];
      }
      const champion = participantToChampion(participant);
      const team = parseTeam(participant.teamId);
      if (!team) {
        throw new Error(
          `Could not determine team for participant: ${JSON.stringify(participant)}`
        );
      }
      const enemyTeam = invertTeam(team);
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
  console.log(`Found ${state.gamesStarted.length} games in progress`);

  if (state.gamesStarted.length === 0) {
    console.log("No games to check, skipping post-match processing");
    return;
  }

  // Log details about each game being checked
  state.gamesStarted.forEach((game, index) => {
    console.log(
      `Game ${index + 1}: matchId=${game.matchId}, players=${game.players.length}, added=${game.added}`
    );
  });

  console.log("checking match api");
  const games = await Promise.all(state.gamesStarted.map(checkFn));

  console.log(`API check results: ${games.length} responses`);
  games.forEach((game, index) => {
    if (game) {
      console.log(`Game ${index + 1}: FINISHED - ${game.metadata.matchId}`);
    } else {
      console.log(`Game ${index + 1}: STILL IN PROGRESS or ERROR`);
    }
  });

  console.log("removing games in progress");
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

  console.log(`Found ${finishedGames.length} finished games to process`);

  if (finishedGames.length === 0) {
    console.log("No finished games to process, ending post-match check");
    return;
  }

  // TODO: send duo queue message
  console.log("sending messages");
  await Promise.all(
    map(finishedGames, async ([state, matchDto]) => {
      console.log(`Processing finished game: ${matchDto.metadata.matchId}`);

      try {
        await saveFn(matchDto);
        console.log(`Saved match: ${matchDto.metadata.matchId}`);

        const matchObj = await createMatchObj(state, matchDto, getPlayerFn);
        console.log(`Created match object for: ${matchDto.metadata.matchId}`);

        const [attachment, embed] = await getImage(matchObj);
        console.log(`Generated image for: ${matchDto.metadata.matchId}`);

        // figure out what channels to send the message to
        // server, see if they have a player in the game
        const servers = await getSubscriptionsFn([
          state.players[0].player.league.leagueAccount.puuid,
        ]);
        console.log(
          `Found ${servers.length} subscribed channels for match: ${matchDto.metadata.matchId}`
        );

        const promises = servers.map((server) => {
          console.log(`Sending message to channel: ${server.channel}`);
          return sendFn(
            { embeds: [embed], files: [attachment] },
            server.channel
          );
        });
        await Promise.all(promises);
        console.log(
          `Successfully sent messages for match: ${matchDto.metadata.matchId}`
        );

        console.log("calculating new state");
        const newState = getState();
        const newMatches = differenceWith(
          newState.gamesStarted,
          map(finishedGames, (game) => game[0]),
          (left, right) => left.uuid === right.uuid
        );

        console.log("saving state files");
        setState({
          ...state,
          gamesStarted: newMatches,
        });
        console.log(
          `Updated state, removed ${finishedGames.length} finished games`
        );
      } catch (error) {
        console.error(
          `Error processing match ${matchDto.metadata.matchId}:`,
          error
        );
        throw error; // Re-throw so it gets caught by logErrors
      }
    })
  );

  console.log("=== POST-MATCH CHECK COMPLETE ===");
}
