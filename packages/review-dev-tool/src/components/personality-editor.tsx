/**
 * Personality editor modal for creating/editing personalities
 */
import { useState } from "react";
import { z } from "zod";
import type { Personality, PersonalityMetadata } from "@scout-for-lol/review-dev-tool/config/schema";
import { PersonalitySchema } from "@scout-for-lol/review-dev-tool/config/schema";

const ErrorSchema = z.object({ message: z.string() });

type PersonalityEditorProps = {
  personality?: Personality | undefined;
  onSave: (personality: Personality) => void;
  onCancel: () => void;
};

export function PersonalityEditor({ personality, onSave, onCancel }: PersonalityEditorProps) {
  const [name, setName] = useState(personality?.metadata.name ?? "");
  const [description, setDescription] = useState(personality?.metadata.description ?? "");
  const [favoriteChampions, setFavoriteChampions] = useState(personality?.metadata.favoriteChampions.join(", ") ?? "");
  const [favoriteLanes, setFavoriteLanes] = useState(personality?.metadata.favoriteLanes.join(", ") ?? "");
  const [instructions, setInstructions] = useState(personality?.instructions ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      const metadata: PersonalityMetadata = {
        name: name.trim(),
        description: description.trim(),
        favoriteChampions: favoriteChampions
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c.length > 0),
        favoriteLanes: favoriteLanes
          .split(",")
          .map((l) => l.trim())
          .filter((l) => l.length > 0),
      };

      const newPersonality: Personality = {
        id: personality?.id ?? `custom-${Date.now().toString()}`,
        metadata,
        instructions: instructions.trim(),
      };

      // Validate with Zod
      PersonalitySchema.parse(newPersonality);

      onSave(newPersonality);
    } catch (err) {
      const errorResult = ErrorSchema.safeParse(err);
      setError(errorResult.success ? errorResult.data.message : String(err));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {personality ? "Edit Personality" : "Create New Personality"}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="e.g., Friendly Coach"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Brief description of this reviewer's personality"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Favorite Champions (comma-separated)
            </label>
            <input
              type="text"
              value={favoriteChampions}
              onChange={(e) => {
                setFavoriteChampions(e.target.value);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="e.g., Yasuo, Zed, Lee Sin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Favorite Lanes (comma-separated)
            </label>
            <input
              type="text"
              value={favoriteLanes}
              onChange={(e) => {
                setFavoriteLanes(e.target.value);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="e.g., mid, jungle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instructions / System Prompt <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <textarea
              value={instructions}
              onChange={(e) => {
                setInstructions(e.target.value);
              }}
              rows={15}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 font-mono text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Detailed instructions for how this reviewer should behave and write reviews..."
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This is the system prompt that defines how the reviewer thinks and writes.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            {personality ? "Save Changes" : "Create Personality"}
          </button>
        </div>
      </div>
    </div>
  );
}
