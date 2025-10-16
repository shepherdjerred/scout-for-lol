import type { PrismaClient } from "../../generated/prisma/client/index.js";

/**
 * Record a permission error for a guild/channel
 * Updates existing record or creates new one
 */
export async function recordPermissionError(
  prisma: PrismaClient,
  serverId: string,
  channelId: string,
  errorType: string,
  errorReason?: string,
): Promise<void> {
  const now = new Date();

  // Try to find existing error record
  const existing = await prisma.guildPermissionError.findUnique({
    where: {
      serverId_channelId: {
        serverId,
        channelId,
      },
    },
  });

  if (existing) {
    // Update existing record - increment error count
    await prisma.guildPermissionError.update({
      where: {
        serverId_channelId: {
          serverId,
          channelId,
        },
      },
      data: {
        lastOccurrence: now,
        consecutiveErrorCount: existing.consecutiveErrorCount + 1,
        errorType,
        errorReason: errorReason ?? existing.errorReason,
      },
    });
  } else {
    // Create new error record
    await prisma.guildPermissionError.create({
      data: {
        serverId,
        channelId,
        errorType,
        errorReason: errorReason ?? null,
        firstOccurrence: now,
        lastOccurrence: now,
        consecutiveErrorCount: 1,
      },
    });
  }
}

/**
 * Record a successful message send - resets error count
 */
export async function recordSuccessfulSend(prisma: PrismaClient, serverId: string, channelId: string): Promise<void> {
  const now = new Date();

  // Check if there's an existing error record
  const existing = await prisma.guildPermissionError.findUnique({
    where: {
      serverId_channelId: {
        serverId,
        channelId,
      },
    },
  });

  if (existing) {
    // Reset the error count and update last successful send
    await prisma.guildPermissionError.update({
      where: {
        serverId_channelId: {
          serverId,
          channelId,
        },
      },
      data: {
        consecutiveErrorCount: 0,
        lastSuccessfulSend: now,
      },
    });
  } else {
    // Create a record with successful send
    await prisma.guildPermissionError.create({
      data: {
        serverId,
        channelId,
        errorType: "none",
        firstOccurrence: now,
        lastOccurrence: now,
        consecutiveErrorCount: 0,
        lastSuccessfulSend: now,
      },
    });
  }
}

/**
 * Get guilds that have had consecutive permission errors for more than a specified duration
 * @param minDays - Minimum number of days of consecutive errors (default: 7)
 * @returns List of abandoned guilds
 */
export async function getAbandonedGuilds(
  prisma: PrismaClient,
  minDays: number = 7,
): Promise<Array<{ serverId: string; firstOccurrence: Date; lastOccurrence: Date; errorCount: number }>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - minDays);

  const errors = await prisma.guildPermissionError.findMany({
    where: {
      // Has errors
      consecutiveErrorCount: {
        gt: 0,
      },
      // First error was more than minDays ago
      firstOccurrence: {
        lte: cutoffDate,
      },
      // Has NOT been successfully sent to recently (or never)
      OR: [
        {
          lastSuccessfulSend: null,
        },
        {
          lastSuccessfulSend: {
            lte: cutoffDate,
          },
        },
      ],
      // Owner hasn't been notified about abandonment yet
      ownerNotified: false,
    },
  });

  // Group by serverId and aggregate
  const guilds = new Map<
    string,
    { serverId: string; firstOccurrence: Date; lastOccurrence: Date; errorCount: number }
  >();

  for (const error of errors) {
    const existing = guilds.get(error.serverId);
    if (!existing) {
      guilds.set(error.serverId, {
        serverId: error.serverId,
        firstOccurrence: error.firstOccurrence,
        lastOccurrence: error.lastOccurrence,
        errorCount: error.consecutiveErrorCount,
      });
    } else {
      // Update with earliest first occurrence and latest last occurrence
      if (error.firstOccurrence < existing.firstOccurrence) {
        existing.firstOccurrence = error.firstOccurrence;
      }
      if (error.lastOccurrence > existing.lastOccurrence) {
        existing.lastOccurrence = error.lastOccurrence;
      }
      existing.errorCount += error.consecutiveErrorCount;
    }
  }

  return Array.from(guilds.values());
}

/**
 * Mark a guild as having been notified about abandonment
 */
export async function markGuildAsNotified(prisma: PrismaClient, serverId: string): Promise<void> {
  await prisma.guildPermissionError.updateMany({
    where: {
      serverId,
    },
    data: {
      ownerNotified: true,
    },
  });
}

/**
 * Clean up old error records (optional maintenance)
 * Removes records that have been successfully resolved for more than 30 days
 */
export async function cleanupOldErrorRecords(prisma: PrismaClient): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  const result = await prisma.guildPermissionError.deleteMany({
    where: {
      consecutiveErrorCount: 0,
      lastSuccessfulSend: {
        lte: cutoffDate,
      },
    },
  });

  return result.count;
}
