import { z } from "zod";
import { LeagueAccountSchema } from "./leagueAccount.ts";
import { DiscordSchema } from "./discord.ts";

export type PlayerConfigEntry = z.infer<typeof PlayerConfigEntrySchema>;
export const PlayerConfigEntrySchema = z.strictObject({
  alias: z.string(),
  league: z.strictObject({
    leagueAccount: LeagueAccountSchema,
  }),
  discordAccount: DiscordSchema.nullable(),
});

export type PlayerConfig = z.infer<typeof PlayerConfigSchema>;
export const PlayerConfigSchema = z.array(PlayerConfigEntrySchema);
