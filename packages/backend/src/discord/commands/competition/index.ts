import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { executeCompetitionCreate } from "./create.js";

/**
 * Main competition command with subcommands
 */
export const competitionCommand = new SlashCommandBuilder()
  .setName("competition")
  .setDescription("Manage competitions")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("create")
      .setDescription("Create a new competition")
      // Required fields
      .addStringOption((option) =>
        option.setName("title").setDescription("Competition title (max 100 chars)").setRequired(true).setMaxLength(100),
      )
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("Competition description (max 500 chars)")
          .setRequired(true)
          .setMaxLength(500),
      )
      .addStringOption((option) =>
        option
          .setName("criteria-type")
          .setDescription("What to rank participants on")
          .setRequired(true)
          .addChoices(
            { name: "Most Games Played", value: "MOST_GAMES_PLAYED" },
            { name: "Highest Rank", value: "HIGHEST_RANK" },
            { name: "Most Rank Climb", value: "MOST_RANK_CLIMB" },
            { name: "Most Wins (Player)", value: "MOST_WINS_PLAYER" },
            { name: "Most Wins (Champion)", value: "MOST_WINS_CHAMPION" },
            { name: "Highest Win Rate", value: "HIGHEST_WIN_RATE" },
          ),
      )
      .addChannelOption((option) =>
        option.setName("channel").setDescription("Channel for daily leaderboard updates").setRequired(true),
      )
      // Date options (mutually exclusive with season)
      .addStringOption((option) =>
        option
          .setName("start-date")
          .setDescription("Start date (ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)")
          .setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName("end-date")
          .setDescription("End date (ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)")
          .setRequired(false),
      )
      .addStringOption((option) =>
        option.setName("season").setDescription("Season ID (alternative to fixed dates)").setRequired(false),
      )
      // Criteria-specific options
      .addStringOption((option) =>
        option
          .setName("queue")
          .setDescription("Queue type (required for most criteria)")
          .setRequired(false)
          .addChoices(
            { name: "Solo Queue", value: "SOLO" },
            { name: "Flex Queue", value: "FLEX" },
            { name: "Any Ranked", value: "RANKED_ANY" },
            { name: "Arena", value: "ARENA" },
            { name: "ARAM", value: "ARAM" },
            { name: "All Queues", value: "ALL" },
          ),
      )
      .addIntegerOption((option) =>
        option
          .setName("champion-id")
          .setDescription("Champion ID (required for Most Wins Champion)")
          .setRequired(false)
          .setMinValue(1),
      )
      .addIntegerOption((option) =>
        option
          .setName("min-games")
          .setDescription("Minimum games for win rate (default: 10)")
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(100),
      )
      // Configuration options
      .addStringOption((option) =>
        option
          .setName("visibility")
          .setDescription("Who can join (default: OPEN)")
          .setRequired(false)
          .addChoices(
            { name: "Open (anyone can join)", value: "OPEN" },
            { name: "Invite Only", value: "INVITE_ONLY" },
            { name: "Server Wide (automatic)", value: "SERVER_WIDE" },
          ),
      )
      .addIntegerOption((option) =>
        option
          .setName("max-participants")
          .setDescription("Maximum participants (default: 50)")
          .setRequired(false)
          .setMinValue(2)
          .setMaxValue(100),
      ),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setContexts(InteractionContextType.Guild);

export { executeCompetitionCreate };
