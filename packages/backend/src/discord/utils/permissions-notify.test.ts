import { describe, expect, test } from "bun:test";
import { notifyServerOwnerAboutPermissionError } from "./permissions";
import type { Client } from "discord.js";

describe("notifyServerOwnerAboutPermissionError", () => {
  test("sends DM to server owner with permission error details", async () => {
    const sentMessages: { user: string; message: string }[] = [];

    // Mock Discord client - test double with minimal required methods
    const mockClient = {
      guilds: {
        fetch: async () => ({
          name: "Test Server",
          fetchOwner: async () => ({
            user: { tag: "TestOwner#1234" },
            send: async (message: string) => {
              sentMessages.push({ user: "TestOwner#1234", message });
            },
          }),
        }),
      },
    } as unknown as Client;

    await notifyServerOwnerAboutPermissionError(
      mockClient,
      "server-123",
      "channel-456",
      "Missing Send Messages permission",
    );

    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0]?.message).toContain("Bot Permission Issue");
    expect(sentMessages[0]?.message).toContain("Test Server");
    expect(sentMessages[0]?.message).toContain("<#channel-456>");
    expect(sentMessages[0]?.message).toContain("Missing Send Messages permission");
  });

  test("handles case when guild is not found", async () => {
    const mockClient = {
      guilds: {
        fetch: async () => null,
      },
    } as unknown as Client;

    // Should not throw
    await expect(
      notifyServerOwnerAboutPermissionError(mockClient, "server-123", "channel-456"),
    ).resolves.toBeUndefined();
  });

  test("handles case when owner fetch fails", async () => {
    const mockClient = {
      guilds: {
        fetch: async () => ({
          name: "Test Server",
          fetchOwner: async () => null,
        }),
      },
    } as unknown as Client;

    // Should not throw
    await expect(
      notifyServerOwnerAboutPermissionError(mockClient, "server-123", "channel-456"),
    ).resolves.toBeUndefined();
  });

  test("handles case when DM send fails (user has DMs disabled)", async () => {
    const mockClient = {
      guilds: {
        fetch: async () => ({
          name: "Test Server",
          fetchOwner: async () => ({
            user: { tag: "TestOwner#1234" },
            send: async () => {
              throw new Error("Cannot send messages to this user");
            },
          }),
        }),
      },
    } as unknown as Client;

    // Should not throw - gracefully handles DM failures
    await expect(
      notifyServerOwnerAboutPermissionError(mockClient, "server-123", "channel-456"),
    ).resolves.toBeUndefined();
  });

  test("handles generic error during DM send", async () => {
    const mockClient = {
      guilds: {
        fetch: async () => ({
          name: "Test Server",
          fetchOwner: async () => ({
            user: { tag: "TestOwner#1234" },
            send: async () => {
              throw new Error("Network error");
            },
          }),
        }),
      },
    } as unknown as Client;

    // Should not throw - gracefully handles all errors
    await expect(
      notifyServerOwnerAboutPermissionError(mockClient, "server-123", "channel-456"),
    ).resolves.toBeUndefined();
  });

  test("includes reason in message when provided", async () => {
    const sentMessages: { user: string; message: string }[] = [];

    const mockClient = {
      guilds: {
        fetch: async () => ({
          name: "Test Server",
          fetchOwner: async () => ({
            user: { tag: "TestOwner#1234" },
            send: async (message: string) => {
              sentMessages.push({ user: "TestOwner#1234", message });
            },
          }),
        }),
      },
    } as unknown as Client;

    await notifyServerOwnerAboutPermissionError(mockClient, "server-123", "channel-456", "Custom error reason");

    expect(sentMessages[0]?.message).toContain("Custom error reason");
  });

  test("works without reason parameter", async () => {
    const sentMessages: { user: string; message: string }[] = [];

    const mockClient = {
      guilds: {
        fetch: async () => ({
          name: "Test Server",
          fetchOwner: async () => ({
            user: { tag: "TestOwner#1234" },
            send: async (message: string) => {
              sentMessages.push({ user: "TestOwner#1234", message });
            },
          }),
        }),
      },
    } as unknown as Client;

    await notifyServerOwnerAboutPermissionError(mockClient, "server-123", "channel-456");

    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0]?.message).toContain("Bot Permission Issue");
    expect(sentMessages[0]?.message).not.toContain("**Reason:**");
  });
});
