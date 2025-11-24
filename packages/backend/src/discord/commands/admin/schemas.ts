import { z } from "zod";
import { DiscordAccountIdSchema, DiscordGuildIdSchema, RegionSchema, RiotIdSchema } from "@scout-for-lol/data";

/**
 * Common player alias schema (used across many admin commands)
 */
export const PlayerAliasSchema = z.string().min(1).max(100);

/**
 * Common guild ID schema (used in all commands)
 */
export const GuildIdSchema = DiscordGuildIdSchema;

/**
 * Base schema for commands that require a player alias and guild ID
 */
export const BasePlayerCommandSchema = z.object({
  playerAlias: PlayerAliasSchema,
  guildId: GuildIdSchema,
});

/**
 * Schema for commands that work with Riot accounts (Riot ID + Region)
 */
export const RiotAccountSchema = z.object({
  riotId: RiotIdSchema,
  region: RegionSchema,
});

/**
 * Schema for commands that link/unlink Discord users
 */
export const DiscordUserSchema = z.object({
  discordUserId: DiscordAccountIdSchema,
});
