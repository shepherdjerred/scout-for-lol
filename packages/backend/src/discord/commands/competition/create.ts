import { type ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { z } from "zod";
import {
  ChampionIdSchema,
  CompetitionQueueTypeSchema,
  CompetitionVisibilitySchema,
  DiscordAccountIdSchema,
  DiscordChannelIdSchema,
  DiscordGuildIdSchema,
  SeasonIdSchema,
  hasSeasonEnded,
  type CompetitionCriteria,
} from "@scout-for-lol/data";
import { fromError } from "zod-validation-error";
import { match } from "ts-pattern";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import { canCreateCompetition } from "@scout-for-lol/backend/database/competition/permissions.js";
import { type CreateCompetitionInput, createCompetition } from "@scout-for-lol/backend/database/competition/queries.js";
import { recordCreation } from "@scout-for-lol/backend/database/competition/rate-limit.js";
import { validateOwnerLimit, validateServerLimit } from "@scout-for-lol/backend/database/competition/validation.js";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";
import { getChampionId } from "@scout-for-lol/backend/utils/champion.js";
import { addParticipant } from "@scout-for-lol/backend/database/competition/participants.js";
import {
  formatCriteriaType,
  getStatusEmoji,
  formatDateInfo,
} from "@scout-for-lol/backend/discord/commands/competition/helpers.js";
import { truncateDiscordMessage } from "@scout-for-lol/backend/discord/utils/message.js";

// ============================================================================
// Input Parsing Schema - Discriminated Unions
// ============================================================================

/**
 * Common fields for all variants
 */
const CommonArgsSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  channelId: DiscordChannelIdSchema,
  guildId: DiscordGuildIdSchema,
  userId: DiscordAccountIdSchema,
  visibility: CompetitionVisibilitySchema.optional(),
  maxParticipants: z.number().int().min(2).max(100).optional(),
  addAllMembers: z.boolean().optional(),
});

/**
 * Fixed dates variant with date string validation
 * Supports ISO 8601 formats including timezone information:
 * - YYYY-MM-DD (defaults to midnight local time)
 * - YYYY-MM-DDTHH:mm:ss (local time)
 * - YYYY-MM-DDTHH:mm:ssZ (UTC)
 * - YYYY-MM-DDTHH:mm:ss+HH:mm (with timezone offset)
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
      message: "Invalid date format. Use ISO 8601 format (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, or with timezone Z/+HH:mm)",
      path: ["startDate"],
    },
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start < end;
    },
    {
      message: "Start date must be before end date",
      path: ["startDate"],
    },
  );

/**
 * Season variant using predefined season IDs
 */
const SeasonArgsSchema = z.object({
  dateType: z.literal("SEASON"),
  season: SeasonIdSchema,
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
  // Champion can be provided as string (from autocomplete with ID) or name
  // We'll convert it to championId during parsing
  champion: z.string().min(1),
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
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
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
      champion: interaction.options.getString("champion") ?? undefined,
      minGames: interaction.options.getInteger("min-games") ?? undefined,
      visibility: interaction.options.getString("visibility") ?? undefined,
      maxParticipants: interaction.options.getInteger("max-participants") ?? undefined,
      addAllMembers: interaction.options.getBoolean("add-all-members") ?? undefined,
    });

    console.log(`✅ Command arguments validated successfully`);
    console.log(`📋 Title: "${args.title}", Criteria: ${args.criteriaType}, Channel: ${args.channelId}`);
  } catch (error) {
    console.error(`❌ Invalid command arguments from ${username}:`, error);
    const validationError = fromError(error);
    await interaction.reply({
      content: truncateDiscordMessage(`**Invalid input:**\n${validationError.toString()}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 2: Permission and rate limit checks
  // ============================================================================

  let isAdmin = false;

  try {
    // Get member to check permissions
    const member = await interaction.guild?.members.fetch(userId);
    if (!member) {
      throw new Error("Could not fetch member from guild");
    }

    // Check if user is an admin
    isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

    // If addAllMembers is true, require admin permission
    if (args.addAllMembers && !isAdmin) {
      console.warn(`⚠️  Non-admin ${username} attempted to use add-all-members option`);
      await interaction.reply({
        content: `**Permission denied:**\nThe \`add-all-members\` option requires Administrator permission.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const permissionCheck = await canCreateCompetition(prisma, args.guildId, args.userId, member.permissions);

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
      content: truncateDiscordMessage(`**Error checking permissions:**\n${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // TypeScript narrows the union based on criteriaType!
  const criteria: CompetitionCriteria = match(args.criteriaType)
    .with("MOST_GAMES_PLAYED", () => ({ type: "MOST_GAMES_PLAYED" as const, queue: args.queue }))
    .with("HIGHEST_RANK", () => ({ type: "HIGHEST_RANK" as const, queue: args.queue }))
    .with("MOST_RANK_CLIMB", () => ({ type: "MOST_RANK_CLIMB" as const, queue: args.queue }))
    .with("MOST_WINS_PLAYER", () => ({ type: "MOST_WINS_PLAYER" as const, queue: args.queue }))
    .with("MOST_WINS_CHAMPION", () => {
      // Convert champion string (ID from autocomplete) to number
      // Try parsing as number first (from autocomplete), then try as name
      let championId: number;
      const championIdFromString = Number.parseInt(args.champion, 10);
      if (!isNaN(championIdFromString)) {
        championId = championIdFromString;
      } else {
        // Try looking up by name
        const idFromName = getChampionId(args.champion);
        if (!idFromName) {
          throw new Error(`Invalid champion: "${args.champion}". Please select a champion from the autocomplete list.`);
        }
        championId = idFromName;
      }

      return {
        type: "MOST_WINS_CHAMPION" as const,
        championId: ChampionIdSchema.parse(championId),
        queue: args.queue,
      };
    })
    .with("HIGHEST_WIN_RATE", () => ({
      type: "HIGHEST_WIN_RATE" as const,
      minGames: args.minGames ?? 10,
      queue: args.queue,
    }))
    .exhaustive();

  console.log(`✅ Criteria built:`, criteria);

  // ============================================================================
  // Step 4: Build competition creation input
  // ============================================================================

  let competitionInput: CreateCompetitionInput;

  try {
    // Parse dates - schema already validated format and presence
    const dates: CreateCompetitionInput["dates"] = match(args.dateType)
      .with("FIXED", () => {
        if (!args.startDate || !args.endDate) {
          throw new Error("startDate/endDate required for FIXED (validation error)");
        }
        return {
          type: "FIXED_DATES" as const,
          startDate: new Date(args.startDate),
          endDate: new Date(args.endDate),
        };
      })
      .with("SEASON", () => {
        // Validate season hasn't ended yet
        if (hasSeasonEnded(args.season)) {
          throw new Error(`Cannot create competition for season ${args.season} - this season has already ended`);
        }

        return {
          type: "SEASON" as const,
          seasonId: args.season,
        };
      })
      .exhaustive();

    // args is already validated and has branded types from CommonArgsSchema
    competitionInput = {
      serverId: args.guildId,
      ownerId: args.userId,
      channelId: args.channelId,
      title: args.title,
      description: args.description,
      visibility: args.visibility ?? "OPEN",
      maxParticipants: args.maxParticipants ?? 50,
      dates,
      criteria,
    };

    console.log(`✅ Competition input built (fully type-safe)`);
  } catch (error) {
    console.error(`❌ Failed to build competition input:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`**Invalid competition data:**\n${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 5: Run business validation (limits, etc.)
  // ============================================================================

  try {
    // args.guildId and args.userId are already branded from the schema
    const serverId = args.guildId;

    // Check owner limit (1 active competition per owner)
    // Bot owner bypass is handled automatically via flags system initialized at startup
    await validateOwnerLimit(prisma, serverId, args.userId);

    // Check server limit (2 active competitions per server)
    // Bot owner bypass is handled automatically via flags system initialized at startup
    await validateServerLimit(prisma, serverId, args.userId);

    console.log(`✅ Business validation passed`);
  } catch (error) {
    console.error(`❌ Business validation failed:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`**Validation failed:**\n${getErrorMessage(error)}`),
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

    // ============================================================================
    // Step 7: Add all server members if requested (admin only)
    // ============================================================================

    let addedMembersCount = 0;
    if (args.addAllMembers) {
      console.log(`🔄 Adding all server members to competition ${competition.id.toString()}...`);
      const addMembersStartTime = Date.now();

      try {
        // Fetch all players in this server
        const players = await prisma.player.findMany({
          where: {
            serverId: args.guildId,
          },
          select: {
            id: true,
            alias: true,
            discordId: true,
          },
        });

        console.log(`📊 Found ${players.length.toString()} players in server ${args.guildId}`);

        // Add each player as a participant
        const addResults = await Promise.allSettled(
          players.map((player) => addParticipant(prisma, competition.id, player.id, "JOINED")),
        );

        // Count successful additions
        addedMembersCount = addResults.filter((result) => result.status === "fulfilled").length;

        const failedCount = addResults.filter((result) => result.status === "rejected").length;

        const addMembersTime = Date.now() - addMembersStartTime;
        console.log(
          `✅ Added ${addedMembersCount.toString()}/${players.length.toString()} players to competition (${failedCount.toString()} failed) in ${addMembersTime.toString()}ms`,
        );
      } catch (error) {
        console.error(`❌ Error adding all members to competition:`, error);
        // Don't fail the entire operation - competition was created successfully
        // We'll just mention the error in the response
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`🎉 Competition creation completed successfully in ${totalTime.toString()}ms`);

    // ============================================================================
    // Step 8: Send success response
    // ============================================================================

    const statusEmoji = getStatusEmoji(competition.startDate, competition.endDate);
    const dateInfo = formatDateInfo(competition.startDate, competition.endDate, competition.seasonId);

    // Build success message
    let successMessage = `✅ **Competition Created!**

${statusEmoji} **${competition.title}**
${competition.description}

**ID:** ${competition.id.toString()}
**Type:** ${formatCriteriaType(competition.criteria.type)}
**Visibility:** ${competition.visibility}
**Max Participants:** ${competition.maxParticipants.toString()}`;

    if (args.addAllMembers && addedMembersCount > 0) {
      successMessage += `\n**Members Added:** ${addedMembersCount.toString()} server members automatically joined`;
    }

    successMessage += `\n\n${dateInfo}`;

    if (!args.addAllMembers) {
      successMessage += `\n\nUsers can join with:
\`/competition join competition-id:${competition.id.toString()}\``;
    }

    await interaction.reply({
      content: truncateDiscordMessage(successMessage),
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    console.error(`❌ Database error during competition creation:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`**Error creating competition:**\n${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
  }
}
