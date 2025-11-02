import { describe, test, expect } from "bun:test";

import {
  DEFAULT_PLAYER_SUBSCRIPTION_LIMIT,
  DEFAULT_ACCOUNT_LIMIT,
  hasUnlimitedSubscriptions,
  getSubscriptionLimit,
  getAccountLimit,
  UNLIMITED_SUBSCRIPTION_SERVERS,
} from "./subscription-limits";

describe("Subscription Limits Configuration", () => {
  test("default player limit is 10", () => {
    expect(DEFAULT_PLAYER_SUBSCRIPTION_LIMIT).toBe(10);
  });

  test("default account limit is 10", () => {
    expect(DEFAULT_ACCOUNT_LIMIT).toBe(10);
  });

  test("UNLIMITED_SUBSCRIPTION_SERVERS is a Set", () => {
    expect(UNLIMITED_SUBSCRIPTION_SERVERS).toBeInstanceOf(Set);
  });

  test("hasUnlimitedSubscriptions returns false for regular servers", () => {
    expect(hasUnlimitedSubscriptions("regular-server-123")).toBe(false);
    expect(hasUnlimitedSubscriptions("another-server-456")).toBe(false);
  });

  test("hasUnlimitedSubscriptions returns true for servers in the set", () => {
    // Add a test server to the set
    const testServerId = "test-unlimited-server";
    UNLIMITED_SUBSCRIPTION_SERVERS.add(testServerId);

    expect(hasUnlimitedSubscriptions(testServerId)).toBe(true);

    // Clean up
    UNLIMITED_SUBSCRIPTION_SERVERS.delete(testServerId);
  });

  test("getSubscriptionLimit returns default limit for regular servers", () => {
    expect(getSubscriptionLimit("regular-server-123")).toBe(10);
    expect(getSubscriptionLimit("another-server-456")).toBe(10);
  });

  test("getSubscriptionLimit returns null for unlimited servers", () => {
    const testServerId = "test-unlimited-server-2";
    UNLIMITED_SUBSCRIPTION_SERVERS.add(testServerId);

    expect(getSubscriptionLimit(testServerId)).toBe(null);

    // Clean up
    UNLIMITED_SUBSCRIPTION_SERVERS.delete(testServerId);
  });

  test("getAccountLimit returns default limit for regular servers", () => {
    expect(getAccountLimit("regular-server-123")).toBe(10);
    expect(getAccountLimit("another-server-456")).toBe(10);
  });

  test("getAccountLimit returns null for unlimited servers", () => {
    const testServerId = "test-unlimited-server-3";
    UNLIMITED_SUBSCRIPTION_SERVERS.add(testServerId);

    expect(getAccountLimit(testServerId)).toBe(null);

    // Clean up
    UNLIMITED_SUBSCRIPTION_SERVERS.delete(testServerId);
  });
});
