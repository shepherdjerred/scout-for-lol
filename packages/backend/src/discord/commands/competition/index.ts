import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import { executeCompetitionCreate } from "./create.js";
import { executeCompetitionCancel } from "./cancel.js";
import { executeGrantPermission } from "./grant-permission.js";
import { executeCompetitionJoin } from "./join.js";
import { executeCompetitionInvite } from "./invite.js";
import { executeCompetitionView } from "./view.js";
import { executeCompetitionLeave } from "./leave.js";

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
          .setDescription("Start date+time (ISO: YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, or with timezone Z/+HH:mm)")
          .setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName("end-date")
          .setDescription("End date+time (ISO: YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, or with timezone Z/+HH:mm)")
          .setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName("season")
          .setDescription("Season ID (alternative to fixed dates, e.g. 'Season 2024' or '2024 Split 1')")
          .setRequired(false),
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
            { name: "Swiftplay", value: "SWIFTPLAY" },
            { name: "Draft Pick", value: "DRAFT_PICK" },
            { name: "Custom", value: "CUSTOM" },
            { name: "All Queues", value: "ALL" },
          ),
      )
      .addStringOption((option) =>
        option
          .setName("champion")
          .setDescription("Champion name (required for Most Wins Champion)")
          .setRequired(false)
          .setAutocomplete(true),
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
  .addSubcommand((subcommand) =>
    subcommand
      .setName("cancel")
      .setDescription("Cancel a competition")
      .addIntegerOption((option) =>
        option
          .setName("competition-id")
          .setDescription("ID of the competition to cancel")
          .setRequired(true)
          .setMinValue(1),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("grant-permission")
      .setDescription("Grant competition creation permission to a user")
      .addUserOption((option) =>
        option.setName("user").setDescription("User to grant permission to").setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("join")
      .setDescription("Join a competition")
      .addIntegerOption((option) =>
        option
          .setName("competition-id")
          .setDescription("ID of the competition to join")
          .setRequired(true)
          .setMinValue(1),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("invite")
      .setDescription("Invite a user to your competition")
      .addIntegerOption((option) =>
        option.setName("competition-id").setDescription("ID of your competition").setRequired(true).setMinValue(1),
      )
      .addUserOption((option) => option.setName("user").setDescription("User to invite").setRequired(true)),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("leave")
      .setDescription("Leave a competition")
      .addIntegerOption((option) =>
        option
          .setName("competition-id")
          .setDescription("ID of the competition to leave")
          .setRequired(true)
          .setMinValue(1),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("view")
      .setDescription("View competition details and leaderboard")
      .addIntegerOption((option) =>
        option
          .setName("competition-id")
          .setDescription("ID of the competition to view")
          .setRequired(true)
          .setMinValue(1),
      ),
  )
  .setContexts(InteractionContextType.Guild);

export {
  executeCompetitionCreate,
  executeCompetitionCancel,
  executeGrantPermission,
  executeCompetitionJoin,
  executeCompetitionInvite,
  executeCompetitionLeave,
  executeCompetitionView,
};
