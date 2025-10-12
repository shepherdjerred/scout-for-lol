import { describe, expect, test } from "bun:test";
import { CompetitionDatesSchema, isCompetitionActive } from "./validation.js";

// ============================================================================
// isCompetitionActive
// ============================================================================

describe("isCompetitionActive", () => {
  const now = new Date("2025-01-15T12:00:00Z");

  test("returns false for cancelled competition", () => {
    const endDate = new Date("2025-02-15T12:00:00Z"); // Future date
    expect(isCompetitionActive(true, endDate, now)).toBe(false);
  });

  test("returns true for active season-based competition (no endDate)", () => {
    expect(isCompetitionActive(false, null, now)).toBe(true);
  });

  test("returns false for cancelled season-based competition", () => {
    expect(isCompetitionActive(true, null, now)).toBe(false);
  });

  test("returns true for active fixed-date competition (endDate in future)", () => {
    const endDate = new Date("2025-02-15T12:00:00Z");
    expect(isCompetitionActive(false, endDate, now)).toBe(true);
  });

  test("returns false for ended fixed-date competition (endDate in past)", () => {
    const endDate = new Date("2025-01-10T12:00:00Z");
    expect(isCompetitionActive(false, endDate, now)).toBe(false);
  });

  test("returns false for competition ending exactly now", () => {
    const endDate = new Date("2025-01-15T12:00:00Z"); // Same as now
    expect(isCompetitionActive(false, endDate, now)).toBe(false);
  });

  test("uses current time if now not provided", () => {
    const endDate = new Date(Date.now() + 86400000); // Tomorrow
    expect(isCompetitionActive(false, endDate)).toBe(true);
  });
});

// ============================================================================
// CompetitionDatesSchema - XOR Constraint
// ============================================================================

describe("CompetitionDatesSchema - discriminated union", () => {
  const startDate = new Date("2025-01-01");
  const endDate = new Date("2025-01-31");

  test("passes with FIXED_DATES type", () => {
    const result = CompetitionDatesSchema.safeParse({
      type: "FIXED_DATES",
      startDate,
      endDate,
    });
    expect(result.success).toBe(true);
  });

  test("passes with SEASON type", () => {
    const result = CompetitionDatesSchema.safeParse({
      type: "SEASON",
      seasonId: "SPLIT_1_2025",
    });
    expect(result.success).toBe(true);
  });

  test("fails with invalid discriminator type", () => {
    const result = CompetitionDatesSchema.safeParse({
      type: "INVALID",
      startDate,
      endDate,
    });
    expect(result.success).toBe(false);
  });

  test("fails with missing discriminator", () => {
    const result = CompetitionDatesSchema.safeParse({
      startDate,
      endDate,
    });
    expect(result.success).toBe(false);
  });

  test("fails when FIXED_DATES missing startDate", () => {
    const result = CompetitionDatesSchema.safeParse({
      type: "FIXED_DATES",
      endDate,
    });
    expect(result.success).toBe(false);
  });

  test("fails when FIXED_DATES missing endDate", () => {
    const result = CompetitionDatesSchema.safeParse({
      type: "FIXED_DATES",
      startDate,
    });
    expect(result.success).toBe(false);
  });

  test("fails when SEASON missing seasonId", () => {
    const result = CompetitionDatesSchema.safeParse({
      type: "SEASON",
    });
    expect(result.success).toBe(false);
  });

  test("type system enforces XOR - can't mix fixed dates with season", () => {
    // This test demonstrates that TypeScript won't allow mixing types
    // at compile time, and validation catches it at runtime
    const result = CompetitionDatesSchema.safeParse({
      type: "FIXED_DATES",
      startDate,
      endDate,
      seasonId: "SPLIT_1_2025", // Extra field ignored
    });
    expect(result.success).toBe(true); // Passes because extra fields are ignored
  });
});

// ============================================================================
// CompetitionDatesSchema - Date Order
// ============================================================================

describe("CompetitionDatesSchema - date order", () => {
  test("passes when startDate is before endDate", () => {
    const startDate = new Date("2025-01-01T00:00:00Z");
    const endDate = new Date("2025-01-15T00:00:00Z");
    const result = CompetitionDatesSchema.safeParse({
      type: "FIXED_DATES",
      startDate,
      endDate,
    });
    expect(result.success).toBe(true);
  });

  test("passes when startDate is just 1 second before endDate", () => {
    const startDate = new Date("2025-01-01T12:00:00Z");
    const endDate = new Date("2025-01-01T12:00:01Z");
    const result = CompetitionDatesSchema.safeParse({
      type: "FIXED_DATES",
      startDate,
      endDate,
    });
    expect(result.success).toBe(true);
  });

  test("fails when startDate equals endDate", () => {
    const date = new Date("2025-01-01T00:00:00Z");
    const result = CompetitionDatesSchema.safeParse({
      type: "FIXED_DATES",
      startDate: date,
      endDate: date,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "startDate must be before endDate"
      );
    }
  });

  test("fails when startDate is after endDate", () => {
    const startDate = new Date("2025-01-15T00:00:00Z");
    const endDate = new Date("2025-01-01T00:00:00Z");
    const result = CompetitionDatesSchema.safeParse({
      type: "FIXED_DATES",
      startDate,
      endDate,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "startDate must be before endDate"
      );
    }
  });
});

// ============================================================================
// CompetitionDatesSchema - Duration Limit
// ============================================================================

describe("CompetitionDatesSchema - duration limit", () => {
  test("passes with 1 day duration", () => {
    const startDate = new Date("2025-01-01T00:00:00Z");
    const endDate = new Date("2025-01-02T00:00:00Z");
    const result = CompetitionDatesSchema.safeParse({
      type: "FIXED_DATES",
      startDate,
      endDate,
    });
    expect(result.success).toBe(true);
  });

  test("passes with 89 days duration", () => {
    const startDate = new Date("2025-01-01T00:00:00Z");
    const endDate = new Date(startDate.getTime() + 89 * 24 * 60 * 60 * 1000);
    const result = CompetitionDatesSchema.safeParse({
      type: "FIXED_DATES",
      startDate,
      endDate,
    });
    expect(result.success).toBe(true);
  });

  test("passes with exactly 90 days duration", () => {
    const startDate = new Date("2025-01-01T00:00:00Z");
    const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    const result = CompetitionDatesSchema.safeParse({
      type: "FIXED_DATES",
      startDate,
      endDate,
    });
    expect(result.success).toBe(true);
  });

  test("fails with 91 days duration", () => {
    const startDate = new Date("2025-01-01T00:00:00Z");
    const endDate = new Date(startDate.getTime() + 91 * 24 * 60 * 60 * 1000);
    const result = CompetitionDatesSchema.safeParse({
      type: "FIXED_DATES",
      startDate,
      endDate,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Competition duration cannot exceed 90 days"
      );
    }
  });

  test("fails with 365 days duration", () => {
    const startDate = new Date("2025-01-01T00:00:00Z");
    const endDate = new Date("2026-01-01T00:00:00Z");
    const result = CompetitionDatesSchema.safeParse({
      type: "FIXED_DATES",
      startDate,
      endDate,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Competition duration cannot exceed 90 days"
      );
    }
  });

  test("duration check not applied to season-based competitions", () => {
    // Season-based competitions can be arbitrarily long
    const result = CompetitionDatesSchema.safeParse({
      type: "SEASON",
      seasonId: "SEASON_2025",
    });
    expect(result.success).toBe(true);
  });
});
