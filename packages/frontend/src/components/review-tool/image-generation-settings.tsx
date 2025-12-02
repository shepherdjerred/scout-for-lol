/**
 * Image generation settings controls
 */
import type { TabConfig } from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import { getImagePricing } from "@scout-for-lol/data";
import { ArtStyleSelector } from "./art-style-selector.tsx";
import type { CustomArtStyle } from "@scout-for-lol/frontend/lib/review-tool/art-style-storage";

type ImageGenerationSettingsProps = {
  config: TabConfig;
  allStyles: { id: string; description: string }[];
  customStyles: CustomArtStyle[];
  editingStyle: CustomArtStyle | null;
  showStyleEditor: boolean;
  onChange: (config: TabConfig) => void;
  onCreateNewStyle: () => void;
  onEditStyle: (style: { id: string; description: string }) => void;
  onDeleteStyle: (id: string) => Promise<void>;
  onSaveStyle: (style: CustomArtStyle) => Promise<void>;
  onCancelStyleEdit: () => void;
};

export function ImageGenerationSettings({
  config,
  allStyles,
  customStyles,
  editingStyle,
  showStyleEditor,
  onChange,
  onCreateNewStyle,
  onEditStyle,
  onDeleteStyle,
  onSaveStyle,
  onCancelStyleEdit,
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

  return (
    <div>
      <div className="w-full px-4 py-3 flex justify-between items-center bg-surface-50">
        <span className="font-semibold text-surface-900 text-sm">Image Generation</span>
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
            <label htmlFor="enable-image-generation" className="text-sm font-medium text-surface-700">
              Enable Image Generation
            </label>
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-surface-700 mb-1">
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
              className="w-full px-3 py-2 text-sm bg-white text-surface-900 border border-surface-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50"
              disabled={!config.imageGeneration.enabled}
            >
              <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image Preview</option>
              <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </select>
            {(() => {
              const pricing = getImagePricing(config.imageGeneration.model);
              return <p className="text-xs text-surface-600 mt-1">💵 ${pricing.toFixed(2)} per image</p>;
            })()}
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
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
            onDelete={(id) => {
              void (async () => {
                try {
                  await onDeleteStyle(id);
                } catch {
                  // Error handling is done in the parent component
                }
              })();
            }}
            onSave={onSaveStyle}
            onCancelEdit={onCancelStyleEdit}
          />
        </div>
      </div>
    </div>
  );
}
