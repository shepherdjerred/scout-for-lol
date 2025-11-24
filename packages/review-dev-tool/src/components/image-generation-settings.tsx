/**
 * Image generation settings controls
 */
import type { TabConfig } from "@scout-for-lol/review-dev-tool/config/schema";
import { getImagePricing } from "@scout-for-lol/data";
import { ArtStyleSelector } from "@scout-for-lol/review-dev-tool/components/art-style-selector";
import { ArtThemeSelector } from "@scout-for-lol/review-dev-tool/components/art-theme-selector";
import type { CustomArtStyle, CustomArtTheme } from "@scout-for-lol/review-dev-tool/lib/art-style-storage";

type ImageGenerationSettingsProps = {
  config: TabConfig;
  allStyles: Array<{ id: string; description: string }>;
  allThemes: Array<{ id: string; description: string }>;
  customStyles: CustomArtStyle[];
  customThemes: CustomArtTheme[];
  editingStyle: CustomArtStyle | null;
  editingTheme: CustomArtTheme | null;
  showStyleEditor: boolean;
  showThemeEditor: boolean;
  onChange: (config: TabConfig) => void;
  onCreateNewStyle: () => void;
  onCreateNewTheme: () => void;
  onEditStyle: (style: { id: string; description: string }) => void;
  onEditTheme: (theme: { id: string; description: string }) => void;
  onDeleteStyle: (id: string) => Promise<void>;
  onDeleteTheme: (id: string) => Promise<void>;
  onSaveStyle: (style: CustomArtStyle) => Promise<void>;
  onSaveTheme: (theme: CustomArtTheme) => Promise<void>;
  onCancelStyleEdit: () => void;
  onCancelThemeEdit: () => void;
};

export function ImageGenerationSettings({
  config,
  allStyles,
  allThemes,
  customStyles,
  customThemes,
  editingStyle,
  editingTheme,
  showStyleEditor,
  showThemeEditor,
  onChange,
  onCreateNewStyle,
  onCreateNewTheme,
  onEditStyle,
  onEditTheme,
  onDeleteStyle,
  onDeleteTheme,
  onSaveStyle,
  onSaveTheme,
  onCancelStyleEdit,
  onCancelThemeEdit,
}: ImageGenerationSettingsProps) {
  const handleSelectStyle = (style: { id: string; description: string }) => {
    onChange({
      ...config,
      imageGeneration: { ...config.imageGeneration, artStyle: style.description },
    });
  };

  const handleSelectStyleRandom = () => {
    onChange({
      ...config,
      imageGeneration: { ...config.imageGeneration, artStyle: "random" },
    });
  };

  const handleSelectTheme = (theme: { id: string; description: string }) => {
    onChange({
      ...config,
      imageGeneration: { ...config.imageGeneration, artTheme: theme.description },
    });
  };

  const handleSelectThemeRandom = () => {
    onChange({
      ...config,
      imageGeneration: { ...config.imageGeneration, artTheme: "random" },
    });
  };

  const handleSelectSecondTheme = (theme: { id: string; description: string }) => {
    onChange({
      ...config,
      imageGeneration: { ...config.imageGeneration, secondArtTheme: theme.description },
    });
  };

  const handleSelectSecondThemeRandom = () => {
    onChange({
      ...config,
      imageGeneration: { ...config.imageGeneration, secondArtTheme: "random" },
    });
  };

  return (
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
            <label htmlFor="enable-image-generation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Image Generation
            </label>
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model
            </label>
            <select
              id="model"
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
            {(() => {
              const pricing = getImagePricing(config.imageGeneration.model);
              return (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">💵 ${pricing.toFixed(2)} per image</p>
              );
            })()}
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
            <label
              htmlFor="use-matching-style-theme-pairs"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Use Matching Style-Theme Pairs
            </label>
          </div>
          {config.imageGeneration.useMatchingPairs && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Matching Pair Probability: {(config.imageGeneration.matchingPairProbability * 100).toFixed(0)}%
              </label>
              <input
                id="use-matching-style-theme-pairs"
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
          <ArtStyleSelector
            styles={allStyles}
            customStyles={customStyles}
            selectedStyle={config.imageGeneration.artStyle}
            editingStyle={editingStyle}
            showEditor={showStyleEditor}
            enabled={config.imageGeneration.enabled}
            onSelect={handleSelectStyle}
            onSelectRandom={handleSelectStyleRandom}
            onCreateNew={onCreateNewStyle}
            onEdit={onEditStyle}
            onDelete={onDeleteStyle}
            onSave={onSaveStyle}
            onCancelEdit={onCancelStyleEdit}
          />

          {/* Art Theme Selector */}
          <ArtThemeSelector
            themes={allThemes}
            customThemes={customThemes}
            selectedTheme={config.imageGeneration.artTheme}
            editingTheme={editingTheme}
            showEditor={showThemeEditor}
            enabled={config.imageGeneration.enabled}
            variant="primary"
            onSelect={handleSelectTheme}
            onSelectRandom={handleSelectThemeRandom}
            onCreateNew={onCreateNewTheme}
            onEdit={onEditTheme}
            onDelete={onDeleteTheme}
            onSave={onSaveTheme}
            onCancelEdit={onCancelThemeEdit}
          />

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
              <label
                htmlFor="enable-mashup-mode-2-themes"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Enable Mashup Mode (2 Themes)
              </label>
            </div>

            {config.imageGeneration.mashupMode && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="second-art-theme"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Second Art Theme
                  </label>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <button
                    onClick={handleSelectSecondThemeRandom}
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
                    const isCustom = customThemes.some((t) => t.id === theme.id);
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
                                <span className="px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded shrink-0">
                                  Custom
                                </span>
                              )}
                              {isSelected && <span className="text-purple-600 text-xs shrink-0">✓</span>}
                            </div>
                            <p className="text-xs text-gray-900 dark:text-white">{theme.description}</p>
                          </div>
                          <button
                            onClick={() => {
                              handleSelectSecondTheme(theme);
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
  );
}
