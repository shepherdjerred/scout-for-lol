import {
  type CompetitionCriteria,
  type CompetitionVisibility,
  type CompetitionWithCriteria,
  type DiscordAccountId,
  type DiscordChannelId,
  type DiscordGuildId,
  type SeasonId,
  parseCompetition,
} from "@scout-for-lol/data";
import { type PrismaClient } from "../../../generated/prisma/client/index.js";
import { type CompetitionDates } from "./validation.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Input for creating a competition
 * This is the simplified type used by query functions (not validation schema)
 */
export type CreateCompetitionInput = {
  serverId: DiscordGuildId;
  ownerId: DiscordAccountId;
  channelId: DiscordChannelId;
  title: string;
  description: string;
  visibility: CompetitionVisibility;
  maxParticipants: number;
  dates: CompetitionDates;
  criteria: CompetitionCriteria;
};

// ============================================================================
// Create
// ============================================================================

/**
 * Create a new competition in the database
 *
 * @param prisma - Prisma client instance
 * @param input - Competition creation input with parsed criteria
 * @returns Created competition with parsed criteria
 */
export async function createCompetition(
  prisma: PrismaClient,
  input: CreateCompetitionInput,
): Promise<CompetitionWithCriteria> {
  const now = new Date();

  // Extract dates based on type
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let seasonId: SeasonId | null = null;

  if (input.dates.type === "FIXED_DATES") {
    startDate = input.dates.startDate;
    endDate = input.dates.endDate;
  } else {
    seasonId = input.dates.seasonId;
  }

  // Separate type from config for storage
  const { type: criteriaType, ...criteriaConfig } = input.criteria;

  const raw = await prisma.competition.create({
    data: {
      serverId: input.serverId,
      ownerId: input.ownerId,
      title: input.title,
      description: input.description,
      channelId: input.channelId,
      isCancelled: false,
      visibility: input.visibility,
      criteriaType,
      criteriaConfig: JSON.stringify(criteriaConfig),
      maxParticipants: input.maxParticipants,
      startDate,
      endDate,
      seasonId,
      creatorDiscordId: input.ownerId,
      createdTime: now,
      updatedTime: now,
    },
  });

  // parseCompetition transparently populates dates from seasonId
  return parseCompetition(raw);
}

// ============================================================================
// Read
// ============================================================================

/**
 * Get competition by ID
 *
 * @param prisma - Prisma client instance
 * @param id - Competition ID
 * @returns Competition with parsed criteria, or null if not found
 */
export async function getCompetitionById(
  prisma: PrismaClient,
  id: number,
): Promise<CompetitionWithCriteria | undefined> {
  const raw = await prisma.competition.findUnique({
    where: { id },
  });

  if (!raw) {
    return undefined;
  }

  // parseCompetition transparently populates dates from seasonId
  return parseCompetition(raw);
}

/**
 * Get all competitions for a server
 *
 * @param prisma - Prisma client instance
 * @param serverId - Discord server ID
 * @param options - Filter options
 * @returns Array of competitions with parsed criteria
 */
export async function getCompetitionsByServer(
  prisma: PrismaClient,
  serverId: DiscordGuildId,
  options?: {
    activeOnly?: boolean;
    ownerId?: DiscordAccountId;
  },
): Promise<CompetitionWithCriteria[]> {
  const now = new Date();

  const raw = await prisma.competition.findMany({
    where: {
      serverId,
      ...(options?.ownerId && { ownerId: options.ownerId }),
      ...(options?.activeOnly && {
        isCancelled: false,
        OR: [
          { endDate: null }, // Season-based, no end date
          { endDate: { gt: now } }, // Fixed dates, not ended yet
        ],
      }),
    },
    orderBy: {
      createdTime: "desc",
    },
  });

  // parseCompetition transparently populates dates from seasonId
  return raw.map(parseCompetition);
}

/**
 * Get all active competitions across all servers
 * Used for cron jobs that need to process all active competitions
 *
 * @param prisma - Prisma client instance
 * @returns Array of active competitions with parsed criteria
 */
export async function getActiveCompetitions(prisma: PrismaClient): Promise<CompetitionWithCriteria[]> {
  const now = new Date();

  const raw = await prisma.competition.findMany({
    where: {
      isCancelled: false,
      OR: [
        { endDate: null }, // Season-based, no end date
        { endDate: { gt: now } }, // Fixed dates, not ended yet
      ],
    },
    orderBy: {
      createdTime: "desc",
    },
  });

  // parseCompetition transparently populates dates from seasonId
  return raw.map(parseCompetition);
}

// ============================================================================
// Update
// ============================================================================

/**
 * Input for updating a competition
 * All fields are optional - only provided fields will be updated
 */
export type UpdateCompetitionInput = {
  title?: string;
  description?: string;
  channelId?: DiscordChannelId;
  visibility?: CompetitionVisibility;
  maxParticipants?: number;
  dates?: CompetitionDates;
  criteria?: CompetitionCriteria;
};

/**
 * Update a competition
 *
 * @param prisma - Prisma client instance
 * @param id - Competition ID
 * @param input - Fields to update
 * @returns Updated competition with parsed criteria
 * @throws {Error} if competition not found
 */
export async function updateCompetition(
  prisma: PrismaClient,
  id: number,
  input: UpdateCompetitionInput,
): Promise<CompetitionWithCriteria> {
  const now = new Date();

  // Build update data object
  const updateData: {
    title?: string;
    description?: string;
    channelId?: DiscordChannelId;
    visibility?: CompetitionVisibility;
    maxParticipants?: number;
    startDate?: Date | null;
    endDate?: Date | null;
    seasonId?: SeasonId | null;
    criteriaType?: CompetitionCriteria["type"];
    criteriaConfig?: string;
    updatedTime: Date;
  } = {
    updatedTime: now,
  };

  // Add simple fields if provided
  if (input.title !== undefined) {
    updateData.title = input.title;
  }
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  if (input.channelId !== undefined) {
    updateData.channelId = input.channelId;
  }
  if (input.visibility !== undefined) {
    updateData.visibility = input.visibility;
  }
  if (input.maxParticipants !== undefined) {
    updateData.maxParticipants = input.maxParticipants;
  }

  // Handle dates if provided
  if (input.dates !== undefined) {
    if (input.dates.type === "FIXED_DATES") {
      updateData.startDate = input.dates.startDate;
      updateData.endDate = input.dates.endDate;
      updateData.seasonId = null;
    } else {
      updateData.startDate = null;
      updateData.endDate = null;
      updateData.seasonId = input.dates.seasonId;
    }
  }

  // Handle criteria if provided
  if (input.criteria !== undefined) {
    const { type: criteriaType, ...criteriaConfig } = input.criteria;
    updateData.criteriaType = criteriaType;
    updateData.criteriaConfig = JSON.stringify(criteriaConfig);
  }

  const raw = await prisma.competition.update({
    where: { id },
    data: updateData,
  });

  // parseCompetition transparently populates dates from seasonId
  return parseCompetition(raw);
}

/**
 * Cancel a competition by setting isCancelled flag
 *
 * @param prisma - Prisma client instance
 * @param id - Competition ID
 * @returns Updated competition with parsed criteria
 * @throws {Error} if competition not found
 */
export async function cancelCompetition(prisma: PrismaClient, id: number): Promise<CompetitionWithCriteria> {
  const now = new Date();

  const raw = await prisma.competition.update({
    where: { id },
    data: {
      isCancelled: true,
      updatedTime: now,
    },
  });

  // parseCompetition transparently populates dates from seasonId
  return parseCompetition(raw);
}
