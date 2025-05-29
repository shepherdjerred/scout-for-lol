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
import { matchToImage } from "@scout/report";
import {
  ApplicationState,
  CompletedMatch,
  type DiscordChannelId,
  getLaneOpponent,
  invertTeam,
  type LeagueSummonerId,
  LoadingScreenState,
  parseQueueType,
  parseTeam,
  Player,
  PlayerConfigEntry,
  type Rank,
} from "@scout/data";
import { getState, setState } from "../../model/state.ts";
import { differenceWith, filter, map, pipe } from "remeda";
import { getOutcome } from "../../model/match.ts";
import { regionToRegionGroup } from "twisted/dist/constants/regions.js";
import { mapRegionToEnum } from "../../model/region.ts";
import { participantToChampion } from "../../model/champion.ts";

export async function checkMatch(game: LoadingScreenState) {
  try {
    const region = mapRegionToEnum(
      game.players[0].player.league.leagueAccount.region,
    );

    const response = await api.MatchV5.get(
      `${region}_${game.matchId}`,
      regionToRegionGroup(region),
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
          `403 Forbidden for match ${game.matchId}, removing from queue.`,
        );
        setState({
          ...getState(),
          gamesStarted: getState().gamesStarted.filter((g) =>
            g.matchId !== game.matchId
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
  match: CompletedMatch,
): Promise<[AttachmentBuilder, EmbedBuilder]> {
  const image = await matchToImage(match);
  const attachment = new AttachmentBuilder(image).setName("match.png");
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
        (p) =>
          p.puuid === playerState.player.league.leagueAccount.puuid
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
        throw new Error(`Could not determine team for participant: ${JSON.stringify(participant)}`);
      }
      const enemyTeam = invertTeam(team);
      return {
        playerConfig: fullPlayer.config,
        rankBeforeMatch,
        rankAfterMatch,
        wins:
          state.queue === "solo" || state.queue === "flex"
            ? fullPlayer.ranks[state.queue]?.wins || undefined
            : undefined,
        losses:
          state.queue === "solo" || state.queue === "flex"
            ? fullPlayer.ranks[state.queue]?.losses || undefined
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
    game: LoadingScreenState,
  ) => Promise<MatchV5DTOs.MatchDto | undefined>,
  sendFn: (
    message: string | MessagePayload | MessageCreateOptions,
    channelId: string,
  ) => Promise<Message<true> | Message<false>>,
  getPlayerFn: (playerConfig: PlayerConfigEntry) => Promise<Player>,
  getSubscriptionsFn: (
    playerIds: LeagueSummonerId[],
  ) => Promise<{ channel: DiscordChannelId }[]>,
) {
  console.log("checking match api");
  const games = await Promise.all(state.gamesStarted.map(checkFn));

  console.log("removing games in progress");
  const finishedGames = pipe(
    state.gamesStarted,
    (gamesStarted) => gamesStarted.map((game, index) => [game, games[index]]),
    filter(([_game, match]) => match != undefined),
    // TODO: remove this cast
  ) as [LoadingScreenState, MatchV5DTOs.MatchDto][];

  // TODO: send duo queue message
  console.log("sending messages");
  await Promise.all(
    map(finishedGames, async ([state, matchDto]) => {
      await saveFn(matchDto);

      const matchObj = await createMatchObj(state, matchDto, getPlayerFn);

      const [attachment, embed] = await getImage(matchObj);

      // figure out what channels to send the message to
      // server, see if they have a player in the game
      const servers = await getSubscriptionsFn([
        state.players[0].player.league.leagueAccount.summonerId,
      ]);

      const promises = servers.map((server) => {
        return sendFn({ embeds: [embed], files: [attachment] }, server.channel);
      });
      await Promise.all(promises);

      console.log("calculating new state");
      const newState = getState();
      const newMatches = differenceWith(
        newState.gamesStarted,
        map(finishedGames, (game) => game[0]),
        (left, right) => left.uuid === right.uuid,
      );

      console.log("saving state files");
      setState({
        ...state,
        gamesStarted: newMatches,
      });
    }),
  );
}
