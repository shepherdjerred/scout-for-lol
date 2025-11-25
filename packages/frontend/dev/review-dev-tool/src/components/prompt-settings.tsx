/**
 * Prompt settings section (base prompt and personality selector)
 */
import { getBasePrompt } from "../lib/prompts";
import type { TabConfig, Personality } from "../config/schema";
import { PersonalitySelector } from "./personality-selector";

type PromptSettingsProps = {
  config: TabConfig;
  personalities: Personality[];
  customPersonalities: Personality[];
  editingPersonality: Personality | null;
  showPersonalityEditor: boolean;
  onChange: (config: TabConfig) => void;
  onCreateNewPersonality: () => void;
  onEditPersonality: (personality: Personality, createCopy?: boolean) => void;
  onDeletePersonality: (id: string) => Promise<void>;
  onSavePersonality: (personality: Personality) => Promise<void>;
  onCancelPersonalityEdit: () => void;
};

export function PromptSettings({
  config,
  personalities,
  customPersonalities,
  editingPersonality,
  showPersonalityEditor,
  onChange,
  onCreateNewPersonality,
  onEditPersonality,
  onDeletePersonality,
  onSavePersonality,
  onCancelPersonalityEdit,
}: PromptSettingsProps) {
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

  const handleSelectRandom = () => {
    onChange({
      ...config,
      prompts: { ...config.prompts, personalityId: "random", customPersonality: undefined },
    });
  };

  return (
    <div>
      <div className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
        <span className="font-semibold text-gray-900 dark:text-white text-sm">Prompts & Personality</span>
      </div>
      <div>
        <div className="px-4 pb-4 space-y-3">
          <div>
            <label htmlFor="base-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Base Prompt
            </label>
            <textarea
              id="base-prompt"
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

          <PersonalitySelector
            personalities={personalities}
            customPersonalities={customPersonalities}
            selectedPersonalityId={config.prompts.personalityId}
            editingPersonality={editingPersonality}
            showEditor={showPersonalityEditor}
            onSelect={handleSelectPersonality}
            onSelectRandom={handleSelectRandom}
            onCreateNew={onCreateNewPersonality}
            onEdit={onEditPersonality}
            onDelete={onDeletePersonality}
            onSave={onSavePersonality}
            onCancelEdit={onCancelPersonalityEdit}
          />
        </div>
      </div>
    </div>
  );
}
