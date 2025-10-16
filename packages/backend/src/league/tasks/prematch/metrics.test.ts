import { describe, expect, test, beforeEach } from "bun:test";
import { playerPollingIntervalDistribution, playerPollingStats, registry } from "../../../metrics/index.js";

describe("Polling Interval Metrics", () => {
  beforeEach(() => {
    // Reset metrics before each test
    playerPollingIntervalDistribution.reset();
    playerPollingStats.reset();
  });

  test("playerPollingIntervalDistribution can be set without errors", () => {
    // Simulate setting metrics for different intervals
    expect(() => {
      playerPollingIntervalDistribution.set({ interval_minutes: "1" }, 50);
      playerPollingIntervalDistribution.set({ interval_minutes: "3" }, 20);
      playerPollingIntervalDistribution.set({ interval_minutes: "5" }, 10);
      playerPollingIntervalDistribution.set({ interval_minutes: "7" }, 5);
      playerPollingIntervalDistribution.set({ interval_minutes: "10" }, 3);
      playerPollingIntervalDistribution.set({ interval_minutes: "15" }, 2);
    }).not.toThrow();
  });

  test("playerPollingStats can be set without errors", () => {
    // Simulate a polling cycle where 60 players are checked and 30 are skipped
    expect(() => {
      playerPollingStats.set({ status: "checked" }, 60);
      playerPollingStats.set({ status: "skipped" }, 30);
    }).not.toThrow();
  });

  test("metrics are registered in the Prometheus registry", async () => {
    // Set some values
    playerPollingIntervalDistribution.set({ interval_minutes: "1" }, 100);
    playerPollingStats.set({ status: "checked" }, 75);
    playerPollingStats.set({ status: "skipped" }, 25);

    // Get all metrics as Prometheus-formatted text
    const metricsOutput = await registry.metrics();

    // Verify the metrics appear in the output
    expect(metricsOutput).toContain("player_polling_interval_distribution");
    expect(metricsOutput).toContain("player_polling_stats");
    expect(metricsOutput).toContain('interval_minutes="1"');
    expect(metricsOutput).toContain('status="checked"');
    expect(metricsOutput).toContain('status="skipped"');
  });

  test("metrics can be updated multiple times", () => {
    // First cycle
    expect(() => {
      playerPollingStats.set({ status: "checked" }, 50);
      playerPollingStats.set({ status: "skipped" }, 40);
    }).not.toThrow();

    // Second cycle with different values
    expect(() => {
      playerPollingStats.set({ status: "checked" }, 70);
      playerPollingStats.set({ status: "skipped" }, 20);
    }).not.toThrow();
  });

  test("interval distribution can track all interval buckets", () => {
    // Simulate a realistic distribution with all possible intervals
    expect(() => {
      playerPollingIntervalDistribution.set({ interval_minutes: "1" }, 100); // Active players
      playerPollingIntervalDistribution.set({ interval_minutes: "3" }, 30); // 1-5 days inactive
      playerPollingIntervalDistribution.set({ interval_minutes: "5" }, 15); // 5-7 days inactive
      playerPollingIntervalDistribution.set({ interval_minutes: "7" }, 8); // 1-4 weeks inactive
      playerPollingIntervalDistribution.set({ interval_minutes: "10" }, 4); // 1-3 months inactive
      playerPollingIntervalDistribution.set({ interval_minutes: "15" }, 2); // 3+ months inactive
    }).not.toThrow();
  });
});
