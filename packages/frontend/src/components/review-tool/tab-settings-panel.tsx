/**
 * Per-tab settings panel for tuning parameters
 */
import { useState, useSyncExternalStore } from "react";
import { z } from "zod";
import type { TabConfig, Personality } from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import {
  createDefaultTabConfig,
  createDefaultPipelineStages,
} from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import { BUILTIN_PERSONALITIES } from "@scout-for-lol/frontend/lib/review-tool/prompts";
import { ConfigImportModal } from "./config-import-modal.tsx";
import { downloadConfigBundle } from "@scout-for-lol/frontend/lib/review-tool/config-export";
import { ART_STYLES } from "@scout-for-lol/data";
import { TextGenerationSettings } from "./text-generation-settings.tsx";
import { ImageGenerationSettings } from "./image-generation-settings.tsx";
import { PromptSettings } from "./prompt-settings.tsx";
import { TabConfigActions } from "./tab-config-actions.tsx";

const ErrorSchema = z.object({ message: z.string() });
import {
  loadCustomPersonalities,
  addCustomPersonality,
  updateCustomPersonality,
  deleteCustomPersonality,
  generatePersonalityId,
} from "@scout-for-lol/frontend/lib/review-tool/personality-storage";
import type { CustomArtStyle } from "@scout-for-lol/frontend/lib/review-tool/art-style-storage";
import {
  loadCustomArtStyles,
  addCustomArtStyle,
  updateCustomArtStyle,
  deleteCustomArtStyle,
  generateArtStyleId,
} from "@scout-for-lol/frontend/lib/review-tool/art-style-storage";
import { StageConfigSections } from "./stage-config/stage-config-sections.tsx";

type TabSettingsPanelProps = {
  config: TabConfig;
  onChange: (config: TabConfig) => void;
};

// Store for custom data
type CustomDataState = {
  personalities: Personality[];
  styles: CustomArtStyle[];
};

let customDataState: CustomDataState = {
  personalities: [],
  styles: [],
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
    };
    customDataListeners.forEach((listener) => {
      listener();
    });
  })();
  return customDataLoadPromise;
}

// Start loading immediately
void loadCustomData();

function getStagesOrDefault(config: TabConfig) {
  return config.stages ?? createDefaultPipelineStages();
}

export function TabSettingsPanel({ config, onChange }: TabSettingsPanelProps) {
  // Subscribe to custom data store
  const customData = useSyncExternalStore(subscribeToCustomData, getCustomDataSnapshot, getCustomDataSnapshot);
  const { personalities: customPersonalities, styles: customStyles } = customData;

  const [editingPersonality, setEditingPersonality] = useState<Personality | null>(null);
  const [showPersonalityEditor, setShowPersonalityEditor] = useState(false);

  const [editingStyle, setEditingStyle] = useState<CustomArtStyle | null>(null);
  const [showStyleEditor, setShowStyleEditor] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);

  const allPersonalities = [...BUILTIN_PERSONALITIES.filter((p) => p.id !== "generic"), ...customPersonalities];

  // Convert built-in styles/themes to format with IDs
  const builtinStylesFormatted = ART_STYLES.map((style: { description: string }, index: number) => ({
    id: `builtin-style-${index.toString()}`,
    description: style.description,
  }));

  // Merge built-in and custom, removing any duplicates based on description
  const allStyles = [
    ...builtinStylesFormatted,
    ...customStyles.filter(
      (cs) => !builtinStylesFormatted.some((bs: { description: string }) => bs.description === cs.description),
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

  const handleEditStyle = (style: { id: string; description: string }) => {
    const foundStyle = customStyles.find((s) => s.id === style.id);
    if (foundStyle) {
      setEditingStyle(foundStyle);
      setShowStyleEditor(true);
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
    if (confirm("Reset this tab's settings to defaults? This will not affect custom personalities or art styles.")) {
      onChange(createDefaultTabConfig());
    }
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-200/50 dark:border-surface-700/50">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Generation Settings</h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">Configure how reviews are generated</p>
      </div>

      <div className="divide-y divide-surface-200/50 dark:divide-surface-700/50">
        <div className="px-4 py-5 bg-surface-50 dark:bg-surface-900">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white">Pipeline stages</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Configure the unified review pipeline stages used by frontend and backend.
            </p>
          </div>
          <StageConfigSections
            stages={getStagesOrDefault(config)}
            onChange={(next) => {
              onChange({ ...config, stages: next });
            }}
          />
        </div>

        <TextGenerationSettings config={config} onChange={onChange} />

        <ImageGenerationSettings
          config={config}
          allStyles={allStyles}
          customStyles={customStyles}
          editingStyle={editingStyle}
          showStyleEditor={showStyleEditor}
          onChange={onChange}
          onCreateNewStyle={handleCreateNewStyle}
          onEditStyle={handleEditStyle}
          onDeleteStyle={handleDeleteStyle}
          onSaveStyle={handleSaveStyle}
          onCancelStyleEdit={() => {
            setShowStyleEditor(false);
            setEditingStyle(null);
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
