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
  type LeagueSummonerId,
  LoadingScreenState,
  Player,
  PlayerConfigEntry,
  type Rank,
} from "@scout/data";
import { getState, setState } from "../../model/state.ts";
import { differenceWith, filter, first, map, pipe } from "remeda";
import { toMatch } from "../../model/match.ts";
import { regionToRegionGroup } from "twisted/dist/constants/regions.js";
import { mapRegionToEnum } from "../../model/region.ts";

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
        console.error(`403 Forbidden for match ${game.matchId}, removing from queue.`);
        setState({
          ...getState(),
          gamesStarted: getState().gamesStarted.filter(g => g.matchId !== game.matchId),
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
  const player = pipe(
    match.info.participants,
    filter(
      (participant) =>
        // TODO: why are we grabbing player zero? -- I think it's because I was halfway through adding multi-player support e.g. for flex and duo queue
        participant.puuid ===
          state.players[0].player.league.leagueAccount.puuid,
    ),
    first(),
  );

  if (player == undefined) {
    throw new Error(
      `unable to find player ${JSON.stringify(state)}, ${
        JSON.stringify(match)
      }`,
    );
  }

  // TODO: support multiple players, e.g. for duo and flex queue
  const fullPlayer = await getPlayerFn(state.players[0].player);

  let rankBeforeMatch: Rank | undefined;
  let rankAfterMatch: Rank | undefined;

  if (state.queue === "solo" || state.queue === "flex") {
    rankBeforeMatch = state.players[0].rank;
    rankAfterMatch = fullPlayer.ranks[state.queue];
  }

  return toMatch(fullPlayer, match, rankBeforeMatch, rankAfterMatch);
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
