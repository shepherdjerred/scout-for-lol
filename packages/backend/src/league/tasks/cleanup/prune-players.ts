import type {
  PrismaClient,
  Player,
  Subscription,
  CompetitionParticipant,
  Account,
} from "../../../../generated/prisma/client/index.js";
import { prisma } from "../../../database/index.js";
import type { Client } from "discord.js";
import { groupBy } from "remeda";

type PlayerWithRelations = Player & {
  subscriptions: Subscription[];
  competitionParticipants: CompetitionParticipant[];
  accounts: Account[];
};

type PruneResult = {
  totalPlayersPruned: number;
  totalAccountsDeleted: number;
  totalParticipantsDeleted: number;
  totalSnapshotsDeleted: number;
  serverSummaries: {
    serverId: string;
    playersPruned: number;
    accountsDeleted: number;
    playerDetails: {
      alias: string;
      accountCount: number;
      hadLeftCompetitions: boolean;
      hadPendingInvites: boolean;
    }[];
  }[];
};

/**
 * Send notification to server owner about pruned players
 */
async function notifyServerOwner(
  discordClient: Client | null,
  serverId: string,
  playerDetails: PruneResult["serverSummaries"][0]["playerDetails"],
): Promise<void> {
  if (!discordClient) {
    console.log(`[PlayerPruning] Discord client not available, skipping notification for server ${serverId}`);
    return;
  }

  try {
    console.log(`[PlayerPruning] Attempting to notify server ${serverId} owner about pruned players`);

    // Discord.js fetch methods throw on error rather than returning null
    const guild = await discordClient.guilds.fetch(serverId);
    const owner = await guild.fetchOwner();

    const playerList = playerDetails
      .map((player) => {
        const reasons = [];
        if (player.hadLeftCompetitions) reasons.push("left competition");
        if (player.hadPendingInvites) reasons.push("pending invite");
        if (reasons.length === 0) reasons.push("no subscriptions");

        const reasonStr = reasons.length > 0 ? ` (${reasons.join(", ")})` : "";
        return `• **${player.alias}** - ${player.accountCount.toString()} account(s)${reasonStr}`;
      })
      .join("\n");

    const totalAccounts = playerDetails.reduce((sum, p) => sum + p.accountCount, 0);

    await owner.send({
      content: `🧹 **Automatic Player Cleanup Report**

Your server had **${playerDetails.length.toString()} player(s)** and **${totalAccounts.toString()} account(s)** automatically removed from Scout for LoL's database because they were no longer being tracked.

**Players Removed:**
${playerList}

**Why were they removed?**
Players are automatically pruned when:
• They have no active subscriptions in any channel
• They are not actively participating (JOINED status) in any competition

**Note:** Players who left competitions or had pending invites but never joined are eligible for cleanup. Players actively participating in competitions are always kept.

If you want to track these players again, simply re-subscribe to them using \`/subscribe\`.

*This is an automated cleanup to keep the database efficient.*`,
    });

    console.log(`[PlayerPruning] ✅ Successfully notified owner of server ${serverId}`);
  } catch (error) {
    console.warn(`[PlayerPruning] Failed to notify owner of server ${serverId}:`, error);
    // Don't throw - notification failure shouldn't break pruning
  }
}

/**
 * Prune players that have no active subscriptions and no active competition participations
 *
 * A player is considered "orphaned" if:
 * - They have no subscriptions
 * - They have no competition participations with status 'JOINED'
 *
 * **Important:** Players who are actively JOINED in competitions are NEVER pruned.
 * However, players who LEFT or were only INVITED (never joined) are considered orphaned.
 *
 * When we prune a player, we also delete:
 * - Their accounts (cascade)
 * - Their competition snapshots (cascade)
 * - Any competition participations with status 'INVITED' or 'LEFT' (cascade)
 */
export async function pruneOrphanedPlayers(
  prismaClient: PrismaClient = prisma,
  notifyOwners = true,
  discordClient: Client | null = null,
): Promise<PruneResult> {
  const startTime = Date.now();
  console.log("[PlayerPruning] ============================================");
  console.log("[PlayerPruning] Starting orphaned player pruning");
  console.log(`[PlayerPruning] Timestamp: ${new Date().toISOString()}`);
  console.log(`[PlayerPruning] Notify owners: ${notifyOwners ? "YES" : "NO"}`);
  console.log("[PlayerPruning] ============================================");

  try {
    // Find all players
    const allPlayers = await prismaClient.player.findMany({
      include: {
        subscriptions: true,
        competitionParticipants: true,
        accounts: true,
      },
    });

    console.log(`[PlayerPruning] 📊 Found ${allPlayers.length.toString()} total players in database`);

    // Filter players that should be pruned
    const orphanedPlayers = allPlayers.filter((player: PlayerWithRelations) => {
      const hasSubscriptions = player.subscriptions.length > 0;
      const hasActiveCompetitions = player.competitionParticipants.some(
        (participant: CompetitionParticipant) => participant.status === "JOINED",
      );

      return !hasSubscriptions && !hasActiveCompetitions;
    });

    console.log(`[PlayerPruning] 🔍 Analysis complete:`);
    console.log(`[PlayerPruning]   - Orphaned players: ${orphanedPlayers.length.toString()}`);
    console.log(`[PlayerPruning]   - Active players: ${(allPlayers.length - orphanedPlayers.length).toString()}`);

    if (orphanedPlayers.length === 0) {
      console.log("[PlayerPruning] ✅ No players to prune - database is clean!");
      console.log("[PlayerPruning] ============================================");
      return {
        totalPlayersPruned: 0,
        totalAccountsDeleted: 0,
        totalParticipantsDeleted: 0,
        totalSnapshotsDeleted: 0,
        serverSummaries: [],
      };
    }

    // Group by server for reporting
    const playersByServer = groupBy(orphanedPlayers, (player) => player.serverId);
    console.log(`[PlayerPruning] 🌐 Players span ${Object.keys(playersByServer).length.toString()} server(s)`);

    // Log detailed information about each player being pruned
    console.log(`[PlayerPruning] 📋 Detailed player information:`);
    for (const player of orphanedPlayers) {
      const leftCompetitions = player.competitionParticipants.filter((p) => p.status === "LEFT").length;
      const pendingInvites = player.competitionParticipants.filter((p) => p.status === "INVITED").length;

      console.log(`[PlayerPruning]   ┌─ Player: ${player.alias}`);
      console.log(`[PlayerPruning]   ├─ ID: ${player.id.toString()}`);
      console.log(`[PlayerPruning]   ├─ Server: ${player.serverId}`);
      console.log(`[PlayerPruning]   ├─ Accounts: ${player.accounts.length.toString()}`);
      console.log(`[PlayerPruning]   ├─ Left competitions: ${leftCompetitions.toString()}`);
      console.log(`[PlayerPruning]   ├─ Pending invites: ${pendingInvites.toString()}`);
      console.log(`[PlayerPruning]   ├─ Subscriptions: 0 (none)`);
      console.log(`[PlayerPruning]   └─ Status: ELIGIBLE FOR PRUNING`);
    }

    // Delete orphaned players and their related data
    console.log(`[PlayerPruning] 🗑️  Starting deletion process...`);
    const playerIds = orphanedPlayers.map((player: PlayerWithRelations) => player.id);

    // Delete in order: accounts first, then competition data, then players
    const accountsDeleted = await prismaClient.account.deleteMany({
      where: {
        playerId: {
          in: playerIds,
        },
      },
    });
    console.log(`[PlayerPruning]   ✓ Deleted ${accountsDeleted.count.toString()} accounts`);

    const participantsDeleted = await prismaClient.competitionParticipant.deleteMany({
      where: {
        playerId: {
          in: playerIds,
        },
      },
    });
    console.log(`[PlayerPruning]   ✓ Deleted ${participantsDeleted.count.toString()} competition participants`);

    const snapshotsDeleted = await prismaClient.competitionSnapshot.deleteMany({
      where: {
        playerId: {
          in: playerIds,
        },
      },
    });
    console.log(`[PlayerPruning]   ✓ Deleted ${snapshotsDeleted.count.toString()} competition snapshots`);

    const playersDeleted = await prismaClient.player.deleteMany({
      where: {
        id: {
          in: playerIds,
        },
      },
    });
    console.log(`[PlayerPruning]   ✓ Deleted ${playersDeleted.count.toString()} players`);

    // Prepare server summaries
    const serverSummaries = Object.entries(playersByServer).map(([serverId, players]) => {
      const playerDetails = players.map((player) => ({
        alias: player.alias,
        accountCount: player.accounts.length,
        hadLeftCompetitions: player.competitionParticipants.some((p) => p.status === "LEFT"),
        hadPendingInvites: player.competitionParticipants.some((p) => p.status === "INVITED"),
      }));

      const accountsDeleted = players.reduce((sum, p) => sum + p.accounts.length, 0);

      return {
        serverId,
        playersPruned: players.length,
        accountsDeleted,
        playerDetails,
      };
    });

    // Notify server owners
    if (notifyOwners && discordClient) {
      console.log(`[PlayerPruning] 📬 Sending notifications to server owners...`);
      for (const summary of serverSummaries) {
        await notifyServerOwner(discordClient, summary.serverId, summary.playerDetails);
      }
    } else if (notifyOwners && !discordClient) {
      console.warn(`[PlayerPruning] ⚠️  Notifications requested but Discord client not provided`);
    }

    const duration = Date.now() - startTime;
    console.log(`[PlayerPruning] ============================================`);
    console.log(`[PlayerPruning] ✅ PRUNING COMPLETE`);
    console.log(`[PlayerPruning]   - Duration: ${duration.toString()}ms`);
    console.log(`[PlayerPruning]   - Players pruned: ${playersDeleted.count.toString()}`);
    console.log(`[PlayerPruning]   - Accounts deleted: ${accountsDeleted.count.toString()}`);
    console.log(`[PlayerPruning]   - Participants deleted: ${participantsDeleted.count.toString()}`);
    console.log(`[PlayerPruning]   - Snapshots deleted: ${snapshotsDeleted.count.toString()}`);
    console.log(`[PlayerPruning]   - Servers affected: ${serverSummaries.length.toString()}`);
    console.log(`[PlayerPruning]   - Owners notified: ${notifyOwners ? "YES" : "NO"}`);
    console.log(`[PlayerPruning] ============================================`);

    return {
      totalPlayersPruned: playersDeleted.count,
      totalAccountsDeleted: accountsDeleted.count,
      totalParticipantsDeleted: participantsDeleted.count,
      totalSnapshotsDeleted: snapshotsDeleted.count,
      serverSummaries,
    };
  } catch (error) {
    console.error("[PlayerPruning] ❌ Error pruning orphaned players:", error);
    throw error;
  }
}

/**
 * Run the player pruning task
 * This function is called by the cron job
 */
export async function runPlayerPruning(): Promise<void> {
  console.log("[PlayerPruning] 🚀 Starting scheduled player pruning task");

  try {
    // Lazy import Discord client to avoid circular dependencies and test issues
    const { client } = await import("../../../discord/client.js");

    const result = await pruneOrphanedPlayers(prisma, true, client);
    console.log(`[PlayerPruning] ✅ Scheduled player pruning complete`);
    console.log(
      `[PlayerPruning]   Summary: ${result.totalPlayersPruned.toString()} players, ${result.totalAccountsDeleted.toString()} accounts`,
    );
  } catch (error) {
    console.error("[PlayerPruning] ❌ Scheduled player pruning failed:", error);
    throw error; // Re-throw so cron job can track failures
  }
}
