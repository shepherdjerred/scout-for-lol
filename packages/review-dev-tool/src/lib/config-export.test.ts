/**
 * Tests for config export/import functionality
 */
import { describe, it, expect, beforeEach } from "bun:test";
import {
  exportAllConfig,
  exportAllConfigAsJSON,
  importAllConfigFromJSON,
  applyConfigBundle,
  getConfigBundleSummary,
  type ConfigBundle,
} from "./config-export";
import { createDefaultTabConfig } from "../config/schema";
import { saveCustomPersonalities } from "./personality-storage";
import { saveCustomArtStyles, saveCustomArtThemes } from "./art-style-storage";

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("config-export", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("should export empty config when nothing is saved", () => {
    const tabConfig = createDefaultTabConfig();
    const config = exportAllConfig(tabConfig);

    expect(config.version).toBe(1);
    expect(config.customPersonalities).toEqual([]);
    expect(config.customArtStyles).toEqual([]);
    expect(config.customArtThemes).toEqual([]);
    expect(config.tabConfig).toBeTruthy();
  });

  it("should export all config data", () => {
    // Setup test data
    const tabConfig = createDefaultTabConfig();
    tabConfig.textGeneration.temperature = 0.5;

    saveCustomPersonalities([
      {
        id: "test-personality",
        metadata: {
          name: "Test Personality",
          description: "A test personality",
          favoriteChampions: ["Ahri"],
          favoriteLanes: ["mid"],
        },
        instructions: "Test instructions",
      },
    ]);

    saveCustomArtStyles([
      {
        id: "test-style",
        description: "Test art style",
      },
    ]);

    saveCustomArtThemes([
      {
        id: "test-theme",
        description: "Test art theme",
      },
    ]);

    const config = exportAllConfig(tabConfig);

    expect(config.tabConfig.textGeneration.temperature).toBe(0.5);
    expect(config.customPersonalities).toHaveLength(1);
    expect(config.customArtStyles).toHaveLength(1);
    expect(config.customArtThemes).toHaveLength(1);
  });

  it("should export and import config as JSON", () => {
    const tabConfig = createDefaultTabConfig();
    tabConfig.textGeneration.maxTokens = 10000;

    const json = exportAllConfigAsJSON(tabConfig);
    expect(json).toContain("10000");

    const imported = importAllConfigFromJSON(json);
    expect(imported.tabConfig.textGeneration.maxTokens).toBe(10000);
  });

  it("should validate imported config with Zod", () => {
    const invalidJson = JSON.stringify({
      version: 999, // Invalid version
      customPersonalities: [],
    });

    expect(() => importAllConfigFromJSON(invalidJson)).toThrow();
  });

  it("should apply config bundle with merge option", () => {
    // Setup existing data
    saveCustomPersonalities([
      {
        id: "existing-personality",
        metadata: {
          name: "Existing",
          description: "Existing personality",
          favoriteChampions: [],
          favoriteLanes: [],
        },
        instructions: "Existing",
      },
    ]);

    const bundle: ConfigBundle = {
      version: 1,
      tabConfig: createDefaultTabConfig(),
      customPersonalities: [
        {
          id: "new-personality",
          metadata: {
            name: "New",
            description: "New personality",
            favoriteChampions: [],
            favoriteLanes: [],
          },
          instructions: "New",
        },
      ],
      customArtStyles: [],
      customArtThemes: [],
      exportedAt: new Date().toISOString(),
    };

    applyConfigBundle(bundle, {
      importTabConfig: false,
      importPersonalities: true,
      importArtStyles: true,
      importArtThemes: true,
      mergeWithExisting: true,
    });

    // Check that both exist
    const stored = localStorage.getItem("review-dev-tool-custom-personalities");
    expect(stored).toBeTruthy();
    const personalities = JSON.parse(stored!);
    expect(personalities).toHaveLength(2);
    expect(personalities.find((p: { id: string }) => p.id === "existing-personality")).toBeTruthy();
    expect(personalities.find((p: { id: string }) => p.id === "new-personality")).toBeTruthy();
  });

  it("should replace config when merge is false", () => {
    // Setup existing data
    saveCustomArtStyles([
      {
        id: "existing-style",
        description: "Existing style",
      },
    ]);

    const bundle: ConfigBundle = {
      version: 1,
      tabConfig: createDefaultTabConfig(),
      customPersonalities: [],
      customArtStyles: [
        {
          id: "new-style",
          description: "New style",
        },
      ],
      customArtThemes: [],
      exportedAt: new Date().toISOString(),
    };

    applyConfigBundle(bundle, {
      importTabConfig: false,
      importPersonalities: false,
      importArtStyles: true,
      importArtThemes: false,
      mergeWithExisting: false,
    });

    // Check that only new style exists
    const stored = localStorage.getItem("review-dev-tool-custom-art-styles");
    expect(stored).toBeTruthy();
    const styles = JSON.parse(stored!);
    expect(styles).toHaveLength(1);
    expect(styles[0].id).toBe("new-style");
  });

  it("should generate correct summary", () => {
    const bundle: ConfigBundle = {
      version: 1,
      tabConfig: createDefaultTabConfig(),
      customPersonalities: [
        {
          id: "p1",
          metadata: {
            name: "P1",
            description: "D1",
            favoriteChampions: [],
            favoriteLanes: [],
          },
          instructions: "I1",
        },
        {
          id: "p2",
          metadata: {
            name: "P2",
            description: "D2",
            favoriteChampions: [],
            favoriteLanes: [],
          },
          instructions: "I2",
        },
      ],
      customArtStyles: [{ id: "s1", description: "S1" }],
      customArtThemes: [
        { id: "t1", description: "T1" },
        { id: "t2", description: "T2" },
        { id: "t3", description: "T3" },
      ],
      exportedAt: "2024-01-01T00:00:00Z",
    };

    const summary = getConfigBundleSummary(bundle);

    expect(summary.hasTabConfig).toBe(true);
    expect(summary.personalitiesCount).toBe(2);
    expect(summary.artStylesCount).toBe(1);
    expect(summary.artThemesCount).toBe(3);
    expect(summary.exportedAt).toBe("2024-01-01T00:00:00Z");
  });

  it("should detect tab config presence", () => {
    const bundle: ConfigBundle = {
      version: 1,
      tabConfig: createDefaultTabConfig(),
      customPersonalities: [],
      customArtStyles: [],
      customArtThemes: [],
      exportedAt: new Date().toISOString(),
    };

    const summary = getConfigBundleSummary(bundle);
    expect(summary.hasTabConfig).toBe(true);
  });

  it("should include built-in personality data when exporting specific personality", () => {
    const tabConfig = createDefaultTabConfig();
    tabConfig.prompts.personalityId = "aaron"; // Set to a specific built-in personality

    const exported = exportAllConfig(tabConfig);

    // The exported config should have the full personality data
    expect(exported.tabConfig.prompts.customPersonality).toBeDefined();
    expect(exported.tabConfig.prompts.customPersonality?.id).toBe("aaron");
    expect(exported.tabConfig.prompts.customPersonality?.metadata).toBeDefined();
    expect(exported.tabConfig.prompts.customPersonality?.instructions).toBeDefined();
    expect(exported.tabConfig.prompts.customPersonality?.instructions.length).toBeGreaterThan(0);
  });

  it("should not include personality data when personalityId is random", () => {
    const tabConfig = createDefaultTabConfig();
    tabConfig.prompts.personalityId = "random";

    const exported = exportAllConfig(tabConfig);

    // Should not add a customPersonality when using "random"
    expect(exported.tabConfig.prompts.customPersonality).toBeUndefined();
  });

  it("should preserve existing customPersonality if already set", () => {
    const tabConfig = createDefaultTabConfig();
    tabConfig.prompts.personalityId = "brian";
    tabConfig.prompts.customPersonality = {
      id: "custom-test",
      metadata: {
        name: "Custom Test",
        description: "Custom personality",
        favoriteChampions: ["Zed"],
        favoriteLanes: ["mid"],
      },
      instructions: "Custom instructions",
    };

    const exported = exportAllConfig(tabConfig);

    // Should preserve the existing customPersonality, not replace it
    expect(exported.tabConfig.prompts.customPersonality?.id).toBe("custom-test");
    expect(exported.tabConfig.prompts.customPersonality?.instructions).toBe("Custom instructions");
  });
});
