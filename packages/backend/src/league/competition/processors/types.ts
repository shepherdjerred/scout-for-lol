import type { Rank } from "@scout-for-lol/data";

/**
 * Player with their accounts from Prisma
 * This is what we get from fetching participants with their accounts
 */
export type PlayerWithAccounts = {
  id: number;
  alias: string;
  discordId: string | null;
  accounts: {
    id: number;
    alias: string;
    puuid: string;
    region: string;
  }[];
};

/**
 * Leaderboard entry returned by processors
 */
export type LeaderboardEntry = {
  playerId: number;
  playerName: string;
  score: number | Rank;
  metadata?: Record<string, unknown>;
};
