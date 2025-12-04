/**
 * Tauri adapter for the Sound Pack Editor
 *
 * Provides platform-specific implementations for the sound pack editor using Tauri APIs.
 */

import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type {
  SoundPackAdapter,
  Champion,
  LocalPlayer,
  CacheStatus,
} from "@scout-for-lol/ui";
import type { SoundPack, SoundSource } from "@scout-for-lol/data";
import { SoundPackSchema, getChampionImageUrl } from "@scout-for-lol/data";
import { z } from "zod";

/**
 * Creates a Tauri-specific adapter for the sound pack editor
 * @param onSave - Optional callback called after saving a sound pack
 */
export function createTauriAdapter(onSave?: () => void): SoundPackAdapter {
  return {
    // =========================================================================
    // File Operations
    // =========================================================================

    selectAudioFile: async () => {
      const result = await open({
        multiple: false,
        filters: [
          {
            name: "Audio",
            extensions: ["mp3", "wav", "ogg", "flac", "m4a"],
          },
        ],
      });

      return result;
    },

    // =========================================================================
    // Sound Preview
    // =========================================================================

    playSound: async (source: SoundSource) => {
      await invoke("play_preview_sound", { source });
    },

    stopSound: () => {
      void (async () => {
        try {
          await invoke("stop_preview_sound");
        } catch (error) {
          console.error(error);
        }
      })();
    },

    // =========================================================================
    // YouTube Caching
    // =========================================================================

    cacheYouTubeAudio: async (url: string) => {
      const result = await invoke<{ cachedPath: string }>("cache_youtube_audio", {
        url,
      });
      return result;
    },

    getCacheStatus: async (url: string): Promise<CacheStatus> => {
      try {
        const result = await invoke<CacheStatus>("get_cache_status", { url });
        return result;
      } catch {
        return "not-cached";
      }
    },

    // =========================================================================
    // Import/Export
    // =========================================================================

    exportSoundPack: async (pack: SoundPack) => {
      const path = await save({
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: `${pack.name.replace(/[^a-z0-9]/gi, "-")}.json`,
      });

      if (path) {
        const content = JSON.stringify(pack, null, 2);
        await writeTextFile(path, content);
      }
    },

    importSoundPack: async () => {
      const path = await open({
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (path && typeof path === "string") {
        const content = await readTextFile(path);
        const data: unknown = JSON.parse(content);
        const result = SoundPackSchema.safeParse(data);
        if (result.success) {
          return result.data;
        }
        throw new Error("Invalid sound pack format");
      }

      return null;
    },

    // =========================================================================
    // Data Sources
    // =========================================================================

    getChampions: async () => {
      // Try to get champions from the backend (which has access to local data)
      try {
        const champions = await invoke<Champion[]>("get_champions");
        return champions;
      } catch {
        // Fallback: return empty array (user can type manually)
        return [];
      }
    },

    getLocalPlayer: async () => {
      try {
        const player = await invoke<LocalPlayer | null>("get_local_player");
        return player;
      } catch {
        return null;
      }
    },

    // =========================================================================
    // Persistence
    // =========================================================================

    saveSoundPack: async (pack: SoundPack) => {
      console.log("Saving sound pack:", pack.name, "with", pack.rules.length, "rules");
      await invoke("save_sound_pack", { pack });
      console.log("Sound pack saved successfully");
      // Notify parent of save so it can refresh available packs
      onSave?.();
    },

    loadSoundPack: async () => {
      try {
        const pack = await invoke<SoundPack | null>("load_sound_pack");
        if (pack) {
          const result = SoundPackSchema.safeParse(pack);
          if (result.success) {
            return result.data;
          }
          // Log validation errors for debugging
          console.error("Sound pack validation failed:", z.treeifyError(result.error));
        }
        return null;
      } catch (error) {
        console.error("Failed to load sound pack:", error);
        return null;
      }
    },
  };
}

/**
 * Get the URL for a champion's square icon
 */
export function getChampionIconUrl(championId: string): string {
  return getChampionImageUrl(championId);
}
