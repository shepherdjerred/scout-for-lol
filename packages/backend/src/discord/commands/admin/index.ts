import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
export { executePlayerEditAlias } from "./player-edit-alias";
export { executeAccountRemove } from "./account-remove";
export { executeAccountAdd } from "./account-add";
export { executePlayerMerge } from "./player-merge";
export { executePlayerDelete } from "./player-delete";
export { executeAccountTransfer } from "./account-transfer";
export { executePlayerLinkDiscord } from "./player-link-discord";
export { executePlayerUnlinkDiscord } from "./player-unlink-discord";
export { executePlayerInfo } from "./player-info";

/**
 * Admin command for managing players and accounts
 */
export const adminCommand = new SlashCommandBuilder()
  .setName("admin")
  .setDescription("Admin commands for managing players and accounts")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("player-edit-alias")
      .setDescription("Change a player's alias")
      .addStringOption((option) =>
        option.setName("current-alias").setDescription("The current alias of the player").setRequired(true),
      )
      .addStringOption((option) =>
        option.setName("new-alias").setDescription("The new alias for the player").setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("account-remove")
      .setDescription("Remove an account from a player")
      .addStringOption((option) =>
        option.setName("riot-id").setDescription("The Riot ID of the account in format <name>#<tag>").setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("region")
          .setDescription("The region of the account")
          .setRequired(true)
          .addChoices(
            { name: "NA (North America)", value: "na1" },
            { name: "EUW (Europe West)", value: "euw1" },
            { name: "EUNE (Europe Nordic & East)", value: "eun1" },
            { name: "KR (Korea)", value: "kr" },
            { name: "BR (Brazil)", value: "br1" },
            { name: "LAN (Latin America North)", value: "la1" },
            { name: "LAS (Latin America South)", value: "la2" },
            { name: "OCE (Oceania)", value: "oc1" },
            { name: "RU (Russia)", value: "ru" },
            { name: "TR (Turkey)", value: "tr1" },
            { name: "JP (Japan)", value: "jp1" },
            { name: "PH (Philippines)", value: "ph2" },
            { name: "SG (Singapore)", value: "sg2" },
            { name: "TH (Thailand)", value: "th2" },
            { name: "TW (Taiwan)", value: "tw2" },
            { name: "VN (Vietnam)", value: "vn2" },
          ),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("account-add")
      .setDescription("Add an account to an existing player")
      .addStringOption((option) =>
        option
          .setName("player-alias")
          .setDescription("The alias of the player to add the account to")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option.setName("riot-id").setDescription("The Riot ID of the account in format <name>#<tag>").setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("region")
          .setDescription("The region of the account")
          .setRequired(true)
          .addChoices(
            { name: "NA (North America)", value: "na1" },
            { name: "EUW (Europe West)", value: "euw1" },
            { name: "EUNE (Europe Nordic & East)", value: "eun1" },
            { name: "KR (Korea)", value: "kr" },
            { name: "BR (Brazil)", value: "br1" },
            { name: "LAN (Latin America North)", value: "la1" },
            { name: "LAS (Latin America South)", value: "la2" },
            { name: "OCE (Oceania)", value: "oc1" },
            { name: "RU (Russia)", value: "ru" },
            { name: "TR (Turkey)", value: "tr1" },
            { name: "JP (Japan)", value: "jp1" },
            { name: "PH (Philippines)", value: "ph2" },
            { name: "SG (Singapore)", value: "sg2" },
            { name: "TH (Thailand)", value: "th2" },
            { name: "TW (Taiwan)", value: "tw2" },
            { name: "VN (Vietnam)", value: "vn2" },
          ),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("account-transfer")
      .setDescription("Transfer an account from one player to another")
      .addStringOption((option) =>
        option.setName("riot-id").setDescription("The Riot ID of the account in format <name>#<tag>").setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("region")
          .setDescription("The region of the account")
          .setRequired(true)
          .addChoices(
            { name: "NA (North America)", value: "na1" },
            { name: "EUW (Europe West)", value: "euw1" },
            { name: "EUNE (Europe Nordic & East)", value: "eun1" },
            { name: "KR (Korea)", value: "kr" },
            { name: "BR (Brazil)", value: "br1" },
            { name: "LAN (Latin America North)", value: "la1" },
            { name: "LAS (Latin America South)", value: "la2" },
            { name: "OCE (Oceania)", value: "oc1" },
            { name: "RU (Russia)", value: "ru" },
            { name: "TR (Turkey)", value: "tr1" },
            { name: "JP (Japan)", value: "jp1" },
            { name: "PH (Philippines)", value: "ph2" },
            { name: "SG (Singapore)", value: "sg2" },
            { name: "TH (Thailand)", value: "th2" },
            { name: "TW (Taiwan)", value: "tw2" },
            { name: "VN (Vietnam)", value: "vn2" },
          ),
      )
      .addStringOption((option) =>
        option
          .setName("to-player-alias")
          .setDescription("The alias of the player to transfer the account to")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("player-merge")
      .setDescription("Merge two players into one (combines all accounts and subscriptions)")
      .addStringOption((option) =>
        option
          .setName("source-alias")
          .setDescription("The alias of the player to merge from (will be deleted)")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("target-alias")
          .setDescription("The alias of the player to merge into (will keep)")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("player-delete")
      .setDescription("Delete a player and all their accounts and subscriptions")
      .addStringOption((option) =>
        option.setName("alias").setDescription("The alias of the player to delete").setRequired(true),
      )
      .addBooleanOption((option) =>
        option
          .setName("confirm")
          .setDescription("Type 'true' to confirm deletion (CANNOT BE UNDONE)")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("player-info")
      .setDescription("View detailed player information (accounts, subscriptions, competitions, debug info)")
      .addStringOption((option) =>
        option.setName("alias").setDescription("The alias of the player to view").setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("player-link-discord")
      .setDescription("Link a Discord user to a player")
      .addStringOption((option) =>
        option.setName("player-alias").setDescription("The alias of the player to link").setRequired(true),
      )
      .addUserOption((option) =>
        option.setName("discord-user").setDescription("The Discord user to link to this player").setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("player-unlink-discord")
      .setDescription("Unlink a Discord user from a player")
      .addStringOption((option) =>
        option.setName("player-alias").setDescription("The alias of the player to unlink").setRequired(true),
      ),
  );
