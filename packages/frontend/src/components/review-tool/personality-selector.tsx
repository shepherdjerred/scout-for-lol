/**
 * Personality selector component
 */
import type { Personality } from "../../lib/review-tool/config/schema";
import { PersonalityEditor } from "./personality-editor";

type PersonalitySelectorProps = {
  personalities: Personality[];
  customPersonalities: Personality[];
  selectedPersonalityId: string;
  editingPersonality: Personality | null;
  showEditor: boolean;
  onSelect: (personality: Personality) => void;
  onSelectRandom: () => void;
  onCreateNew: () => void;
  onEdit: (personality: Personality, createCopy?: boolean) => void;
  onDelete: (id: string) => Promise<void>;
  onSave: (personality: Personality) => Promise<void>;
  onCancelEdit: () => void;
};

export function PersonalitySelector({
  personalities,
  customPersonalities,
  selectedPersonalityId,
  editingPersonality,
  showEditor,
  onSelect,
  onSelectRandom,
  onCreateNew,
  onEdit,
  onDelete,
  onSave,
  onCancelEdit,
}: PersonalitySelectorProps) {
  if (showEditor) {
    return (
      <div>
        <PersonalityEditor
          personality={editingPersonality ?? undefined}
          onSave={(personality) => {
            void onSave(personality);
          }}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Personalities ({personalities.length})
        </label>
        <button onClick={onCreateNew} className="text-xs text-green-600 hover:text-green-700 font-medium">
          + Create New
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        <button
          onClick={onSelectRandom}
          className={`
            w-full p-3 rounded border transition-colors text-left
            ${selectedPersonalityId === "random" ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}
          `}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Random</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pick a random personality for each review</p>
            </div>
            {selectedPersonalityId === "random" && <span className="text-blue-600 text-xs">✓ Active</span>}
          </div>
        </button>

        {personalities.map((personality) => {
          const isCustom = customPersonalities.some((p) => p.id === personality.id);
          const isSelected = selectedPersonalityId === personality.id;
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
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{personality.metadata.name}</h4>
                    {isCustom && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">Custom</span>
                    )}
                    {isSelected && <span className="text-blue-600 text-xs">✓</span>}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {personality.metadata.description.substring(0, 80)}
                    {personality.metadata.description.length > 80 ? "..." : ""}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {personality.metadata.favoriteChampions.slice(0, 3).map((champ) => (
                      <span key={champ} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                        {champ}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-2">
                  <button
                    onClick={() => {
                      onSelect(personality);
                    }}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 whitespace-nowrap"
                  >
                    {isSelected ? "Active" : "Use"}
                  </button>
                  {isCustom ? (
                    <>
                      <button
                        onClick={() => {
                          onEdit(personality, false);
                        }}
                        className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          void onDelete(personality.id);
                        }}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        Del
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        onEdit(personality, true);
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
  );
}
