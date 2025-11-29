/**
 * Advanced AI settings controls (Mastra workflow features)
 *
 * These settings match the Mastra backend workflow:
 * - Timeline summarization (always enabled)
 * - Match analysis (always enabled)
 * - Art prompt generation (always enabled)
 * - Player selection
 *
 * Only model selection is configurable - features are always enabled.
 */
import type { TabConfig } from "@scout-for-lol/frontend/lib/review-tool/config/schema";

type AdvancedAISettingsProps = {
  config: TabConfig;
  onChange: (config: TabConfig) => void;
};

export function AdvancedAISettings({ config, onChange }: AdvancedAISettingsProps) {
  return (
    <div>
      <div className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
        <span className="font-semibold text-gray-900 dark:text-white text-sm">Advanced AI (Mastra)</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Matches backend workflow</span>
      </div>
      <div className="px-4 pb-4 space-y-4">
        {/* Player Selection */}
        <div>
          <label htmlFor="playerSelection" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Player Selection
          </label>
          <select
            id="playerSelection"
            value={
              typeof config.advancedAI.playerSelection === "number"
                ? config.advancedAI.playerSelection.toString()
                : config.advancedAI.playerSelection
            }
            onChange={(e) => {
              const value = e.target.value;
              const playerSelection = value === "random" || value === "first" ? value : Number.parseInt(value);
              onChange({
                ...config,
                advancedAI: { ...config.advancedAI, playerSelection },
              });
            }}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="random">Random (like Mastra backend)</option>
            <option value="first">First Player (legacy)</option>
            <option value="0">Player 1</option>
            <option value="1">Player 2</option>
            <option value="2">Player 3</option>
            <option value="3">Player 4</option>
            <option value="4">Player 5</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Which player to focus the review on. "Random" matches the Mastra backend behavior.
          </p>
        </div>

        {/* Timeline Summarization Model */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label htmlFor="timelineModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Timeline Summary Model
          </label>
          <select
            id="timelineModel"
            value={config.advancedAI.timelineSummaryModel}
            onChange={(e) => {
              onChange({
                ...config,
                advancedAI: { ...config.advancedAI, timelineSummaryModel: e.target.value },
              });
            }}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="gpt-4o-mini">GPT-4o Mini (fast, cheap)</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-5.1">GPT-5.1</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            AI summarizes game timeline events before generating the review.
          </p>
        </div>

        {/* Match Analysis Model */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label htmlFor="analysisModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Match Analysis Model
          </label>
          <select
            id="analysisModel"
            value={config.advancedAI.matchAnalysisModel}
            onChange={(e) => {
              onChange({
                ...config,
                advancedAI: { ...config.advancedAI, matchAnalysisModel: e.target.value },
              });
            }}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="gpt-4o-mini">GPT-4o Mini (fast, cheap)</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-5.1">GPT-5.1</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            AI analyzes player performance with lane context before generating the review.
          </p>
        </div>

        {/* Art Prompt Generation Model */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label htmlFor="artPromptModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Art Prompt Model
          </label>
          <select
            id="artPromptModel"
            value={config.advancedAI.artPromptModel}
            onChange={(e) => {
              onChange({
                ...config,
                advancedAI: { ...config.advancedAI, artPromptModel: e.target.value },
              });
            }}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="gpt-5.1">GPT-5.1 (best quality)</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4o-mini">GPT-4o Mini (fast, cheap)</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            AI crafts a custom image prompt based on the review before generating the image.
          </p>
        </div>

        {/* Info Note */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <strong>Note:</strong> All AI features are always enabled to match the Mastra backend workflow. Each
            generation uses 3 AI calls (timeline + analysis + art prompt) plus the main review text generation.
          </p>
        </div>
      </div>
    </div>
  );
}
