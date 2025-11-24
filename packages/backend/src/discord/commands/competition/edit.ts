import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { z } from "zod";
import {
  ChampionIdSchema,
  CompetitionIdSchema,
  CompetitionQueueTypeSchema,
  CompetitionVisibilitySchema,
  DiscordAccountIdSchema,
  DiscordChannelIdSchema,
  SeasonIdSchema,
  getCompetitionStatus,
  type CompetitionCriteria,
} from "@scout-for-lol/data";
import { fromError } from "zod-validation-error";
import { match, P } from "ts-pattern";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import {
  getCompetitionById,
  type UpdateCompetitionInput,
  updateCompetition,
} from "@scout-for-lol/backend/database/competition/queries.js";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";
import { getChampionId } from "@scout-for-lol/backend/utils/champion.js";
import { truncateDiscordMessage } from "@scout-for-lol/backend/discord/utils/message.js";

// ============================================================================
// Input Parsing Schema - Editable Fields
// ============================================================================

/**
 * Fields that can be edited at any time (even after competition starts)
 */
const EditableAlwaysArgsSchema = z.object({
  competitionId: z.number().int().positive(),
  userId: DiscordAccountIdSchema,
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  channelId: DiscordChannelIdSchema.optional(),
});

/**
 * Fields that can ONLY be edited before competition starts (DRAFT status)
 */
const EditableDraftOnlyArgsSchema = z.object({
  visibility: CompetitionVisibilitySchema.optional(),
  maxParticipants: z.number().int().min(2).max(100).optional(),
});

/**
 * Date-related fields that can ONLY be edited in DRAFT status
 */
const FixedDatesEditArgsSchema = z
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

const SeasonEditArgsSchema = z.object({
  dateType: z.literal("SEASON"),
  season: SeasonIdSchema,
});

/**
 * Criteria-specific edit schemas (same as create, but all optional at the args level)
 */
const MostGamesPlayedEditArgsSchema = z.object({
  criteriaType: z.literal("MOST_GAMES_PLAYED"),
  queue: CompetitionQueueTypeSchema,
});

const HighestRankEditArgsSchema = z.object({
  criteriaType: z.literal("HIGHEST_RANK"),
  queue: z.enum(["SOLO", "FLEX"]),
});

const MostRankClimbEditArgsSchema = z.object({
  criteriaType: z.literal("MOST_RANK_CLIMB"),
  queue: z.enum(["SOLO", "FLEX"]),
});

const MostWinsPlayerEditArgsSchema = z.object({
  criteriaType: z.literal("MOST_WINS_PLAYER"),
  queue: CompetitionQueueTypeSchema,
});

const MostWinsChampionEditArgsSchema = z.object({
  criteriaType: z.literal("MOST_WINS_CHAMPION"),
  champion: z.string().min(1),
  queue: CompetitionQueueTypeSchema.optional(),
});

const HighestWinRateEditArgsSchema = z.object({
  criteriaType: z.literal("HIGHEST_WIN_RATE"),
  queue: CompetitionQueueTypeSchema,
  minGames: z.number().int().positive().optional(),
});

/**
 * Combined schema for all possible edit arguments
 * This allows any combination of fields to be provided
 */
const EditCommandArgsBaseSchema = EditableAlwaysArgsSchema.and(EditableDraftOnlyArgsSchema);

// Union of all possible criteria edit schemas
const CriteriaEditSchema = z
  .union([
    MostGamesPlayedEditArgsSchema,
    HighestRankEditArgsSchema,
    MostRankClimbEditArgsSchema,
    MostWinsPlayerEditArgsSchema,
    MostWinsChampionEditArgsSchema,
    HighestWinRateEditArgsSchema,
  ])
  .optional();

// Union of date edit schemas
type DatesEditSchema = z.infer<typeof z.union([FixedDatesEditArgsSchema, SeasonEditArgsSchema]).optional()>;

type EditCommandArgs = z.infer<typeof EditCommandArgsBaseSchema> & {
  dates?: DatesEditSchema;
  criteria?: z.infer<typeof CriteriaEditSchema>;
};

// ============================================================================
// Command Execution
// ============================================================================

/**
 * Execute /competition edit command
 */
export async function executeCompetitionEdit(interaction: ChatInputCommandInteraction): Promise<void> {
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
  const username = interaction.user.username;

  console.log(`📝 Starting competition edit for user ${username} (${userId})`);

  // ============================================================================
  // Step 1: Parse competition ID and fetch competition
  // ============================================================================

  const competitionId = CompetitionIdSchema.parse(interaction.options.getInteger("competition-id", true));

  let competition;
  try {
    competition = await getCompetitionById(prisma, competitionId);
  } catch (error) {
    console.error(`❌ Error fetching competition ${competitionId.toString()}:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`**Error fetching competition:**\n${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!competition) {
    await interaction.reply({
      content: `Competition with ID ${competitionId.toString()} not found`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 2: Check ownership
  // ============================================================================

  if (competition.ownerId !== userId) {
    await interaction.reply({
      content: "Only the competition owner can edit the competition",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 3: Check competition status
  // ============================================================================

  const status = getCompetitionStatus(competition);

  if (status === "CANCELLED") {
    await interaction.reply({
      content: "Cannot edit a cancelled competition",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const isDraft = status === "DRAFT";

  console.log(`📊 Competition status: ${status} (isDraft: ${isDraft.toString()})`);

  // ============================================================================
  // Step 4: Parse and validate edit arguments
  // ============================================================================

  let args: EditCommandArgs;

  try {
    // Parse Discord options
    const title = interaction.options.getString("title");
    const description = interaction.options.getString("description");
    const channelId = interaction.options.getChannel("channel")?.id;
    const visibility = interaction.options.getString("visibility");
    const maxParticipants = interaction.options.getInteger("max-participants");

    // Date fields
    const startDateStr = interaction.options.getString("start-date");
    const endDateStr = interaction.options.getString("end-date");
    const seasonStr = interaction.options.getString("season");

    // Criteria fields
    const criteriaType = interaction.options.getString("criteria-type");
    const queue = interaction.options.getString("queue");
    const champion = interaction.options.getString("champion");
    const minGames = interaction.options.getInteger("min-games");

    // Build args object, only including non-null fields to avoid Zod validation issues
    // Discord returns null for unset optional fields, but Zod expects undefined
    const baseArgsInput: Record<string, unknown> = {
      competitionId,
      userId,
    };

    if (title !== null) {
      baseArgsInput["title"] = title;
    }
    if (description !== null) {
      baseArgsInput["description"] = description;
    }
    if (channelId !== undefined) {
      baseArgsInput["channelId"] = channelId;
    }
    if (visibility !== null) {
      baseArgsInput["visibility"] = visibility;
    }
    if (maxParticipants !== null) {
      baseArgsInput["maxParticipants"] = maxParticipants;
    }

    // Validate base args (always editable fields)
    const baseArgs = EditCommandArgsBaseSchema.parse(baseArgsInput);

    args = { ...baseArgs };

    // Parse dates if provided
    if (startDateStr !== null || endDateStr !== null || seasonStr !== null) {
      if (!isDraft) {
        throw new Error("Cannot change dates after competition has started");
      }

      const hasFixedDates = startDateStr !== null && endDateStr !== null;
      const hasSeason = seasonStr !== null;

      if (!hasFixedDates && !hasSeason) {
        throw new Error("Must specify either (start-date AND end-date) OR season");
      }
      if (hasFixedDates && hasSeason) {
        throw new Error("Cannot specify both fixed dates and season");
      }

      if (hasFixedDates) {
        args.dates = FixedDatesEditArgsSchema.parse({
          dateType: "FIXED",
          startDate: startDateStr,
          endDate: endDateStr,
        });
      } else {
        args.dates = SeasonEditArgsSchema.parse({
          dateType: "SEASON",
          season: seasonStr,
        });
      }
    }

    // Parse criteria if provided
    if (criteriaType !== null) {
      if (!isDraft) {
        throw new Error("Cannot change criteria after competition has started");
      }

      // Build criteria input, only including non-null fields
      const criteriaInput: Record<string, unknown> = {
        criteriaType,
      };
      if (queue !== null) {
        criteriaInput["queue"] = queue;
      }
      if (champion !== null) {
        criteriaInput["champion"] = champion;
      }
      if (minGames !== null) {
        criteriaInput["minGames"] = minGames;
      }

      args.criteria = CriteriaEditSchema.parse(criteriaInput);
    }

    // Check if DRAFT-only fields are provided when not in DRAFT
    if (!isDraft) {
      if (visibility !== null) {
        throw new Error("Cannot change visibility after competition has started");
      }
      if (maxParticipants !== null) {
        throw new Error("Cannot change max participants after competition has started");
      }
    }

    console.log(`✅ Edit arguments validated successfully`);
  } catch (error) {
    console.error(`❌ Invalid edit arguments from ${username}:`, error);
    const validationError = fromError(error);
    await interaction.reply({
      content: truncateDiscordMessage(`**Invalid input:**\n${validationError.toString()}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 5: Build update input
  // ============================================================================

  const updateInput: UpdateCompetitionInput = {};

  // Always-editable fields
  if (args.title !== undefined) {
    updateInput.title = args.title;
  }
  if (args.description !== undefined) {
    updateInput.description = args.description;
  }
  if (args.channelId !== undefined) {
    updateInput.channelId = args.channelId;
  }

  // DRAFT-only fields
  if (isDraft) {
    if (args.visibility !== undefined) {
      updateInput.visibility = args.visibility;
    }
    if (args.maxParticipants !== undefined) {
      updateInput.maxParticipants = args.maxParticipants;
    }

    // Dates
    if (args.dates !== undefined) {
      updateInput.dates = match(args.dates)
        .with({ dateType: "FIXED" }, (narrowedDates) => ({
          type: "FIXED_DATES" as const,
          startDate: new Date(narrowedDates.startDate),
          endDate: new Date(narrowedDates.endDate),
        }))
        .with({ dateType: "SEASON" }, (narrowedDates) => ({
          type: "SEASON" as const,
          seasonId: narrowedDates.season,
        }))
        .exhaustive();
    }

    // Criteria
    if (args.criteria !== undefined) {
      const criteria: CompetitionCriteria = match(args.criteria)
        .with({ criteriaType: "MOST_GAMES_PLAYED", queue: P.select() }, (queue) => ({
          type: "MOST_GAMES_PLAYED" as const,
          queue,
        }))
        .with({ criteriaType: "HIGHEST_RANK", queue: P.select() }, (queue) => ({
          type: "HIGHEST_RANK" as const,
          queue,
        }))
        .with({ criteriaType: "MOST_RANK_CLIMB", queue: P.select() }, (queue) => ({
          type: "MOST_RANK_CLIMB" as const,
          queue,
        }))
        .with({ criteriaType: "MOST_WINS_PLAYER", queue: P.select() }, (queue) => ({
          type: "MOST_WINS_PLAYER" as const,
          queue,
        }))
        .with({ criteriaType: "MOST_WINS_CHAMPION" }, (narrowedCriteria) => {
          // Convert champion string to number
          let championId: number;
          const championIdFromString = Number.parseInt(narrowedCriteria.champion, 10);
          if (!isNaN(championIdFromString)) {
            championId = championIdFromString;
          } else {
            const idFromName = getChampionId(narrowedCriteria.champion);
            if (!idFromName) {
              throw new Error(
                `Invalid champion: "${narrowedCriteria.champion}". Please select a champion from the autocomplete list.`,
              );
            }
            championId = idFromName;
          }

          return {
            type: "MOST_WINS_CHAMPION" as const,
            championId: ChampionIdSchema.parse(championId),
            queue: narrowedCriteria.queue,
          };
        })
        .with({ criteriaType: "HIGHEST_WIN_RATE" }, (narrowedCriteria) => ({
          type: "HIGHEST_WIN_RATE" as const,
          minGames: narrowedCriteria.minGames ?? 10,
          queue: narrowedCriteria.queue,
        }))
        .exhaustive();

      updateInput.criteria = criteria;
    }
  }

  // Check if any fields were actually provided
  if (Object.keys(updateInput).length === 0) {
    await interaction.reply({
      content: "No fields to update. Please provide at least one field to edit.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  console.log(`✅ Update input built:`, updateInput);

  // ============================================================================
  // Step 6: Update competition in database
  // ============================================================================

  try {
    const updatedCompetition = await updateCompetition(prisma, competitionId, updateInput);

    console.log(`✅ Competition ${competitionId.toString()} updated successfully`);

    // Build response message
    const updatedFields: string[] = [];
    if (updateInput.title !== undefined) {
      updatedFields.push("Title");
    }
    if (updateInput.description !== undefined) {
      updatedFields.push("Description");
    }
    if (updateInput.channelId !== undefined) {
      updatedFields.push("Channel");
    }
    if (updateInput.visibility !== undefined) {
      updatedFields.push("Visibility");
    }
    if (updateInput.maxParticipants !== undefined) {
      updatedFields.push("Max Participants");
    }
    if (updateInput.dates !== undefined) {
      updatedFields.push("Dates");
    }
    if (updateInput.criteria !== undefined) {
      updatedFields.push("Criteria");
    }

    await interaction.reply({
      content: truncateDiscordMessage(`✅ **Competition Updated!**

**${updatedCompetition.title}**

**Updated fields:** ${updatedFields.join(", ")}

View the competition with:
\`/competition view competition-id:${competitionId.toString()}\``),
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    console.error(`❌ Database error during competition edit:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`**Error updating competition:**\n${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
  }
}
