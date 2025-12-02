/**
 * Text generation settings controls
 */
import type { TabConfig } from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import { getModelPricing, modelSupportsParameter } from "@scout-for-lol/data";

type TextGenerationSettingsProps = {
  config: TabConfig;
  onChange: (config: TabConfig) => void;
};

/**
 * Calculate estimated cost for a typical review generation.
 * Assumes ~10k input tokens (match data + prompts) and output = maxTokens.
 */
function calculateEstimatedCost(model: string, maxTokens: number): string {
  const pricing = getModelPricing(model);
  const estimatedInputTokens = 10000; // Typical input size for a review
  const inputCost = (estimatedInputTokens / 1_000_000) * pricing.input;
  const outputCost = (maxTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  if (totalCost < 0.01) {
    return `~${(totalCost * 100).toFixed(1)}¢`;
  }
  return `~$${totalCost.toFixed(2)}`;
}

export function TextGenerationSettings({ config, onChange }: TextGenerationSettingsProps) {
  const pricing = getModelPricing(config.textGeneration.model);
  const estimatedCost = calculateEstimatedCost(config.textGeneration.model, config.textGeneration.maxTokens);

  return (
    <div>
      <div className="w-full px-4 py-3 flex justify-between items-center bg-surface-50">
        <span className="font-semibold text-surface-900 text-sm">Text Generation</span>
      </div>
      <div>
        <div className="px-4 pb-4 space-y-3">
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-surface-700 mb-1">
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
              className="w-full px-3 py-2 text-sm bg-white text-surface-900 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="gpt-5.1">GPT-5.1 (Recommended)</option>
              <option value="gpt-5">GPT-5</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="max-tokens-slider" className="block text-sm font-medium text-surface-700">
                Max Response Length
              </label>
              <span className="text-sm font-mono text-surface-600">
                {config.textGeneration.maxTokens.toLocaleString()} tokens
              </span>
            </div>
            <input
              id="max-tokens-slider"
              type="range"
              min="500"
              max="8000"
              step="500"
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
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-surface-500 mt-1">
              <span>Short (~500)</span>
              <span>Medium (~2000)</span>
              <span>Long (~8000)</span>
            </div>
          </div>

          {/* Estimated Cost Display */}
          <div className="p-3 bg-surface-100 rounded-lg border border-surface-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-600">Estimated cost per review</span>
              <span className="text-lg font-semibold text-brand-600">{estimatedCost}</span>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Based on {config.textGeneration.maxTokens.toLocaleString()} output tokens at ${pricing.output}/M
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
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
            <p className="text-xs text-surface-500 mt-1">
              Note: Temperature parameter is currently disabled to ensure compatibility with all models.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
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
