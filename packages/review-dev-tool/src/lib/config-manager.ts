/**
 * Configuration persistence and import/export
 */
import { z } from "zod";
import type { ReviewConfig, GlobalConfig } from "../config/schema";
import { GlobalConfigSchema } from "../config/schema";
// eslint-disable-next-line @typescript-eslint/no-deprecated,import/no-duplicates -- needed for backward compatibility
import { ReviewConfigSchema } from "../config/schema";

const STORAGE_KEY = "review-dev-tool-configs";
const CURRENT_CONFIG_KEY = "review-dev-tool-current";
const GLOBAL_CONFIG_KEY = "review-dev-tool-global-config";

/**
 * Saved configuration with name
 */
export type SavedConfig = {
  id: string;
  name: string;
  config: ReviewConfig;
  createdAt: string;
  updatedAt: string;
};

/**
 * Load all saved configurations from localStorage
 */
export function loadSavedConfigs(): SavedConfig[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    const SavedConfigArraySchema = z
      .object({
        id: z.string(),
        name: z.string(),
        config: z.unknown(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
      .array();
    const result = SavedConfigArraySchema.safeParse(parsed);
    if (!result.success) return [];
    // Map and validate each config
    const configs: SavedConfig[] = [];
    for (const item of result.data) {
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- backward compatibility: validate old format configs
      const configResult = ReviewConfigSchema.safeParse(item.config);
      if (configResult.success) {
        configs.push({
          id: item.id,
          name: item.name,
          config: configResult.data,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      }
    }
    return configs;
  } catch {
    return [];
  }
}

/**
 * Save a configuration to localStorage
 */
export function saveConfig(name: string, config: ReviewConfig): SavedConfig {
  const configs = loadSavedConfigs();
  const id = generateId();
  const now = new Date().toISOString();

  const savedConfig: SavedConfig = {
    id,
    name,
    config,
    createdAt: now,
    updatedAt: now,
  };

  configs.push(savedConfig);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));

  return savedConfig;
}

/**
 * Update an existing configuration
 */
export function updateConfig(id: string, name: string, config: ReviewConfig): SavedConfig | null {
  const configs = loadSavedConfigs();
  const index = configs.findIndex((c) => c.id === id);

  if (index === -1) {
    return null;
  }

  const existingConfig = configs[index];
  if (!existingConfig) {
    return null;
  }

  const updatedConfig: SavedConfig = {
    ...existingConfig,
    name,
    config,
    updatedAt: new Date().toISOString(),
  };

  configs[index] = updatedConfig;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));

  return updatedConfig;
}

/**
 * Delete a configuration
 */
export function deleteConfig(id: string): boolean {
  const configs = loadSavedConfigs();
  const filtered = configs.filter((c) => c.id !== id);

  if (filtered.length === configs.length) {
    return false;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Load current active configuration
 */
export function loadCurrentConfig(): ReviewConfig | null {
  const stored = localStorage.getItem(CURRENT_CONFIG_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- backward compatibility: parse old format configs
    const result = ReviewConfigSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Save current active configuration
 */
export function saveCurrentConfig(config: ReviewConfig): void {
  localStorage.setItem(CURRENT_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Export configuration as JSON string
 */
export function exportConfigAsJSON(config: ReviewConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Import configuration from JSON string
 */
export function importConfigFromJSON(json: string): ReviewConfig {
  const parsed = JSON.parse(json) as unknown;
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- backward compatibility: parse old format configs
  return ReviewConfigSchema.parse(parsed);
}

/**
 * Export configuration as shareable URL hash
 */
export function exportConfigAsURLHash(config: ReviewConfig): string {
  const json = JSON.stringify(config);
  const base64 = btoa(json);
  return base64;
}

/**
 * Import configuration from URL hash
 */
export function importConfigFromURLHash(hash: string): ReviewConfig {
  const json = atob(hash);
  const parsed = JSON.parse(json) as unknown;
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- backward compatibility: parse old format configs
  return ReviewConfigSchema.parse(parsed);
}

/**
 * Export multiple configurations
 */
export function exportMultipleConfigs(configs: SavedConfig[]): string {
  return JSON.stringify(configs, null, 2);
}

/**
 * Import multiple configurations
 */
export function importMultipleConfigs(json: string): SavedConfig[] {
  const parsed = JSON.parse(json) as unknown;
  const SavedConfigArraySchema = z
    .object({
      id: z.string(),
      name: z.string(),
      config: z.unknown(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .array();
  const result = SavedConfigArraySchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("Invalid format: expected array of configurations");
  }
  // Map and validate each config
  const configs: SavedConfig[] = [];
  for (const item of result.data) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- backward compatibility: validate old format configs
    const configResult = ReviewConfigSchema.safeParse(item.config);
    if (!configResult.success) {
      throw new Error(`Invalid configuration format for item ${item.id}`);
    }
    configs.push({
      id: item.id,
      name: item.name,
      config: configResult.data,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  }
  return configs;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Load global configuration (API keys shared across tabs)
 */
export function loadGlobalConfig(): GlobalConfig | null {
  const stored = localStorage.getItem(GLOBAL_CONFIG_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    return GlobalConfigSchema.parse(parsed);
  } catch {
    return null;
  }
}

/**
 * Save global configuration (API keys shared across tabs)
 */
export function saveGlobalConfig(config: GlobalConfig): void {
  localStorage.setItem(GLOBAL_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Export global config as base64-encoded string (for sharing API keys)
 */
export function exportGlobalConfigAsBlob(config: GlobalConfig): string {
  const json = JSON.stringify(config);
  return btoa(json);
}

/**
 * Import global config from base64-encoded string
 */
export function importGlobalConfigFromBlob(blob: string): GlobalConfig {
  try {
    const json = atob(blob);
    const parsed = JSON.parse(json) as unknown;
    return GlobalConfigSchema.parse(parsed);
  } catch (_error) {
    throw new Error("Invalid config blob. Please check the format and try again.");
  }
}
