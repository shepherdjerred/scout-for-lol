/**
 * Text generation settings controls
 */
import type { TabConfig } from "../config/schema";
import { getModelPricing, modelSupportsParameter } from "@scout-for-lol/data";

type TextGenerationSettingsProps = {
  config: TabConfig;
  onChange: (config: TabConfig) => void;
};

export function TextGenerationSettings({ config, onChange }: TextGenerationSettingsProps) {
  return (
    <div>
      <div className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
        <span className="font-semibold text-gray-900 dark:text-white text-sm">Text Generation</span>
      </div>
      <div>
        <div className="px-4 pb-4 space-y-3">
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model
            </label>
            <select
              id="model"
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
            {(() => {
              const pricing = getModelPricing(config.textGeneration.model);
              return (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  💵 ${pricing.input.toFixed(2)} input / ${pricing.output.toFixed(2)} output per 1M tokens
                </p>
              );
            })()}
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
  );
}
