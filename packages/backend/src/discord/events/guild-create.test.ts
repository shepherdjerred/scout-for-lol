/**
 * Tests for Guild Create Event Handler
 */

import { describe, it, expect, mock } from "bun:test";
import { handleGuildCreate } from "./guild-create";
import { ChannelType } from "discord.js";

describe("handleGuildCreate", () => {
  it("should send welcome message to system channel when available", async () => {
    const sendMock = mock(() => Promise.resolve({} as any));

    const mockGuild = {
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
    } as any;

    await handleGuildCreate(mockGuild);

    expect(sendMock).toHaveBeenCalledTimes(1);
    // Verify the welcome message contains expected content
    const calls = sendMock.mock.calls as unknown as [{ content: string }][];
    expect(calls[0]?.[0]?.content).toContain("Thanks for adding Scout");
    expect(calls[0]?.[0]?.content).toContain("https://scout-for-lol.com/getting-started");
    expect(calls[0]?.[0]?.content).toContain("/help");
    expect(calls[0]?.[0]?.content).toContain("/subscribe");
  });

  it("should find first available text channel if system channel unavailable", async () => {
    const sendMock = mock(() => Promise.resolve({} as any));

    const mockChannel = {
      type: ChannelType.GuildText,
      name: "welcome",
      permissionsFor: mock(() => ({
        has: mock(() => true),
      })),
      send: sendMock,
    };

    const mockGuild = {
      name: "Test Server",
      id: "123456789",
      memberCount: 50,
      systemChannel: null,
      channels: {
        fetch: mock(() =>
          Promise.resolve(
            new Map([
              ["channel1", { type: ChannelType.GuildVoice } as any],
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
    } as any;

    await handleGuildCreate(mockGuild);

    expect(sendMock).toHaveBeenCalledTimes(1);
    // Verify the welcome message contains expected content
    const calls = sendMock.mock.calls as unknown as [{ content: string }][];
    expect(calls[0]?.[0]?.content).toContain("Thanks for adding Scout");
    expect(calls[0]?.[0]?.content).toContain("/help");
  });

  it("should handle case when no suitable channel found", async () => {
    const mockGuild = {
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
    } as any;

    // Should not throw error, just log warning
    await expect(handleGuildCreate(mockGuild)).resolves.toBeUndefined();
  });

  it("should handle errors gracefully when sending message fails", async () => {
    const sendMock = mock(() => Promise.reject(new Error("Permission denied")));

    const mockGuild = {
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
    } as any;

    // Should not throw error, just log it
    await expect(handleGuildCreate(mockGuild)).resolves.toBeUndefined();
    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});
