import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { z } from "zod";
import { type CompetitionCriteria, CompetitionQueueTypeSchema, CompetitionVisibilitySchema } from "@scout-for-lol/data";
import { fromError } from "zod-validation-error";
import { prisma } from "../../../database/index.js";
import { canCreateCompetition } from "../../../database/competition/permissions.js";
import { type CreateCompetitionInput, createCompetition } from "../../../database/competition/queries.js";
import { recordCreation } from "../../../database/competition/rate-limit.js";
import { validateOwnerLimit, validateServerLimit } from "../../../database/competition/validation.js";
import { getErrorMessage } from "../../../utils/errors.js";

// ============================================================================
// Input Parsing Schema - Discriminated Unions
// ============================================================================

/**
 * Common fields for all variants
 */
const CommonArgsSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  channelId: z.string(),
  guildId: z.string(),
  userId: z.string(),
  visibility: CompetitionVisibilitySchema.optional(),
  maxParticipants: z.number().int().min(2).max(100).optional(),
});

/**
 * Fixed dates variant with date string validation
 */
const FixedDatesArgsSchema = z
  .object({
    dateType: z.literal("FIXED"),
    startDate: z.string(),
    endDate: z.string(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return !isNaN(start.getTime()) && !isNaN(end.getTime());
    },
    {
      message: "Invalid date format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)",
      path: ["startDate"],
    },
  );

/**
 * Season variant with length limit
 */
const SeasonArgsSchema = z.object({
  dateType: z.literal("SEASON"),
  season: z.string().min(1).max(100),
});

/**
 * Criteria-specific args (using union of all possible combinations)
 */
const MostGamesPlayedArgsSchema = z.object({
  criteriaType: z.literal("MOST_GAMES_PLAYED"),
  queue: CompetitionQueueTypeSchema,
});

const HighestRankArgsSchema = z.object({
  criteriaType: z.literal("HIGHEST_RANK"),
  queue: z.enum(["SOLO", "FLEX"]),
});

const MostRankClimbArgsSchema = z.object({
  criteriaType: z.literal("MOST_RANK_CLIMB"),
  queue: z.enum(["SOLO", "FLEX"]),
});

const MostWinsPlayerArgsSchema = z.object({
  criteriaType: z.literal("MOST_WINS_PLAYER"),
  queue: CompetitionQueueTypeSchema,
});

const MostWinsChampionArgsSchema = z.object({
  criteriaType: z.literal("MOST_WINS_CHAMPION"),
  championId: z.number().int().positive(),
  queue: CompetitionQueueTypeSchema.optional(),
});

const HighestWinRateArgsSchema = z.object({
  criteriaType: z.literal("HIGHEST_WIN_RATE"),
  queue: CompetitionQueueTypeSchema,
  minGames: z.number().int().positive().optional(),
});

/**
 * Union of all possible argument combinations
 * Type system enforces correct fields for each criteria+date combination
 */
const CreateCommandArgsSchema = z.union([
  CommonArgsSchema.and(FixedDatesArgsSchema).and(MostGamesPlayedArgsSchema),
  CommonArgsSchema.and(SeasonArgsSchema).and(MostGamesPlayedArgsSchema),
  CommonArgsSchema.and(FixedDatesArgsSchema).and(HighestRankArgsSchema),
  CommonArgsSchema.and(SeasonArgsSchema).and(HighestRankArgsSchema),
  CommonArgsSchema.and(FixedDatesArgsSchema).and(MostRankClimbArgsSchema),
  CommonArgsSchema.and(SeasonArgsSchema).and(MostRankClimbArgsSchema),
  CommonArgsSchema.and(FixedDatesArgsSchema).and(MostWinsPlayerArgsSchema),
  CommonArgsSchema.and(SeasonArgsSchema).and(MostWinsPlayerArgsSchema),
  CommonArgsSchema.and(FixedDatesArgsSchema).and(MostWinsChampionArgsSchema),
  CommonArgsSchema.and(SeasonArgsSchema).and(MostWinsChampionArgsSchema),
  CommonArgsSchema.and(FixedDatesArgsSchema).and(HighestWinRateArgsSchema),
  CommonArgsSchema.and(SeasonArgsSchema).and(HighestWinRateArgsSchema),
]);

type CreateCommandArgs = z.infer<typeof CreateCommandArgsSchema>;

// ============================================================================
// Command Execution
// ============================================================================

/**
 * Execute /competition create command
 */
export async function executeCompetitionCreate(interaction: ChatInputCommandInteraction): Promise<void> {
  const startTime = Date.now();
  const userId = interaction.user.id;
  const username = interaction.user.username;
  const guildId = interaction.guildId;

  console.log(`🏆 Starting competition creation for user ${username} (${userId}) in guild ${guildId ?? "unknown"}`);

  // ============================================================================
  // Step 1: Parse and validate Discord command options
  // ============================================================================

  let args: CreateCommandArgs;

  try {
    // Parse Discord options
    const startDateStr = interaction.options.getString("start-date");
    const endDateStr = interaction.options.getString("end-date");
    const seasonStr = interaction.options.getString("season");

    // Determine date type
    const hasFixedDates = startDateStr !== null && endDateStr !== null;
    const hasSeason = seasonStr !== null;

    if (!hasFixedDates && !hasSeason) {
      throw new Error("Must specify either (start-date AND end-date) OR season");
    }
    if (hasFixedDates && hasSeason) {
      throw new Error("Cannot specify both fixed dates and season");
    }

    const dateType = hasFixedDates ? ("FIXED" as const) : ("SEASON" as const);

    args = CreateCommandArgsSchema.parse({
      title: interaction.options.getString("title"),
      description: interaction.options.getString("description"),
      criteriaType: interaction.options.getString("criteria-type"),
      channelId: interaction.options.getChannel("channel")?.id,
      guildId,
      userId,
      dateType,
      startDate: startDateStr ?? undefined,
      endDate: endDateStr ?? undefined,
      season: seasonStr ?? undefined,
      queue: interaction.options.getString("queue") ?? undefined,
      championId: interaction.options.getInteger("champion-id") ?? undefined,
      minGames: interaction.options.getInteger("min-games") ?? undefined,
      visibility: interaction.options.getString("visibility") ?? undefined,
      maxParticipants: interaction.options.getInteger("max-participants") ?? undefined,
    });

    console.log(`✅ Command arguments validated successfully`);
    console.log(`📋 Title: "${args.title}", Criteria: ${args.criteriaType}, Channel: ${args.channelId}`);
  } catch (error) {
    console.error(`❌ Invalid command arguments from ${username}:`, error);
    const validationError = fromError(error);
    await interaction.reply({
      content: `**Invalid input:**\n${validationError.toString()}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 2: Permission and rate limit checks
  // ============================================================================

  try {
    // Get member to check permissions
    const member = await interaction.guild?.members.fetch(userId);
    if (!member) {
      throw new Error("Could not fetch member from guild");
    }

    const permissionCheck = await canCreateCompetition(prisma, args.guildId, userId, member.permissions);

    if (!permissionCheck.allowed) {
      console.warn(`⚠️  Permission denied for ${username}: ${permissionCheck.reason ?? "unknown reason"}`);
      await interaction.reply({
        content: `**Permission denied:**\n${permissionCheck.reason ?? "No permission"}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    console.log(`✅ Permission check passed for ${username}`);
  } catch (error) {
    console.error(`❌ Permission check failed:`, error);
    await interaction.reply({
      content: `**Error checking permissions:**\n${getErrorMessage(error)}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // TypeScript narrows the union based on criteriaType!
  let criteria: CompetitionCriteria;

  // TODO: use pattern matching to remove else
  if (args.criteriaType === "MOST_GAMES_PLAYED") {
    criteria = { type: "MOST_GAMES_PLAYED", queue: args.queue };
  } else if (args.criteriaType === "HIGHEST_RANK") {
    criteria = { type: "HIGHEST_RANK", queue: args.queue };
  } else if (args.criteriaType === "MOST_RANK_CLIMB") {
    criteria = { type: "MOST_RANK_CLIMB", queue: args.queue };
  } else if (args.criteriaType === "MOST_WINS_PLAYER") {
    criteria = { type: "MOST_WINS_PLAYER", queue: args.queue };
  } else if (args.criteriaType === "MOST_WINS_CHAMPION") {
    criteria = {
      type: "MOST_WINS_CHAMPION",
      championId: args.championId,
      queue: args.queue,
    };
  } else {
    // Last case: HIGHEST_WIN_RATE
    criteria = {
      type: "HIGHEST_WIN_RATE",
      minGames: args.minGames ?? 10,
      queue: args.queue,
    };
  }

  console.log(`✅ Criteria built:`, criteria);

  // ============================================================================
  // Step 4: Build competition creation input
  // ============================================================================

  let competitionInput: CreateCompetitionInput;

  try {
    // Parse dates - schema already validated format and presence
    let dates: CreateCompetitionInput["dates"];
    if (args.dateType === "FIXED") {
      if (!args.startDate || !args.endDate) {
        throw new Error("startDate/endDate required for FIXED (validation error)");
      }
      dates = {
        type: "FIXED_DATES" as const,
        startDate: new Date(args.startDate),
        endDate: new Date(args.endDate),
      };
    } else {
      if (!args.season) {
        throw new Error("season required for SEASON (validation error)");
      }
      dates = {
        type: "SEASON" as const,
        seasonId: args.season,
      };
    }

    // Extract common fields using Zod schema (no type assertions!)
    const CommonFieldsExtractSchema = z.object({
      guildId: z.string(),
      channelId: z.string(),
      title: z.string(),
      description: z.string(),
      visibility: CompetitionVisibilitySchema.optional(),
      maxParticipants: z.number().int().optional(),
    });
    const validatedCommon = CommonFieldsExtractSchema.parse(args);

    competitionInput = {
      serverId: validatedCommon.guildId,
      ownerId: userId,
      channelId: validatedCommon.channelId,
      title: validatedCommon.title,
      description: validatedCommon.description,
      visibility: validatedCommon.visibility ?? "OPEN",
      maxParticipants: validatedCommon.maxParticipants ?? 50,
      dates,
      criteria,
    };

    console.log(`✅ Competition input built (fully type-safe)`);
  } catch (error) {
    console.error(`❌ Failed to build competition input:`, error);
    await interaction.reply({
      content: `**Invalid competition data:**\n${getErrorMessage(error)}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 5: Run business validation (limits, etc.)
  // ============================================================================

  try {
    // Extract serverId using Zod schema (no type assertions!)
    const ServerIdSchema = z.object({ guildId: z.string() });
    const { guildId: serverId } = ServerIdSchema.parse(args);

    // Check owner limit (1 active competition per owner)
    await validateOwnerLimit(prisma, serverId, userId);

    // Check server limit (5 active competitions per server)
    await validateServerLimit(prisma, serverId);

    console.log(`✅ Business validation passed`);
  } catch (error) {
    console.error(`❌ Business validation failed:`, error);
    await interaction.reply({
      content: `**Validation failed:**\n${getErrorMessage(error)}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 6: Create competition in database
  // ============================================================================

  try {
    const dbStartTime = Date.now();

    const competition = await createCompetition(prisma, competitionInput);

    const dbTime = Date.now() - dbStartTime;
    console.log(`✅ Competition created with ID: ${competition.id.toString()} (${dbTime.toString()}ms)`);

    // Record creation for rate limiting
    recordCreation(args.guildId, userId);

    const totalTime = Date.now() - startTime;
    console.log(`🎉 Competition creation completed successfully in ${totalTime.toString()}ms`);

    // ============================================================================
    // Step 7: Send success response
    // ============================================================================

    // Determine status emoji based on dates
    const statusEmoji =
      competition.startDate && competition.endDate
        ? new Date() < competition.startDate
          ? "🔵" // Draft - hasn't started yet
          : "🟢" // Active - has started
        : "🟢"; // Season-based - active

    // Format date information
    const dateInfo =
      competition.startDate && competition.endDate
        ? `**Starts:** <t:${Math.floor(competition.startDate.getTime() / 1000).toString()}:F>\n**Ends:** <t:${Math.floor(competition.endDate.getTime() / 1000).toString()}:F>`
        : `**Season:** ${competition.seasonId ?? "Unknown"}`;

    await interaction.reply({
      content: `✅ **Competition Created!**

${statusEmoji} **${competition.title}**
${competition.description}

**ID:** ${competition.id.toString()}
**Type:** ${formatCriteriaType(competition.criteria.type)}
**Visibility:** ${competition.visibility}
**Max Participants:** ${competition.maxParticipants.toString()}

${dateInfo}

Users can join with:
\`/competition join competition-id:${competition.id.toString()}\``,
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    console.error(`❌ Database error during competition creation:`, error);
    await interaction.reply({
      content: `**Error creating competition:**\n${getErrorMessage(error)}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format criteria type to human-readable string
 */
function formatCriteriaType(type: string): string {
  switch (type) {
    case "MOST_GAMES_PLAYED":
      return "Most Games Played";
    case "HIGHEST_RANK":
      return "Highest Rank";
    case "MOST_RANK_CLIMB":
      return "Most Rank Climb";
    case "MOST_WINS_PLAYER":
      return "Most Wins";
    case "MOST_WINS_CHAMPION":
      return "Most Wins (Champion)";
    case "HIGHEST_WIN_RATE":
      return "Highest Win Rate";
    default:
      return type;
  }
}
