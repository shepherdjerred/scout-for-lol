import { describe, test, expect } from "bun:test";
import {
  truncateDiscordMessage,
  truncateEmbedFieldValue,
  truncateEmbedDescription,
} from "@scout-for-lol/backend/discord/utils/message.ts";

describe("truncateDiscordMessage", () => {
  test("does not truncate short messages", () => {
    const message = "Short message";
    expect(truncateDiscordMessage(message)).toBe(message);
  });

  test("truncates messages exceeding default max length", () => {
    const message = "a".repeat(2000);
    const result = truncateDiscordMessage(message);
    expect(result.length).toBe(1903); // 1900 + "..."
    expect(result.endsWith("...")).toBe(true);
  });

  test("respects custom max length", () => {
    const message = "a".repeat(200);
    const result = truncateDiscordMessage(message, 100);
    expect(result.length).toBe(103); // 100 + "..."
    expect(result.endsWith("...")).toBe(true);
  });

  test("handles exact max length", () => {
    const message = "a".repeat(1900);
    const result = truncateDiscordMessage(message);
    expect(result).toBe(message);
  });
});

describe("truncateEmbedFieldValue", () => {
  test("does not truncate short text", () => {
    const text = "Short field value";
    expect(truncateEmbedFieldValue(text)).toBe(text);
  });

  test("truncates text exceeding 1024 character limit", () => {
    const text = "a".repeat(1100);
    const result = truncateEmbedFieldValue(text);
    expect(result.length).toBe(1007); // 1004 + "..."
    expect(result.endsWith("...")).toBe(true);
  });
});

describe("truncateEmbedDescription", () => {
  test("does not truncate short text", () => {
    const text = "Short description";
    expect(truncateEmbedDescription(text)).toBe(text);
  });

  test("truncates text exceeding 4096 character limit", () => {
    const text = "a".repeat(5000);
    const result = truncateEmbedDescription(text);
    expect(result.length).toBe(4079); // 4076 + "..."
    expect(result.endsWith("...")).toBe(true);
  });
});
