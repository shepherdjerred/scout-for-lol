import { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { ApplicationState, Player } from "@scout-for-lol/data";
import { checkPostMatchInternal } from "./internal";
import { test, expect, beforeAll } from "bun:test";
import { Message, MessageCreateOptions, MessagePayload } from "discord.js";
import { DiscordAccountIdSchema, DiscordChannelIdSchema, LeaguePuuidSchema } from "@scout-for-lol/data";

const testdataPath = new URL("testdata/match.json", import.meta.url);

beforeAll(() => {
  // Set required env vars for configuration during tests
  process.env["VERSION"] = process.env["VERSION"] ?? "test-version";
  process.env["GIT_SHA"] = process.env["GIT_SHA"] ?? "test-git-sha";
  process.env["DISCORD_TOKEN"] = process.env["DISCORD_TOKEN"] ?? "test-token";
  process.env["APPLICATION_ID"] = process.env["APPLICATION_ID"] ?? "12345678901234567";
  process.env["RIOT_API_TOKEN"] = process.env["RIOT_API_TOKEN"] ?? "test-riot-token";
  process.env["DATABASE_URL"] = process.env["DATABASE_URL"] ?? "postgres://user:pass@localhost:5432/db";
});

test("postmatch", async () => {
  const state: ApplicationState = {
    gamesStarted: [
      {
        uuid: "uuid",
        added: new Date(),
        matchId: 1,
        players: [
          {
            player: {
              alias: "name",
              league: {
                leagueAccount: {
                  puuid: LeaguePuuidSchema.parse(
                    "XtEsV464OFaO3c0_q9REa6wYF0HpC2LK4laLnyM7WhfAVeuDz9biieJ5ZRD049AUCBjLjyBeeezTaw",
                  ),
                  region: "AMERICA_NORTH",
                },
                lastSeenInGame: null,
              },
              discordAccount: {
                id: DiscordAccountIdSchema.parse("123456789012345678"),
              },
            },
            rank: { division: 3, tier: "gold", lp: 11, wins: 10, losses: 20 },
          },
        ],
      },
    ],
  };
  const saveMatchFn = async () => {
    // do nothing
  };
  const sendFn = async (
    message: string | MessagePayload | MessageCreateOptions,
  ): Promise<Message<true> | Message<false>> => {
    expect(message).toMatchSnapshot();
    return Promise.resolve({} as unknown as Message<true> | Message<false>);
  };
  const checkMatchFn = async () => {
    // eslint-disable-next-line no-restricted-syntax -- I'm okay with this since we're loading a saved API response
    const exampleMatch = JSON.parse(await Bun.file(testdataPath).text()) as MatchV5DTOs.MatchDto;
    return exampleMatch;
  };
  const getPlayerFn = (): Promise<Player> => {
    return Promise.resolve({
      config: {
        alias: "name",
        league: {
          leagueAccount: {
            puuid: LeaguePuuidSchema.parse(
              "XtEsV464OFaO3c0_q9REa6wYF0HpC2LK4laLnyM7WhfAVeuDz9biieJ5ZRD049AUCBjLjyBeeezTaw",
            ),
            region: "AMERICA_NORTH",
          },
        },
        discordAccount: {
          id: DiscordAccountIdSchema.parse("12345678901234567"),
        },
      },
      ranks: {
        solo: { division: 3, tier: "gold", lp: 11, wins: 10, losses: 20 },
      },
    } satisfies Player);
  };
  const getSubscriptionsFn = () => {
    return Promise.resolve([{ channel: DiscordChannelIdSchema.parse("12345678901234567") }]);
  };

  await checkPostMatchInternal(state, saveMatchFn, checkMatchFn, sendFn, getPlayerFn, getSubscriptionsFn);
});
