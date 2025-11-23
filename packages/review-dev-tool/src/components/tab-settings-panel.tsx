/**
 * Per-tab settings panel for tuning parameters
 */
import { useState, useEffect } from "react";
import type { TabConfig, Personality } from "../config/schema";
import { createDefaultTabConfig } from "../config/schema";
import { getBasePrompt, BUILTIN_PERSONALITIES } from "../lib/prompts";
import { PersonalityEditor } from "./personality-editor";
import { ArtStyleEditor } from "./art-style-editor";
import { ConfigImportModal } from "./config-import-modal";
import { downloadConfigBundle } from "../lib/config-export";
import { ART_STYLES, ART_THEMES } from "../data/art-styles";
import {
  loadCustomPersonalities,
  addCustomPersonality,
  updateCustomPersonality,
  deleteCustomPersonality,
  isCustomPersonality,
  generatePersonalityId,
} from "../lib/personality-storage";
import type { CustomArtStyle, CustomArtTheme } from "../lib/art-style-storage";
import {
  loadCustomArtStyles,
  addCustomArtStyle,
  updateCustomArtStyle,
  deleteCustomArtStyle,
  isCustomArtStyle,
  generateArtStyleId,
  loadCustomArtThemes,
  addCustomArtTheme,
  updateCustomArtTheme,
  deleteCustomArtTheme,
  isCustomArtTheme,
  generateArtThemeId,
} from "../lib/art-style-storage";
import { modelSupportsParameter } from "../lib/models";

type TabSettingsPanelProps = {
  config: TabConfig;
  onChange: (config: TabConfig) => void;
};

export function TabSettingsPanel({ config, onChange }: TabSettingsPanelProps) {
  const [customPersonalities, setCustomPersonalities] = useState<Personality[]>([]);
  const [editingPersonality, setEditingPersonality] = useState<Personality | null>(null);
  const [showPersonalityEditor, setShowPersonalityEditor] = useState(false);

  const [customStyles, setCustomStyles] = useState<CustomArtStyle[]>([]);
  const [customThemes, setCustomThemes] = useState<CustomArtTheme[]>([]);
  const [editingStyle, setEditingStyle] = useState<CustomArtStyle | null>(null);
  const [editingTheme, setEditingTheme] = useState<CustomArtTheme | null>(null);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    setCustomPersonalities(loadCustomPersonalities());
    setCustomStyles(loadCustomArtStyles());
    setCustomThemes(loadCustomArtThemes());
  }, []);

  const allPersonalities = [...BUILTIN_PERSONALITIES.filter((p) => p.id !== "generic"), ...customPersonalities];

  // Convert built-in styles/themes to format with IDs (use Array.from to avoid readonly issues)
  const builtinStylesFormatted = Array.from(ART_STYLES).map((style, index) => ({
    id: `builtin-style-${index}`,
    description: style,
  }));

  const builtinThemesFormatted = Array.from(ART_THEMES).map((theme, index) => ({
    id: `builtin-theme-${index}`,
    description: theme,
  }));

  // Merge built-in and custom, removing any duplicates based on description
  const allStyles = [
    ...builtinStylesFormatted,
    ...customStyles.filter((cs) => !builtinStylesFormatted.some((bs) => bs.description === cs.description)),
  ];
  const allThemes = [
    ...builtinThemesFormatted,
    ...customThemes.filter((ct) => !builtinThemesFormatted.some((bt) => bt.description === ct.description)),
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

  const handleEdit = (personality: Personality, createCopy = false) => {
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

  const handleSavePersonality = (personality: Personality) => {
    const existsInCustom = customPersonalities.some((p) => p.id === personality.id);

    if (editingPersonality && existsInCustom) {
      // Update existing custom personality
      updateCustomPersonality(personality.id, personality);
    } else {
      // Create new custom personality (or copy of built-in)
      const newPersonality = {
        ...personality,
        id: editingPersonality?.id || generatePersonalityId(personality.metadata.name),
      };
      addCustomPersonality(newPersonality);
    }

    setCustomPersonalities(loadCustomPersonalities());
    setShowPersonalityEditor(false);
    setEditingPersonality(null);
  };

  const handleSaveStyle = (style: CustomArtStyle) => {
    if (editingStyle && customStyles.some((s) => s.id === editingStyle.id)) {
      updateCustomArtStyle(style.id, style);
    } else {
      const newStyle = {
        ...style,
        id: editingStyle?.id || generateArtStyleId(style.description),
      };
      addCustomArtStyle(newStyle);
    }

    setCustomStyles(loadCustomArtStyles());
    setShowStyleEditor(false);
    setEditingStyle(null);
  };

  const handleSaveTheme = (theme: CustomArtTheme) => {
    if (editingTheme && customThemes.some((t) => t.id === editingTheme.id)) {
      updateCustomArtTheme(theme.id, theme);
    } else {
      const newTheme = {
        ...theme,
        id: editingTheme?.id || generateArtThemeId(theme.description),
      };
      addCustomArtTheme(newTheme);
    }

    setCustomThemes(loadCustomArtThemes());
    setShowThemeEditor(false);
    setEditingTheme(null);
  };

  const handleDeletePersonality = (id: string) => {
    if (confirm("Are you sure you want to delete this personality?")) {
      deleteCustomPersonality(id);
      setCustomPersonalities(loadCustomPersonalities());
      if (config.prompts.personalityId === id) {
        onChange({
          ...config,
          prompts: { ...config.prompts, personalityId: "random", customPersonality: undefined },
        });
      }
    }
  };

  const handleDeleteStyle = (id: string) => {
    if (confirm("Are you sure you want to delete this custom art style?")) {
      deleteCustomArtStyle(id);
      setCustomStyles(loadCustomArtStyles());
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

  const handleDeleteTheme = (id: string) => {
    if (confirm("Are you sure you want to delete this custom art theme?")) {
      deleteCustomArtTheme(id);
      setCustomThemes(loadCustomArtThemes());
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

  const handleSelectPersonality = (personality: Personality) => {
    onChange({
      ...config,
      prompts: {
        ...config.prompts,
        customPersonality: personality,
        personalityId: personality.id,
      },
    });
  };

  const handleExportConfig = () => {
    try {
      downloadConfigBundle(config);
    } catch (error) {
      alert(`Failed to export config: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleImportConfig = () => {
    setShowImportModal(true);
  };

  const handleImportSuccess = (tabConfig?: TabConfig) => {
    if (tabConfig) {
      onChange(tabConfig);
    }
    // Reload personalities/styles/themes from storage
    setCustomPersonalities(loadCustomPersonalities());
    setCustomStyles(loadCustomArtStyles());
    setCustomThemes(loadCustomArtThemes());
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

  const handleSelectStyle = (style: { id: string; description: string }) => {
    onChange({
      ...config,
      imageGeneration: { ...config.imageGeneration, artStyle: style.description },
    });
  };

  const handleSelectTheme = (theme: { id: string; description: string }) => {
    onChange({
      ...config,
      imageGeneration: { ...config.imageGeneration, artTheme: theme.description },
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Generation Settings</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tune parameters for this tab</p>
      </div>

      <div className="divide-y divide-gray-200">
        {/* Text Generation Settings */}
        <div>
          <div className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">Text Generation</span>
          </div>
          <div>
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
                <select
                  value={config.textGeneration.model}
                  onChange={(e) => {
                    onChange({
                      ...config,
                      textGeneration: { ...config.textGeneration, model: e.target.value },
                    });
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="gpt-5">GPT-5</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Tokens: {config.textGeneration.maxTokens}
                </label>
                <input
                  type="range"
                  min="100"
                  max="100000"
                  step="100"
                  value={config.textGeneration.maxTokens}
                  onChange={(e) => {
                    onChange({
                      ...config,
                      textGeneration: {
                        ...config.textGeneration,
                        maxTokens: Number.parseInt(e.target.value),
                      },
                    });
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Temperature: {config.textGeneration.temperature.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.textGeneration.temperature}
                  onChange={(e) => {
                    onChange({
                      ...config,
                      textGeneration: {
                        ...config.textGeneration,
                        temperature: Number.parseFloat(e.target.value),
                      },
                    });
                  }}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Note: Temperature parameter is currently disabled to ensure compatibility with all models.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Top P: {config.textGeneration.topP.toFixed(2)}
                  {!modelSupportsParameter(config.textGeneration.model, "topP") && (
                    <span className="ml-2 text-xs text-amber-600">(Not supported by this model)</span>
                  )}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.textGeneration.topP}
                  onChange={(e) => {
                    onChange({
                      ...config,
                      textGeneration: {
                        ...config.textGeneration,
                        topP: Number.parseFloat(e.target.value),
                      },
                    });
                  }}
                  className="w-full"
                  disabled={!modelSupportsParameter(config.textGeneration.model, "topP")}
                />
                {!modelSupportsParameter(config.textGeneration.model, "topP") && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ This model does not support custom top_p values. The API will use its default.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Image Generation Settings */}
        <div>
          <div className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">Image Generation</span>
          </div>
          <div>
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.imageGeneration.enabled}
                  onChange={(e) => {
                    onChange({
                      ...config,
                      imageGeneration: { ...config.imageGeneration, enabled: e.target.checked },
                    });
                  }}
                  className="rounded"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Image Generation</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
                <select
                  value={config.imageGeneration.model}
                  onChange={(e) => {
                    onChange({
                      ...config,
                      imageGeneration: { ...config.imageGeneration, model: e.target.value },
                    });
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  disabled={!config.imageGeneration.enabled}
                >
                  <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image Preview</option>
                  <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timeout: {(config.imageGeneration.timeoutMs / 1000).toFixed(0)}s
                </label>
                <input
                  type="range"
                  min="10000"
                  max="300000"
                  step="5000"
                  value={config.imageGeneration.timeoutMs}
                  onChange={(e) => {
                    onChange({
                      ...config,
                      imageGeneration: {
                        ...config.imageGeneration,
                        timeoutMs: Number.parseInt(e.target.value),
                      },
                    });
                  }}
                  className="w-full"
                  disabled={!config.imageGeneration.enabled}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.imageGeneration.useMatchingPairs}
                  onChange={(e) => {
                    onChange({
                      ...config,
                      imageGeneration: {
                        ...config.imageGeneration,
                        useMatchingPairs: e.target.checked,
                      },
                    });
                  }}
                  className="rounded"
                  disabled={!config.imageGeneration.enabled}
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Use Matching Style-Theme Pairs
                </label>
              </div>
              {config.imageGeneration.useMatchingPairs && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Matching Pair Probability: {(config.imageGeneration.matchingPairProbability * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.imageGeneration.matchingPairProbability}
                    onChange={(e) => {
                      onChange({
                        ...config,
                        imageGeneration: {
                          ...config.imageGeneration,
                          matchingPairProbability: Number.parseFloat(e.target.value),
                        },
                      });
                    }}
                    className="w-full"
                    disabled={!config.imageGeneration.enabled}
                  />
                </div>
              )}

              {/* Art Style Selector */}
              {showStyleEditor ? (
                <div>
                  <ArtStyleEditor
                    mode="style"
                    style={editingStyle ?? undefined}
                    onSave={handleSaveStyle}
                    onCancel={() => {
                      setShowStyleEditor(false);
                      setEditingStyle(null);
                    }}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Art Styles ({allStyles.length})
                    </label>
                    <button
                      onClick={handleCreateNewStyle}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                      disabled={!config.imageGeneration.enabled}
                    >
                      + Create New
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        onChange({
                          ...config,
                          imageGeneration: { ...config.imageGeneration, artStyle: "random" },
                        });
                      }}
                      className={`
                        w-full p-2 rounded border transition-colors text-left
                        ${config.imageGeneration.artStyle === "random" ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}
                      `}
                      disabled={!config.imageGeneration.enabled}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-medium text-gray-900 dark:text-white">Random</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Pick a random style for each review
                          </p>
                        </div>
                        {config.imageGeneration.artStyle === "random" && (
                          <span className="text-blue-600 text-xs">✓</span>
                        )}
                      </div>
                    </button>

                    {allStyles.map((style) => {
                      const isCustom = isCustomArtStyle(style.id);
                      const isSelected = config.imageGeneration.artStyle === style.description;
                      return (
                        <div
                          key={style.id}
                          className={`
                            p-2 rounded border transition-colors
                            ${isSelected ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}
                          `}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1">
                                {isCustom && (
                                  <span className="px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded flex-shrink-0">
                                    Custom
                                  </span>
                                )}
                                {isSelected && <span className="text-blue-600 text-xs flex-shrink-0">✓</span>}
                              </div>
                              <p className="text-xs text-gray-900 dark:text-white">{style.description}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => {
                                  handleSelectStyle(style);
                                }}
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 whitespace-nowrap"
                                disabled={!config.imageGeneration.enabled}
                              >
                                {isSelected ? "✓" : "Use"}
                              </button>
                              {isCustom && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingStyle(style);
                                      setShowStyleEditor(true);
                                    }}
                                    className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                                    disabled={!config.imageGeneration.enabled}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteStyle(style.id);
                                    }}
                                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                    disabled={!config.imageGeneration.enabled}
                                  >
                                    Del
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Art Theme Selector */}
              {showThemeEditor ? (
                <div>
                  <ArtStyleEditor
                    mode="theme"
                    theme={editingTheme ?? undefined}
                    onSave={handleSaveTheme}
                    onCancel={() => {
                      setShowThemeEditor(false);
                      setEditingTheme(null);
                    }}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Art Themes ({allThemes.length})
                    </label>
                    <button
                      onClick={handleCreateNewTheme}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                      disabled={!config.imageGeneration.enabled}
                    >
                      + Create New
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        onChange({
                          ...config,
                          imageGeneration: { ...config.imageGeneration, artTheme: "random" },
                        });
                      }}
                      className={`
                        w-full p-2 rounded border transition-colors text-left
                        ${config.imageGeneration.artTheme === "random" ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}
                      `}
                      disabled={!config.imageGeneration.enabled}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-medium text-gray-900 dark:text-white">Random</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Pick a random theme for each review
                          </p>
                        </div>
                        {config.imageGeneration.artTheme === "random" && (
                          <span className="text-blue-600 text-xs">✓</span>
                        )}
                      </div>
                    </button>

                    {allThemes.map((theme) => {
                      const isCustom = isCustomArtTheme(theme.id);
                      const isSelected = config.imageGeneration.artTheme === theme.description;
                      return (
                        <div
                          key={theme.id}
                          className={`
                            p-2 rounded border transition-colors
                            ${isSelected ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}
                          `}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1">
                                {isCustom && (
                                  <span className="px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded flex-shrink-0">
                                    Custom
                                  </span>
                                )}
                                {isSelected && <span className="text-blue-600 text-xs flex-shrink-0">✓</span>}
                              </div>
                              <p className="text-xs text-gray-900 dark:text-white">{theme.description}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => {
                                  handleSelectTheme(theme);
                                }}
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 whitespace-nowrap"
                                disabled={!config.imageGeneration.enabled}
                              >
                                {isSelected ? "✓" : "Use"}
                              </button>
                              {isCustom && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingTheme(theme);
                                      setShowThemeEditor(true);
                                    }}
                                    className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                                    disabled={!config.imageGeneration.enabled}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteTheme(theme.id);
                                    }}
                                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                    disabled={!config.imageGeneration.enabled}
                                  >
                                    Del
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mashup Mode */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={config.imageGeneration.mashupMode}
                    onChange={(e) => {
                      onChange({
                        ...config,
                        imageGeneration: {
                          ...config.imageGeneration,
                          mashupMode: e.target.checked,
                        },
                      });
                    }}
                    className="rounded"
                    disabled={!config.imageGeneration.enabled}
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Mashup Mode (2 Themes)
                  </label>
                </div>

                {config.imageGeneration.mashupMode && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Second Art Theme
                      </label>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <button
                        onClick={() => {
                          onChange({
                            ...config,
                            imageGeneration: { ...config.imageGeneration, secondArtTheme: "random" },
                          });
                        }}
                        className={`
                          w-full p-2 rounded border transition-colors text-left
                          ${config.imageGeneration.secondArtTheme === "random" ? "border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}
                        `}
                        disabled={!config.imageGeneration.enabled}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-medium text-gray-900 dark:text-white">Random</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Pick a random second theme for each review
                            </p>
                          </div>
                          {config.imageGeneration.secondArtTheme === "random" && (
                            <span className="text-purple-600 text-xs">✓</span>
                          )}
                        </div>
                      </button>

                      {allThemes.map((theme) => {
                        const isCustom = isCustomArtTheme(theme.id);
                        const isSelected = config.imageGeneration.secondArtTheme === theme.description;
                        return (
                          <div
                            key={theme.id}
                            className={`
                              p-2 rounded border transition-colors
                              ${isSelected ? "border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}
                            `}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-1">
                                  {isCustom && (
                                    <span className="px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded flex-shrink-0">
                                      Custom
                                    </span>
                                  )}
                                  {isSelected && <span className="text-purple-600 text-xs flex-shrink-0">✓</span>}
                                </div>
                                <p className="text-xs text-gray-900 dark:text-white">{theme.description}</p>
                              </div>
                              <button
                                onClick={() => {
                                  onChange({
                                    ...config,
                                    imageGeneration: { ...config.imageGeneration, secondArtTheme: theme.description },
                                  });
                                }}
                                className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 whitespace-nowrap"
                                disabled={!config.imageGeneration.enabled}
                              >
                                {isSelected ? "✓" : "Use"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Settings */}
        <div>
          <div className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">Prompts & Personality</span>
          </div>
          <div>
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Prompt</label>
                <textarea
                  value={config.prompts.basePrompt || getBasePrompt()}
                  onChange={(e) => {
                    onChange({
                      ...config,
                      prompts: { ...config.prompts, basePrompt: e.target.value },
                    });
                  }}
                  rows={6}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Base prompt template..."
                />
                <button
                  onClick={() => {
                    onChange({
                      ...config,
                      prompts: { ...config.prompts, basePrompt: getBasePrompt() },
                    });
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Reset to Default
                </button>
              </div>

              {showPersonalityEditor ? (
                <div>
                  <PersonalityEditor
                    personality={editingPersonality ?? undefined}
                    onSave={handleSavePersonality}
                    onCancel={() => {
                      setShowPersonalityEditor(false);
                      setEditingPersonality(null);
                    }}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Personalities ({allPersonalities.length})
                    </label>
                    <button
                      onClick={handleCreateNewPersonality}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      + Create New
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <button
                      onClick={() => {
                        onChange({
                          ...config,
                          prompts: { ...config.prompts, personalityId: "random", customPersonality: undefined },
                        });
                      }}
                      className={`
                        w-full p-3 rounded border transition-colors text-left
                        ${config.prompts.personalityId === "random" ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Random</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Pick a random personality for each review
                          </p>
                        </div>
                        {config.prompts.personalityId === "random" && (
                          <span className="text-blue-600 text-xs">✓ Active</span>
                        )}
                      </div>
                    </button>

                    {allPersonalities.map((personality) => {
                      const isCustom = isCustomPersonality(personality.id);
                      const isSelected = config.prompts.personalityId === personality.id;
                      return (
                        <div
                          key={personality.id}
                          className={`
                            p-3 rounded border transition-colors
                            ${isSelected ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}
                          `}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {personality.metadata.name}
                                </h4>
                                {isCustom && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                    Custom
                                  </span>
                                )}
                                {isSelected && <span className="text-blue-600 text-xs">✓</span>}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {personality.metadata.description.substring(0, 80)}
                                {personality.metadata.description.length > 80 ? "..." : ""}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {personality.metadata.favoriteChampions.slice(0, 3).map((champ) => (
                                  <span
                                    key={champ}
                                    className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
                                  >
                                    {champ}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 ml-2">
                              <button
                                onClick={() => {
                                  handleSelectPersonality(personality);
                                }}
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 whitespace-nowrap"
                              >
                                {isSelected ? "Active" : "Use"}
                              </button>
                              {isCustom ? (
                                <>
                                  <button
                                    onClick={() => {
                                      handleEdit(personality, false);
                                    }}
                                    className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeletePersonality(personality.id);
                                    }}
                                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                  >
                                    Del
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    handleEdit(personality, true);
                                  }}
                                  className="px-2 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700"
                                  title="Create an editable copy"
                                >
                                  Copy
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Config Actions */}
      <div className="p-6 mt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleExportConfig}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            title="Export tab settings, custom personalities, art styles, and themes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Config
          </button>
          <button
            onClick={handleImportConfig}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            title="Import config from JSON"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import Config
          </button>
          <button
            onClick={handleResetToDefaults}
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            title="Reset tab settings to defaults"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Import Modal */}
      <ConfigImportModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
        }}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
