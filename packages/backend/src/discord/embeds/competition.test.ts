import { describe, expect, it } from "bun:test";
import { Colors } from "discord.js";
import type { CompetitionWithCriteria } from "@scout-for-lol/data";
import type { RankedLeaderboardEntry } from "../../league/competition/leaderboard.js";
import {
  generateLeaderboardEmbed,
  generateCompetitionDetailsEmbed,
  formatCriteriaDescription,
  formatScore,
} from "./competition.js";

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Create a test competition with sensible defaults
 */
function createTestCompetition(overrides: Partial<CompetitionWithCriteria> = {}): CompetitionWithCriteria {
  return {
    id: 1,
    serverId: "test-server-123",
    ownerId: "owner-discord-id-123",
    title: "Test Competition",
    description: "A test competition for unit tests",
    channelId: "test-channel-456",
    isCancelled: false,
    visibility: "OPEN",
    maxParticipants: 50,
    startDate: new Date("2025-01-01T00:00:00Z"),
    endDate: new Date("2025-01-31T23:59:59Z"),
    seasonId: null,
    creatorDiscordId: "creator-discord-id-789",
    createdTime: new Date("2024-12-01T00:00:00Z"),
    updatedTime: new Date("2024-12-01T00:00:00Z"),
    criteria: {
      type: "MOST_GAMES_PLAYED",
      queue: "SOLO",
    },
    ...overrides,
  };
}

/**
 * Create a test leaderboard entry
 */
function createTestLeaderboardEntry(
  rank: number,
  score: number,
  playerName: string,
  metadata?: Record<string, unknown>,
): RankedLeaderboardEntry {
  const entry: RankedLeaderboardEntry = {
    playerId: rank,
    playerName,
    score,
    rank,
  };

  // Only add metadata if it's provided
  if (metadata !== undefined) {
    entry.metadata = metadata;
  }

  return entry;
}

// ============================================================================
// Tests: generateLeaderboardEmbed
// ============================================================================

describe("generateLeaderboardEmbed", () => {
  it("should generate embed with correct title and description", () => {
    const competition = createTestCompetition({
      title: "January Grind Challenge",
      description: "Who can play the most games?",
    });
    const leaderboard: RankedLeaderboardEntry[] = [
      createTestLeaderboardEntry(1, 47, "PlayerOne"),
      createTestLeaderboardEntry(2, 45, "ProGamer"),
    ];

    const embed = generateLeaderboardEmbed(competition, leaderboard);
    const embedData = embed.toJSON();

    expect(embedData.title).toBe("🏆 January Grind Challenge");
    expect(embedData.description).toBe("Who can play the most games?");
  });

  it("should display top 10 participants when there are more than 10", () => {
    const competition = createTestCompetition();
    const leaderboard: RankedLeaderboardEntry[] = Array.from({ length: 15 }, (_, i) =>
      createTestLeaderboardEntry(i + 1, 100 - i, `Player${(i + 1).toString()}`),
    );

    const embed = generateLeaderboardEmbed(competition, leaderboard);
    const embedData = embed.toJSON();

    // Should have standings field
    const standingsField = embedData.fields?.find((f) => f.name.includes("Standings"));
    expect(standingsField).toBeDefined();
    expect(standingsField?.value).toBeDefined();

    // Should have exactly 10 player entries in the standings (by counting lines)
    const lines = standingsField?.value.split("\n") ?? [];
    expect(lines.length).toBe(10);

    // Should have indicator for more participants
    const indicatorField = embedData.fields?.find((f) => f.value.includes("Showing top 10 of 15"));
    expect(indicatorField).toBeDefined();
  });

  it("should handle ties correctly with same rank number", () => {
    const competition = createTestCompetition({
      criteria: {
        type: "MOST_GAMES_PLAYED",
        queue: "SOLO",
      },
    });

    // Two players tied for rank 2
    const leaderboard: RankedLeaderboardEntry[] = [
      createTestLeaderboardEntry(1, 100, "FirstPlace"),
      createTestLeaderboardEntry(2, 80, "TiedForSecond1"),
      createTestLeaderboardEntry(2, 80, "TiedForSecond2"), // Same rank
      createTestLeaderboardEntry(4, 60, "FourthPlace"), // Next rank is 4, not 3
    ];

    const embed = generateLeaderboardEmbed(competition, leaderboard);
    const embedData = embed.toJSON();

    const standingsField = embedData.fields?.find((f) => f.name.includes("Standings"));
    const standingsText = standingsField?.value ?? "";

    // Check that both tied entries have rank 2
    expect(standingsText).toContain("**2.** TiedForSecond1");
    expect(standingsText).toContain("**2.** TiedForSecond2");
    expect(standingsText).toContain("**4.** FourthPlace");
  });

  it("should show medal emojis for top 3", () => {
    const competition = createTestCompetition();
    const leaderboard: RankedLeaderboardEntry[] = [
      createTestLeaderboardEntry(1, 100, "Gold"),
      createTestLeaderboardEntry(2, 90, "Silver"),
      createTestLeaderboardEntry(3, 80, "Bronze"),
      createTestLeaderboardEntry(4, 70, "Fourth"),
    ];

    const embed = generateLeaderboardEmbed(competition, leaderboard);
    const embedData = embed.toJSON();

    const standingsField = embedData.fields?.find((f) => f.name.includes("Standings"));
    const standingsText = standingsField?.value ?? "";

    expect(standingsText).toContain("🥇");
    expect(standingsText).toContain("🥈");
    expect(standingsText).toContain("🥉");
  });

  it("should show correct status colors for ACTIVE competition", () => {
    const competition = createTestCompetition({
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // Started 1 day ago
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15), // Ends in 15 days
    });

    const embed = generateLeaderboardEmbed(competition, []);
    const embedData = embed.toJSON();

    // Green color for ACTIVE
    expect(embedData.color).toBe(Colors.Green);

    // Should show active status
    const statusField = embedData.fields?.find((f) => f.name === "Status");
    expect(statusField?.value).toContain("🟢");
    expect(statusField?.value).toContain("Active");
  });

  it("should show correct status colors for DRAFT competition", () => {
    const competition = createTestCompetition({
      startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // Starts in 7 days
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 37), // Ends in 37 days
    });

    const embed = generateLeaderboardEmbed(competition, []);
    const embedData = embed.toJSON();

    // Blue color for DRAFT
    expect(embedData.color).toBe(Colors.Blue);

    const statusField = embedData.fields?.find((f) => f.name === "Status");
    expect(statusField?.value).toContain("🔵");
    expect(statusField?.value).toContain("Draft");
  });

  it("should show correct status colors for ENDED competition", () => {
    const competition = createTestCompetition({
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // Started 30 days ago
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // Ended 1 day ago
    });

    const embed = generateLeaderboardEmbed(competition, []);
    const embedData = embed.toJSON();

    // Red color for ENDED
    expect(embedData.color).toBe(Colors.Red);

    const statusField = embedData.fields?.find((f) => f.name === "Status");
    expect(statusField?.value).toContain("🔴");
    expect(statusField?.value).toContain("Ended");
  });

  it("should show correct status colors for CANCELLED competition", () => {
    const competition = createTestCompetition({
      isCancelled: true,
    });

    const embed = generateLeaderboardEmbed(competition, []);
    const embedData = embed.toJSON();

    // Grey color for CANCELLED
    expect(embedData.color).toBe(Colors.Grey);

    const statusField = embedData.fields?.find((f) => f.name === "Status");
    expect(statusField?.value).toContain("⚫");
    expect(statusField?.value).toContain("Cancelled");
  });

  it("should handle empty leaderboard gracefully", () => {
    const competition = createTestCompetition();
    const leaderboard: RankedLeaderboardEntry[] = [];

    const embed = generateLeaderboardEmbed(competition, leaderboard);
    const embedData = embed.toJSON();

    const standingsField = embedData.fields?.find((f) => f.name.includes("Standings"));
    expect(standingsField?.value).toContain("No participants have scores yet");
  });

  it("should include participant count in fields", () => {
    const competition = createTestCompetition({ maxParticipants: 50 });
    const leaderboard: RankedLeaderboardEntry[] = [
      createTestLeaderboardEntry(1, 100, "Player1"),
      createTestLeaderboardEntry(2, 90, "Player2"),
      createTestLeaderboardEntry(3, 80, "Player3"),
    ];

    const embed = generateLeaderboardEmbed(competition, leaderboard);
    const embedData = embed.toJSON();

    const participantField = embedData.fields?.find((f) => f.name === "Participants");
    expect(participantField?.value).toBe("3/50");
  });

  it("should include owner in fields", () => {
    const competition = createTestCompetition({ ownerId: "owner-123" });

    const embed = generateLeaderboardEmbed(competition, []);
    const embedData = embed.toJSON();

    const ownerField = embedData.fields?.find((f) => f.name === "Owner");
    expect(ownerField?.value).toBe("<@owner-123>");
  });

  it("should include criteria description and timestamp in footer", () => {
    const competition = createTestCompetition({
      criteria: {
        type: "MOST_GAMES_PLAYED",
        queue: "SOLO",
      },
    });

    const embed = generateLeaderboardEmbed(competition, []);
    const embedData = embed.toJSON();

    expect(embedData.footer?.text).toContain("Most games played in Solo Queue");
    expect(embedData.footer?.text).toContain("Updated");
  });

  it("should show appropriate standings title for ACTIVE competition", () => {
    const competition = createTestCompetition({
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
    });

    const leaderboard: RankedLeaderboardEntry[] = [createTestLeaderboardEntry(1, 100, "Player1")];

    const embed = generateLeaderboardEmbed(competition, leaderboard);
    const embedData = embed.toJSON();

    const standingsField = embedData.fields?.find((f) => f.name.includes("Current Standings"));
    expect(standingsField).toBeDefined();
  });

  it("should show appropriate standings title for ENDED competition", () => {
    const competition = createTestCompetition({
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
    });

    const leaderboard: RankedLeaderboardEntry[] = [createTestLeaderboardEntry(1, 100, "Player1")];

    const embed = generateLeaderboardEmbed(competition, leaderboard);
    const embedData = embed.toJSON();

    const standingsField = embedData.fields?.find((f) => f.name.includes("Final Standings"));
    expect(standingsField).toBeDefined();
  });
});

// ============================================================================
// Tests: generateCompetitionDetailsEmbed
// ============================================================================

describe("generateCompetitionDetailsEmbed", () => {
  it("should include all basic competition metadata", () => {
    const competition = createTestCompetition({
      title: "Test Competition",
      description: "Test description",
      ownerId: "owner-123",
      channelId: "channel-456",
      maxParticipants: 25,
    });

    const embed = generateCompetitionDetailsEmbed(competition);
    const embedData = embed.toJSON();

    expect(embedData.title).toBe("🏆 Test Competition");
    expect(embedData.description).toBe("Test description");

    const ownerField = embedData.fields?.find((f) => f.name === "Owner");
    expect(ownerField?.value).toBe("<@owner-123>");

    const channelField = embedData.fields?.find((f) => f.name === "Channel");
    expect(channelField?.value).toBe("<#channel-456>");

    const maxField = embedData.fields?.find((f) => f.name === "Max Participants");
    expect(maxField?.value).toBe("25");
  });

  it("should show visibility as human-readable text", () => {
    const competition = createTestCompetition({ visibility: "INVITE_ONLY" });

    const embed = generateCompetitionDetailsEmbed(competition);
    const embedData = embed.toJSON();

    const visibilityField = embedData.fields?.find((f) => f.name === "Visibility");
    expect(visibilityField?.value).toBe("Invite Only");
  });

  it("should include formatted date range", () => {
    const competition = createTestCompetition({
      startDate: new Date("2025-01-01T00:00:00Z"),
      endDate: new Date("2025-01-31T23:59:59Z"),
    });

    const embed = generateCompetitionDetailsEmbed(competition);
    const embedData = embed.toJSON();

    const durationField = embedData.fields?.find((f) => f.name === "📅 Duration");
    expect(durationField?.value).toContain("Start:");
    expect(durationField?.value).toContain("End:");
  });

  it("should show season ID for season-based competitions", () => {
    const competition = createTestCompetition({
      startDate: null,
      endDate: null,
      seasonId: "SEASON_2025_SPLIT_1",
    });

    const embed = generateCompetitionDetailsEmbed(competition);
    const embedData = embed.toJSON();

    const durationField = embedData.fields?.find((f) => f.name === "📅 Duration");
    expect(durationField?.value).toContain("Season-based");
    expect(durationField?.value).toContain("SEASON_2025_SPLIT_1");
  });

  it("should include criteria description", () => {
    const competition = createTestCompetition({
      criteria: {
        type: "HIGHEST_RANK",
        queue: "FLEX",
      },
    });

    const embed = generateCompetitionDetailsEmbed(competition);
    const embedData = embed.toJSON();

    const criteriaField = embedData.fields?.find((f) => f.name === "📊 Ranking Criteria");
    expect(criteriaField?.value).toBe("Highest rank in Flex Queue");
  });

  it("should include competition ID in footer", () => {
    const competition = createTestCompetition({ id: 42 });

    const embed = generateCompetitionDetailsEmbed(competition);
    const embedData = embed.toJSON();

    expect(embedData.footer?.text).toBe("Competition ID: 42");
  });

  it("should include created date", () => {
    const competition = createTestCompetition({
      createdTime: new Date("2024-12-15T10:30:00Z"),
    });

    const embed = generateCompetitionDetailsEmbed(competition);
    const embedData = embed.toJSON();

    const createdField = embedData.fields?.find((f) => f.name === "Created");
    expect(createdField?.value).toBeDefined();
    expect(createdField?.value).toContain("Dec");
  });
});

// ============================================================================
// Tests: formatCriteriaDescription
// ============================================================================

describe("formatCriteriaDescription", () => {
  it("should format MOST_GAMES_PLAYED criteria", () => {
    const criteria = {
      type: "MOST_GAMES_PLAYED" as const,
      queue: "SOLO" as const,
    };

    const result = formatCriteriaDescription(criteria);
    expect(result).toBe("Most games played in Solo Queue");
  });

  it("should format HIGHEST_RANK criteria", () => {
    const criteria = {
      type: "HIGHEST_RANK" as const,
      queue: "FLEX" as const,
    };

    const result = formatCriteriaDescription(criteria);
    expect(result).toBe("Highest rank in Flex Queue");
  });

  it("should format MOST_RANK_CLIMB criteria", () => {
    const criteria = {
      type: "MOST_RANK_CLIMB" as const,
      queue: "SOLO" as const,
    };

    const result = formatCriteriaDescription(criteria);
    expect(result).toBe("Most rank climb in Solo Queue");
  });

  it("should format MOST_WINS_PLAYER criteria", () => {
    const criteria = {
      type: "MOST_WINS_PLAYER" as const,
      queue: "ARAM" as const,
    };

    const result = formatCriteriaDescription(criteria);
    expect(result).toBe("Most wins in ARAM");
  });

  it("should format MOST_WINS_CHAMPION criteria with champion name", () => {
    const criteria = {
      type: "MOST_WINS_CHAMPION" as const,
      championId: 157, // Yasuo
      queue: undefined,
    };

    const result = formatCriteriaDescription(criteria);
    expect(result).toContain("Most wins with");
    // Note: The actual champion name will depend on the twisted library
  });

  it("should format MOST_WINS_CHAMPION criteria with queue specified", () => {
    const criteria = {
      type: "MOST_WINS_CHAMPION" as const,
      championId: 157, // Yasuo
      queue: "SOLO" as const,
    };

    const result = formatCriteriaDescription(criteria);
    expect(result).toContain("Most wins with");
    expect(result).toContain("in Solo Queue");
  });

  it("should format HIGHEST_WIN_RATE criteria", () => {
    const criteria = {
      type: "HIGHEST_WIN_RATE" as const,
      queue: "FLEX" as const,
      minGames: 20,
    };

    const result = formatCriteriaDescription(criteria);
    expect(result).toBe("Highest win rate in Flex Queue (min 20 games)");
  });

  it("should handle all queue types correctly", () => {
    const queueTypes = ["SOLO", "FLEX", "RANKED_ANY", "ARENA", "ARAM", "ALL"] as const;

    for (const queue of queueTypes) {
      const criteria = {
        type: "MOST_GAMES_PLAYED" as const,
        queue,
      };

      const result = formatCriteriaDescription(criteria);
      expect(result).toContain("Most games played in");
      expect(result.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// Tests: formatScore
// ============================================================================

describe("formatScore", () => {
  it("should format games count for MOST_GAMES_PLAYED", () => {
    const criteria = {
      type: "MOST_GAMES_PLAYED" as const,
      queue: "SOLO" as const,
    };

    expect(formatScore(1, criteria)).toBe("1 game");
    expect(formatScore(15, criteria)).toBe("15 games");
    expect(formatScore(0, criteria)).toBe("0 games");
  });

  it("should format rank for HIGHEST_RANK", () => {
    const criteria = {
      type: "HIGHEST_RANK" as const,
      queue: "SOLO" as const,
    };

    const rank = {
      tier: "diamond" as const,
      division: 2 as const,
      lp: 67,
      wins: 100,
      losses: 85,
    };

    const result = formatScore(rank, criteria);
    expect(result).toContain("Diamond");
    expect(result).toContain("67");
  });

  it("should format LP gained for MOST_RANK_CLIMB", () => {
    const criteria = {
      type: "MOST_RANK_CLIMB" as const,
      queue: "SOLO" as const,
    };

    expect(formatScore(250, criteria)).toBe("250 LP gained");
    expect(formatScore(0, criteria)).toBe("0 LP gained");
  });

  it("should format wins count for MOST_WINS_PLAYER", () => {
    const criteria = {
      type: "MOST_WINS_PLAYER" as const,
      queue: "SOLO" as const,
    };

    expect(formatScore(1, criteria)).toBe("1 win");
    expect(formatScore(12, criteria)).toBe("12 wins");
  });

  it("should format wins with record when metadata includes games", () => {
    const criteria = {
      type: "MOST_WINS_PLAYER" as const,
      queue: "SOLO" as const,
    };

    const metadata = {
      wins: 12,
      games: 15,
    };

    const result = formatScore(12, criteria, metadata);
    expect(result).toBe("12 wins (12-3, 80%)");
  });

  it("should format wins for MOST_WINS_CHAMPION with record", () => {
    const criteria = {
      type: "MOST_WINS_CHAMPION" as const,
      championId: 157,
      queue: undefined,
    };

    const metadata = {
      wins: 10,
      games: 18,
    };

    const result = formatScore(10, criteria, metadata);
    expect(result).toBe("10 wins (10-8, 56%)");
  });

  it("should format win rate for HIGHEST_WIN_RATE", () => {
    const criteria = {
      type: "HIGHEST_WIN_RATE" as const,
      queue: "SOLO" as const,
      minGames: 10,
    };

    expect(formatScore(75.0, criteria)).toBe("75.0%");
    expect(formatScore(100.0, criteria)).toBe("100.0%");
    expect(formatScore(0.0, criteria)).toBe("0.0%");
  });

  it("should format win rate with record when metadata available", () => {
    const criteria = {
      type: "HIGHEST_WIN_RATE" as const,
      queue: "SOLO" as const,
      minGames: 10,
    };

    const metadata = {
      wins: 15,
      games: 20,
    };

    const result = formatScore(75.0, criteria, metadata);
    expect(result).toBe("75.0% (15-5)");
  });

  it("should handle edge case of 100% win rate with record", () => {
    const criteria = {
      type: "HIGHEST_WIN_RATE" as const,
      queue: "SOLO" as const,
      minGames: 10,
    };

    const metadata = {
      wins: 10,
      games: 10,
    };

    const result = formatScore(100.0, criteria, metadata);
    expect(result).toBe("100.0% (10-0)");
  });

  it("should handle edge case of 0% win rate with record", () => {
    const criteria = {
      type: "HIGHEST_WIN_RATE" as const,
      queue: "SOLO" as const,
      minGames: 10,
    };

    const metadata = {
      wins: 0,
      games: 10,
    };

    const result = formatScore(0.0, criteria, metadata);
    expect(result).toBe("0.0% (0-10)");
  });

  it("should return error message for invalid score type", () => {
    const criteria = {
      type: "MOST_GAMES_PLAYED" as const,
      queue: "SOLO" as const,
    };

    // Pass a Rank object when expecting a number
    const invalidScore = {
      tier: "diamond" as const,
      division: 2 as const,
      lp: 67,
      wins: 100,
      losses: 85,
    };

    const result = formatScore(invalidScore, criteria);
    expect(result).toBe("Invalid score");
  });
});
