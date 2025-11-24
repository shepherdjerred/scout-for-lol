/**
 * Tests for Guild Create Event Handler
 */

import { describe, it, expect, mock } from "bun:test";
import { handleGuildCreate } from "@scout-for-lol/backend/discord/events/guild-create";
import { ChannelType, type Guild } from "discord.js";

// Helper to create a Guild-like object for testing
// Uses Parameters to infer the exact type expected by handleGuildCreate
function createMockGuild(overrides: {
  name: string;
  id: string;
  memberCount: number;
  systemChannel?: {
    type: ChannelType;
    name: string;
    permissionsFor: () => { has: () => boolean };
    send: () => Promise<unknown>;
  } | null;
  channels: { fetch: () => Promise<Map<string, unknown>> };
  members: { me?: { id: string } | null };
  client: { user: { id: string } };
}) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- rare case where this is ok
  return {
    name: overrides.name,
    id: overrides.id,
    memberCount: overrides.memberCount,
    systemChannel: overrides.systemChannel ?? null,
    channels: overrides.channels,
    members: overrides.members,
    client: overrides.client,
  } as Guild;
}

describe("handleGuildCreate", () => {
  it("should send welcome message to system channel when available", async () => {
    const sendMock = mock(() => Promise.resolve({}));

    const mockGuild = createMockGuild({
      name: "Test Server",
      id: "123456789",
      memberCount: 100,
      systemChannel: {
        type: ChannelType.GuildText,
        name: "general",
        permissionsFor: mock(() => ({
          has: mock(() => true),
        })),
        send: sendMock,
      },
      channels: {
        fetch: mock(() => Promise.resolve(new Map())),
      },
      members: {
        me: { id: "bot-id" },
      },
      client: {
        user: { id: "bot-id" },
      },
    });

    await handleGuildCreate(mockGuild);

    expect(sendMock).toHaveBeenCalledTimes(1);
    // Verify the welcome message contains expected content
    const calls = sendMock.mock.calls as unknown as [{ content: string }][];
    expect(calls[0]?.[0]?.content).toContain("Thanks for adding Scout");
    expect(calls[0]?.[0]?.content).toContain("https://scout-for-lol.com/getting-started");
    expect(calls[0]?.[0]?.content).toContain("/help");
    expect(calls[0]?.[0]?.content).toContain("/subscription add");
  });

  it("should find first available text channel if system channel unavailable", async () => {
    const sendMock = mock(() => Promise.resolve({}));

    const mockChannel = {
      type: ChannelType.GuildText,
      name: "welcome",
      permissionsFor: mock(() => ({
        has: mock(() => true),
      })),
      send: sendMock,
    };

    const mockGuild = createMockGuild({
      name: "Test Server",
      id: "123456789",
      memberCount: 50,
      systemChannel: null,
      channels: {
        fetch: mock(() =>
          Promise.resolve(
            new Map([
              ["channel1", { type: ChannelType.GuildVoice }],
              ["channel2", mockChannel],
            ] as const),
          ),
        ),
      },
      members: {
        me: { id: "bot-id" },
      },
      client: {
        user: { id: "bot-id" },
      },
    });

    await handleGuildCreate(mockGuild);

    expect(sendMock).toHaveBeenCalledTimes(1);
    // Verify the welcome message contains expected content
    const calls = sendMock.mock.calls as unknown as [{ content: string }][];
    expect(calls[0]?.[0]?.content).toContain("Thanks for adding Scout");
    expect(calls[0]?.[0]?.content).toContain("/help");
  });

  it("should handle case when no suitable channel found", async () => {
    const mockGuild = createMockGuild({
      name: "Test Server",
      id: "123456789",
      memberCount: 25,
      systemChannel: null,
      channels: {
        fetch: mock(() =>
          Promise.resolve(
            new Map([
              [
                "channel1",
                {
                  type: ChannelType.GuildText,
                  permissionsFor: mock(() => ({
                    has: mock(() => false), // No permissions
                  })),
                },
              ],
            ]),
          ),
        ),
      },
      members: {
        me: { id: "bot-id" },
      },
      client: {
        user: { id: "bot-id" },
      },
    });

    // Should not throw error, just log warning
    await expect(handleGuildCreate(mockGuild)).resolves.toBeUndefined();
  });

  it("should handle errors gracefully when sending message fails", async () => {
    const sendMock = mock(() => Promise.reject(new Error("Permission denied")));

    const mockGuild = createMockGuild({
      name: "Test Server",
      id: "123456789",
      memberCount: 75,
      systemChannel: {
        type: ChannelType.GuildText,
        name: "general",
        permissionsFor: mock(() => ({
          has: mock(() => true),
        })),
        send: sendMock,
      },
      channels: {
        fetch: mock(() => Promise.resolve(new Map())),
      },
      members: {
        me: { id: "bot-id" },
      },
      client: {
        user: { id: "bot-id" },
      },
    });

    // Should not throw error, just log it
    await expect(handleGuildCreate(mockGuild)).resolves.toBeUndefined();
    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});
