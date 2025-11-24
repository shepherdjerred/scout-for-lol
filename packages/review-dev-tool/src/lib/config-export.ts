/**
 * Export and import all config data for sharing
 */
import { z } from "zod";
import { TabConfigSchema, PersonalitySchema } from "@scout-for-lol/review-dev-tool/config/schema";
import {
  CustomArtStyleSchema,
  CustomArtThemeSchema,
  loadCustomArtStyles,
  saveCustomArtStyles,
  loadCustomArtThemes,
  saveCustomArtThemes,
} from "@scout-for-lol/review-dev-tool/lib/art-style-storage";
import {
  loadCustomPersonalities,
  saveCustomPersonalities,
} from "@scout-for-lol/review-dev-tool/lib/personality-storage";
import { getPersonalityById } from "@scout-for-lol/review-dev-tool/lib/prompts";

/**
 * Complete exportable config bundle schema (tab-level)
 */
export const ConfigBundleSchema = z.object({
  version: z.literal(1), // For future compatibility
  tabConfig: TabConfigSchema,
  customPersonalities: z.array(PersonalitySchema),
  customArtStyles: z.array(CustomArtStyleSchema),
  customArtThemes: z.array(CustomArtThemeSchema),
  exportedAt: z.string(),
});

export type ConfigBundle = z.infer<typeof ConfigBundleSchema>;

/**
 * Export all config data as a JSON blob (tab-level)
 * Includes the full personality data if a specific personality is selected
 */
export function exportAllConfig(tabConfig: import("../config/schema").TabConfig): ConfigBundle {
  // Clone the tab config to avoid mutating the original
  const exportedTabConfig = structuredClone(tabConfig);

  // If personalityId is set to a specific built-in personality (not "random"),
  // resolve it and include the full personality data in customPersonality
  if (exportedTabConfig.prompts.personalityId !== "random" && !exportedTabConfig.prompts.customPersonality) {
    const personality = getPersonalityById(exportedTabConfig.prompts.personalityId);
    if (personality) {
      exportedTabConfig.prompts.customPersonality = personality;
    }
  }

  return {
    version: 1,
    tabConfig: exportedTabConfig,
    customPersonalities: loadCustomPersonalities(),
    customArtStyles: loadCustomArtStyles(),
    customArtThemes: loadCustomArtThemes(),
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Export all config as JSON string
 */
function exportAllConfigAsJSON(tabConfig: import("../config/schema").TabConfig): string {
  return JSON.stringify(exportAllConfig(tabConfig), null, 2);
}

/**
 * Download config bundle as a JSON file
 */
export function downloadConfigBundle(tabConfig: import("../config/schema").TabConfig): void {
  const json = exportAllConfigAsJSON(tabConfig);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scout-review-config-${new Date().toISOString().split("T")[0] ?? "unknown"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import config bundle from JSON string
 */
export function importAllConfigFromJSON(json: string): ConfigBundle {
  const parsed = JSON.parse(json);
  return ConfigBundleSchema.parse(parsed);
}

/**
 * Apply imported config bundle to localStorage
 * @param bundle The config bundle to apply
 * @param options Import options
 * @returns The imported TabConfig if importTabConfig was true, undefined otherwise
 */
export function applyConfigBundle(
  bundle: ConfigBundle,
  options: {
    importTabConfig: boolean;
    importPersonalities: boolean;
    importArtStyles: boolean;
    importArtThemes: boolean;
    mergeWithExisting: boolean;
  },
): import("../config/schema").TabConfig | undefined {
  let importedTabConfig: import("../config/schema").TabConfig | undefined;

  if (options.importTabConfig) {
    importedTabConfig = bundle.tabConfig;
  }

  if (options.importPersonalities) {
    if (options.mergeWithExisting) {
      const existing = loadCustomPersonalities();
      const existingIds = new Set(existing.map((p) => p.id));
      const newPersonalities = bundle.customPersonalities.filter((p) => !existingIds.has(p.id));
      saveCustomPersonalities([...existing, ...newPersonalities]);
    } else {
      saveCustomPersonalities(bundle.customPersonalities);
    }
  }

  if (options.importArtStyles) {
    if (options.mergeWithExisting) {
      const existing = loadCustomArtStyles();
      const existingIds = new Set(existing.map((s) => s.id));
      const newStyles = bundle.customArtStyles.filter((s) => !existingIds.has(s.id));
      saveCustomArtStyles([...existing, ...newStyles]);
    } else {
      saveCustomArtStyles(bundle.customArtStyles);
    }
  }

  if (options.importArtThemes) {
    if (options.mergeWithExisting) {
      const existing = loadCustomArtThemes();
      const existingIds = new Set(existing.map((t) => t.id));
      const newThemes = bundle.customArtThemes.filter((t) => !existingIds.has(t.id));
      saveCustomArtThemes([...existing, ...newThemes]);
    } else {
      saveCustomArtThemes(bundle.customArtThemes);
    }
  }

  return importedTabConfig;
}

/**
 * Get summary of what's in the config bundle
 */
export function getConfigBundleSummary(bundle: ConfigBundle): {
  hasTabConfig: boolean;
  personalitiesCount: number;
  artStylesCount: number;
  artThemesCount: number;
  exportedAt: string;
} {
  return {
    hasTabConfig: Boolean(bundle.tabConfig),
    personalitiesCount: bundle.customPersonalities.length,
    artStylesCount: bundle.customArtStyles.length,
    artThemesCount: bundle.customArtThemes.length,
    exportedAt: bundle.exportedAt,
  };
}
