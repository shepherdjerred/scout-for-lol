/**
 * Per-tab settings panel for tuning parameters
 */
import { useState, useSyncExternalStore } from "react";
import { z } from "zod";
import type { TabConfig, Personality } from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import { createDefaultTabConfig } from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import { BUILTIN_PERSONALITIES } from "@scout-for-lol/frontend/lib/review-tool/prompts";
import { ConfigImportModal } from "./config-import-modal";
import { downloadConfigBundle } from "@scout-for-lol/frontend/lib/review-tool/config-export";
import { ART_STYLES, ART_THEMES } from "@scout-for-lol/data";
import { TextGenerationSettings } from "./text-generation-settings";
import { ImageGenerationSettings } from "./image-generation-settings";
import { PromptSettings } from "./prompt-settings";
import { TabConfigActions } from "./tab-config-actions";

const ErrorSchema = z.object({ message: z.string() });
import {
  loadCustomPersonalities,
  addCustomPersonality,
  updateCustomPersonality,
  deleteCustomPersonality,
  generatePersonalityId,
} from "@scout-for-lol/frontend/lib/review-tool/personality-storage";
import type { CustomArtStyle, CustomArtTheme } from "@scout-for-lol/frontend/lib/review-tool/art-style-storage";
import {
  loadCustomArtStyles,
  addCustomArtStyle,
  updateCustomArtStyle,
  deleteCustomArtStyle,
  generateArtStyleId,
  loadCustomArtThemes,
  addCustomArtTheme,
  updateCustomArtTheme,
  deleteCustomArtTheme,
  generateArtThemeId,
} from "@scout-for-lol/frontend/lib/review-tool/art-style-storage";

type TabSettingsPanelProps = {
  config: TabConfig;
  onChange: (config: TabConfig) => void;
};

// Store for custom data
type CustomDataState = {
  personalities: Personality[];
  styles: CustomArtStyle[];
  themes: CustomArtTheme[];
};

let customDataState: CustomDataState = {
  personalities: [],
  styles: [],
  themes: [],
};

const customDataListeners = new Set<() => void>();

function subscribeToCustomData(callback: () => void) {
  customDataListeners.add(callback);
  return () => {
    customDataListeners.delete(callback);
  };
}

function getCustomDataSnapshot() {
  return customDataState;
}

// Load custom data at module level
let customDataLoadPromise: Promise<void> | null = null;

function loadCustomData() {
  customDataLoadPromise ??= (async () => {
    customDataState = {
      personalities: await loadCustomPersonalities(),
      styles: await loadCustomArtStyles(),
      themes: await loadCustomArtThemes(),
    };
    customDataListeners.forEach((listener) => {
      listener();
    });
  })();
  return customDataLoadPromise;
}

// Start loading immediately
void loadCustomData();

export function TabSettingsPanel({ config, onChange }: TabSettingsPanelProps) {
  // Subscribe to custom data store
  const customData = useSyncExternalStore(subscribeToCustomData, getCustomDataSnapshot, getCustomDataSnapshot);
  const { personalities: customPersonalities, styles: customStyles, themes: customThemes } = customData;

  const [editingPersonality, setEditingPersonality] = useState<Personality | null>(null);
  const [showPersonalityEditor, setShowPersonalityEditor] = useState(false);

  const [editingStyle, setEditingStyle] = useState<CustomArtStyle | null>(null);
  const [editingTheme, setEditingTheme] = useState<CustomArtTheme | null>(null);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);

  const allPersonalities = [...BUILTIN_PERSONALITIES.filter((p) => p.id !== "generic"), ...customPersonalities];

  // Convert built-in styles/themes to format with IDs
  const builtinStylesFormatted = ART_STYLES.map((style: { description: string }, index: number) => ({
    id: `builtin-style-${index.toString()}`,
    description: style.description,
  }));

  const builtinThemesFormatted = ART_THEMES.map((theme: { description: string }, index: number) => ({
    id: `builtin-theme-${index.toString()}`,
    description: theme.description,
  }));

  // Merge built-in and custom, removing any duplicates based on description
  const allStyles = [
    ...builtinStylesFormatted,
    ...customStyles.filter(
      (cs) => !builtinStylesFormatted.some((bs: { description: string }) => bs.description === cs.description),
    ),
  ];
  const allThemes = [
    ...builtinThemesFormatted,
    ...customThemes.filter(
      (ct) => !builtinThemesFormatted.some((bt: { description: string }) => bt.description === ct.description),
    ),
  ];

  const handleCreateNewPersonality = () => {
    setEditingPersonality(null);
    setShowPersonalityEditor(true);
  };

  const handleCreateNewStyle = () => {
    setEditingStyle(null);
    setShowStyleEditor(true);
  };

  const handleCreateNewTheme = () => {
    setEditingTheme(null);
    setShowThemeEditor(true);
  };

  const handleEditPersonality = (personality: Personality, createCopy = false) => {
    if (createCopy) {
      // Create a copy of built-in personality with a new ID
      const copy: Personality = {
        ...personality,
        id: generatePersonalityId(`${personality.metadata.name} (Copy)`),
        metadata: {
          ...personality.metadata,
          name: `${personality.metadata.name} (Copy)`,
        },
      };
      setEditingPersonality(copy);
    } else {
      setEditingPersonality(personality);
    }
    setShowPersonalityEditor(true);
  };

  const refreshCustomData = async () => {
    customDataState = {
      personalities: await loadCustomPersonalities(),
      styles: await loadCustomArtStyles(),
      themes: await loadCustomArtThemes(),
    };
    customDataListeners.forEach((listener) => {
      listener();
    });
  };

  const handleSavePersonality = async (personality: Personality) => {
    const existsInCustom = customPersonalities.some((p) => p.id === personality.id);

    if (editingPersonality && existsInCustom) {
      // Update existing custom personality
      await updateCustomPersonality(personality);
    } else {
      // Create new custom personality (or copy of built-in)
      const newPersonality = {
        ...personality,
        id: editingPersonality?.id ?? generatePersonalityId(personality.metadata.name),
      };
      await addCustomPersonality(newPersonality);
    }

    await refreshCustomData();
    setShowPersonalityEditor(false);
    setEditingPersonality(null);
  };

  const handleSaveStyle = async (style: CustomArtStyle) => {
    if (editingStyle && customStyles.some((s) => s.id === editingStyle.id)) {
      await updateCustomArtStyle(style);
    } else {
      const newStyle = {
        ...style,
        id: editingStyle?.id ?? generateArtStyleId(style.description),
      };
      await addCustomArtStyle(newStyle);
    }

    await refreshCustomData();
    setShowStyleEditor(false);
    setEditingStyle(null);
  };

  const handleSaveTheme = async (theme: CustomArtTheme) => {
    if (editingTheme && customThemes.some((t) => t.id === editingTheme.id)) {
      await updateCustomArtTheme(theme);
    } else {
      const newTheme = {
        ...theme,
        id: editingTheme?.id ?? generateArtThemeId(theme.description),
      };
      await addCustomArtTheme(newTheme);
    }

    await refreshCustomData();
    setShowThemeEditor(false);
    setEditingTheme(null);
  };

  const handleDeletePersonality = async (id: string) => {
    if (confirm("Are you sure you want to delete this personality?")) {
      await deleteCustomPersonality(id);
      await refreshCustomData();
      if (config.prompts.personalityId === id) {
        onChange({
          ...config,
          prompts: { ...config.prompts, personalityId: "random", customPersonality: undefined },
        });
      }
    }
  };

  const handleDeleteStyle = async (id: string) => {
    if (confirm("Are you sure you want to delete this custom art style?")) {
      await deleteCustomArtStyle(id);
      await refreshCustomData();
      // If this style was selected, reset to random
      const deletedStyle = customStyles.find((s) => s.id === id);
      if (deletedStyle && config.imageGeneration.artStyle === deletedStyle.description) {
        onChange({
          ...config,
          imageGeneration: { ...config.imageGeneration, artStyle: "random" },
        });
      }
    }
  };

  const handleDeleteTheme = async (id: string) => {
    if (confirm("Are you sure you want to delete this custom art theme?")) {
      await deleteCustomArtTheme(id);
      await refreshCustomData();
      // If this theme was selected, reset to random
      const deletedTheme = customThemes.find((t) => t.id === id);
      if (deletedTheme && config.imageGeneration.artTheme === deletedTheme.description) {
        onChange({
          ...config,
          imageGeneration: { ...config.imageGeneration, artTheme: "random" },
        });
      }
    }
  };

  const handleEditStyle = (style: { id: string; description: string }) => {
    const foundStyle = customStyles.find((s) => s.id === style.id);
    if (foundStyle) {
      setEditingStyle(foundStyle);
      setShowStyleEditor(true);
    }
  };

  const handleEditTheme = (theme: { id: string; description: string }) => {
    const foundTheme = customThemes.find((t) => t.id === theme.id);
    if (foundTheme) {
      setEditingTheme(foundTheme);
      setShowThemeEditor(true);
    }
  };

  const handleExportConfig = () => {
    void (async () => {
      try {
        await downloadConfigBundle(config);
      } catch (error) {
        const errorResult = ErrorSchema.safeParse(error);
        alert(`Failed to export config: ${errorResult.success ? errorResult.data.message : String(error)}`);
      }
    })();
  };

  const handleImportConfig = () => {
    setShowImportModal(true);
  };

  const handleImportSuccess = async (tabConfig?: TabConfig) => {
    if (tabConfig) {
      onChange(tabConfig);
    }
    // Reload personalities/styles/themes from storage
    await refreshCustomData();
  };

  const handleResetToDefaults = () => {
    if (
      confirm(
        "Reset this tab's settings to defaults? This will not affect custom personalities, art styles, or themes.",
      )
    ) {
      onChange(createDefaultTabConfig());
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Generation Settings</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tune parameters for this tab</p>
      </div>

      <div className="divide-y divide-gray-200">
        <TextGenerationSettings config={config} onChange={onChange} />

        <ImageGenerationSettings
          config={config}
          allStyles={allStyles}
          allThemes={allThemes}
          customStyles={customStyles}
          customThemes={customThemes}
          editingStyle={editingStyle}
          editingTheme={editingTheme}
          showStyleEditor={showStyleEditor}
          showThemeEditor={showThemeEditor}
          onChange={onChange}
          onCreateNewStyle={handleCreateNewStyle}
          onCreateNewTheme={handleCreateNewTheme}
          onEditStyle={handleEditStyle}
          onEditTheme={handleEditTheme}
          onDeleteStyle={handleDeleteStyle}
          onDeleteTheme={handleDeleteTheme}
          onSaveStyle={handleSaveStyle}
          onSaveTheme={handleSaveTheme}
          onCancelStyleEdit={() => {
            setShowStyleEditor(false);
            setEditingStyle(null);
          }}
          onCancelThemeEdit={() => {
            setShowThemeEditor(false);
            setEditingTheme(null);
          }}
        />

        <PromptSettings
          config={config}
          personalities={allPersonalities}
          customPersonalities={customPersonalities}
          editingPersonality={editingPersonality}
          showPersonalityEditor={showPersonalityEditor}
          onChange={onChange}
          onCreateNewPersonality={handleCreateNewPersonality}
          onEditPersonality={handleEditPersonality}
          onDeletePersonality={handleDeletePersonality}
          onSavePersonality={handleSavePersonality}
          onCancelPersonalityEdit={() => {
            setShowPersonalityEditor(false);
            setEditingPersonality(null);
          }}
        />
      </div>

      <TabConfigActions onExport={handleExportConfig} onImport={handleImportConfig} onReset={handleResetToDefaults} />

      {/* Import Modal */}
      <ConfigImportModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
        }}
        onImportSuccess={(tabConfig) => {
          void handleImportSuccess(tabConfig);
        }}
      />
    </div>
  );
}
