/**
 * Editor for creating and editing custom art styles
 */
import { useState } from "react";
import type { CustomArtStyle } from "@scout-for-lol/frontend/lib/review-tool/art-style-storage";

type EditorMode = "style";

type ArtStyleEditorProps<T extends CustomArtStyle> = {
  mode: EditorMode;
  item: T;
  onSave: (item: T) => void;
  onCancel: () => void;
};

export function ArtStyleEditor<T extends CustomArtStyle>({ item, onSave, onCancel }: ArtStyleEditorProps<T>) {
  const isEditing = Boolean(item);
  const initialDescription = item.description;
  const [description, setDescription] = useState(initialDescription);

  const handleSave = () => {
    if (!description.trim()) {
      alert(`Please fill in the description field`);
      return;
    }

    onSave({ ...item, description: description.trim() });
  };

  const modeLabel = "Art Style";
  const modeDescription = "Visual aesthetics and artistic techniques (e.g., 'Watercolor painting with soft gradients')";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        role="button"
        tabIndex={0}
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onCancel();
          }
        }}
      />

      {/* Modal content */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? `Edit ${modeLabel}` : `Create New ${modeLabel}`}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{modeDescription}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <label
              htmlFor="art-style-description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Art Style Description <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <textarea
              id="art-style-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder={
                "e.g., Soft watercolor painting with flowing brushwork, pastel colors, and dreamy atmosphere"
              }
              rows={6}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Detailed description of the artistic style, techniques, and visual characteristics
            </p>
          </div>

          {/* Examples */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Style Examples:</h4>
            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <li>• &quot;Bold comic book inking with dynamic action poses and dramatic shadows&quot;</li>
              <li>• &quot;Synthwave aesthetic with pink and purple gradients, retro-futuristic vibes&quot;</li>
              <li>• &quot;Watercolor painting with artistic flair, flowing brushwork, and soft gradients&quot;</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
          >
            {isEditing ? "Save Changes" : `Create ${modeLabel}`}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
