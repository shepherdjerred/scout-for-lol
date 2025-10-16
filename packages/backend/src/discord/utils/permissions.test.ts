import { describe, expect, test } from "bun:test";
import {
  isPermissionError,
  checkSendMessagePermission,
  getPermissionErrorMessage,
  formatPermissionErrorForLog,
} from "./permissions";
import { PermissionFlagsBits, type Channel, type User } from "discord.js";

// Mock bot user for tests
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Test mock for complex Discord.js User class
const mockBotUser = {
  id: "bot-id",
  username: "TestBot",
  discriminator: "0000",
} as User;

describe("isPermissionError", () => {
  test("returns true for Discord missing permissions error (50013)", () => {
    const error = { code: 50013, message: "Missing Permissions" };
    expect(isPermissionError(error)).toBe(true);
  });

  test("returns true for Discord missing access error (50001)", () => {
    const error = { code: 50001, message: "Missing Access" };
    expect(isPermissionError(error)).toBe(true);
  });

  test("returns false for other error codes", () => {
    const error = { code: 10003, message: "Unknown Channel" };
    expect(isPermissionError(error)).toBe(false);
  });

  test("returns false for non-Discord errors", () => {
    const error = new Error("Generic error");
    expect(isPermissionError(error)).toBe(false);
  });

  test("returns false for invalid error objects", () => {
    expect(isPermissionError("string error")).toBe(false);
    expect(isPermissionError(123)).toBe(false);
    expect(isPermissionError(null)).toBe(false);
    expect(isPermissionError(undefined)).toBe(false);
  });
});

describe("checkSendMessagePermission", () => {
  test("returns true for DM channels", async () => {
    const dmChannel = {
      isDMBased: () => true,
    };
    const result = await checkSendMessagePermission(dmChannel as unknown as Channel, mockBotUser);
    expect(result.hasPermission).toBe(true);
  });

  test("returns false when bot user is null", async () => {
    const channel = {
      isDMBased: () => false,
      permissionsFor: () => null,
      guild: null,
    };
    const result = await checkSendMessagePermission(channel as unknown as Channel, null);
    expect(result.hasPermission).toBe(false);
    expect(result.reason).toContain("Bot user not available");
  });

  test("returns false when channel doesn't have permissionsFor method", async () => {
    const invalidChannel = {
      isDMBased: () => false,
      // No permissionsFor method
    };
    const result = await checkSendMessagePermission(invalidChannel as unknown as Channel, mockBotUser);
    expect(result.hasPermission).toBe(false);
    expect(result.reason).toContain("Cannot check permissions");
  });

  test("returns false when permissionsFor returns null", async () => {
    const channel = {
      isDMBased: () => false,
      permissionsFor: () => null,
      guild: null,
    };
    const result = await checkSendMessagePermission(channel as unknown as Channel, mockBotUser);
    expect(result.hasPermission).toBe(false);
    expect(result.reason).toContain("Cannot access channel");
  });

  test("returns false when bot missing SendMessages permission", async () => {
    const channel = {
      isDMBased: () => false,
      permissionsFor: () => ({
        has: (permission: bigint) => {
          // Has ViewChannel but not SendMessages
          return permission === PermissionFlagsBits.ViewChannel;
        },
      }),
      guild: null,
    };
    const result = await checkSendMessagePermission(channel as unknown as Channel, mockBotUser);
    expect(result.hasPermission).toBe(false);
    expect(result.reason).toContain("Send Messages");
  });

  test("returns false when bot missing ViewChannel permission", async () => {
    const channel = {
      isDMBased: () => false,
      permissionsFor: () => ({
        has: (permission: bigint) => {
          // Has SendMessages but not ViewChannel
          return permission === PermissionFlagsBits.SendMessages;
        },
      }),
      guild: null,
    };
    const result = await checkSendMessagePermission(channel as unknown as Channel, mockBotUser);
    expect(result.hasPermission).toBe(false);
    expect(result.reason).toContain("cannot view");
  });

  test("returns true when bot has both required permissions", async () => {
    const channel = {
      isDMBased: () => false,
      permissionsFor: () => ({
        has: (permission: bigint) => {
          // Has both ViewChannel and SendMessages
          return permission === PermissionFlagsBits.ViewChannel || permission === PermissionFlagsBits.SendMessages;
        },
      }),
      guild: null,
    };
    const result = await checkSendMessagePermission(channel as unknown as Channel, mockBotUser);
    expect(result.hasPermission).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  test("handles errors when checking permissions", async () => {
    const channel = {
      isDMBased: () => false,
      permissionsFor: () => {
        throw new Error("Permission check failed");
      },
      guild: null,
    };
    const result = await checkSendMessagePermission(channel as unknown as Channel, mockBotUser);
    expect(result.hasPermission).toBe(false);
    expect(result.reason).toContain("Error checking permissions");
  });

  test("uses guild.members.me when available", async () => {
    const mockMe = { id: "bot-member-id" };
    const channel = {
      isDMBased: () => false,
      permissionsFor: (target: unknown) => {
        // Verify we're using the member object, not the user
        expect(target).toBe(mockMe);
        return {
          has: () => true,
        };
      },
      guild: {
        members: {
          me: mockMe,
          fetch: () => Promise.resolve(mockMe),
        },
      },
    };
    const result = await checkSendMessagePermission(channel as unknown as Channel, mockBotUser);
    expect(result.hasPermission).toBe(true);
  });

  test("fetches bot member when guild.members.me is not available", async () => {
    const mockMember = { id: "bot-member-id" };
    let fetchCalled = false;
    const channel = {
      isDMBased: () => false,
      permissionsFor: (target: unknown) => {
        // Should use the fetched member
        expect(target).toBe(mockMember);
        return {
          has: () => true,
        };
      },
      guild: {
        members: {
          me: null,
          fetch: async (userId: string) => {
            fetchCalled = true;
            expect(userId).toBe("bot-id");
            return mockMember;
          },
        },
      },
    };
    const result = await checkSendMessagePermission(channel as unknown as Channel, mockBotUser);
    expect(result.hasPermission).toBe(true);
    expect(fetchCalled).toBe(true);
  });

  test("falls back to botUser when fetch fails", async () => {
    const channel = {
      isDMBased: () => false,
      permissionsFor: (target: unknown) => {
        // Should fall back to botUser
        expect(target).toBe(mockBotUser);
        return {
          has: () => true,
        };
      },
      guild: {
        members: {
          me: null,
          fetch: async () => {
            throw new Error("Fetch failed");
          },
        },
      },
    };
    const result = await checkSendMessagePermission(channel as unknown as Channel, mockBotUser);
    expect(result.hasPermission).toBe(true);
  });
});

describe("getPermissionErrorMessage", () => {
  test("includes channel ID in message", () => {
    const message = getPermissionErrorMessage("123456789");
    expect(message).toContain("<#123456789>");
  });

  test("includes reason when provided", () => {
    const message = getPermissionErrorMessage("123456789", "Missing Send Messages permission");
    expect(message).toContain("Missing Send Messages permission");
  });

  test("provides default message when no reason given", () => {
    const message = getPermissionErrorMessage("123456789");
    expect(message).toContain("Send Messages");
    expect(message).toContain("View Channel");
  });
});

describe("formatPermissionErrorForLog", () => {
  test("formats permission error correctly", () => {
    const error = { code: 50013, message: "Missing Permissions" };
    const message = formatPermissionErrorForLog("123456789", error, "Missing Send Messages");
    expect(message).toContain("123456789");
    expect(message).toContain("Missing Send Messages");
    expect(message).toContain("Discord Permission Error");
  });

  test("formats non-permission error correctly", () => {
    const error = new Error("Network error");
    const message = formatPermissionErrorForLog("123456789", error);
    expect(message).toContain("123456789");
    expect(message).toContain("Network error");
    expect(message).not.toContain("Discord Permission Error");
  });

  test("includes reason when provided", () => {
    const error = { code: 50013, message: "Missing Permissions" };
    const message = formatPermissionErrorForLog("123456789", error, "Custom reason");
    expect(message).toContain("Custom reason");
  });
});
