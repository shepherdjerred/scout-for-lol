import { z } from "zod";
import { LeagueAccountSchema } from "./league-account.js";
import { DiscordSchema } from "./discord.js";

export type PlayerConfigEntry = z.infer<typeof PlayerConfigEntrySchema>;
export const PlayerConfigEntrySchema = z.strictObject({
  alias: z.string(),
  league: z.strictObject({
    leagueAccount: LeagueAccountSchema,
    lastSeenInGame: z.date().nullable(),
  }),
  discordAccount: DiscordSchema.nullable(),
});

export type PlayerConfig = z.infer<typeof PlayerConfigSchema>;
export const PlayerConfigSchema = z.array(PlayerConfigEntrySchema);
