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
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
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
        className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-surface-200">
          <h3 className="text-xl font-semibold text-surface-900">
            {isEditing ? `Edit ${modeLabel}` : `Create New ${modeLabel}`}
          </h3>
          <p className="text-sm text-surface-600 mt-1">{modeDescription}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <label htmlFor="art-style-description" className="block text-sm font-medium text-surface-700 mb-1">
              Art Style Description <span className="text-red-500">*</span>
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
              className="w-full px-3 py-2 bg-white text-surface-900 border border-surface-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder:text-surface-400"
            />
            <p className="text-xs text-surface-500 mt-1">
              Detailed description of the artistic style, techniques, and visual characteristics
            </p>
          </div>

          {/* Examples */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Style Examples:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• &quot;Bold comic book inking with dynamic action poses and dramatic shadows&quot;</li>
              <li>• &quot;Synthwave aesthetic with pink and purple gradients, retro-futuristic vibes&quot;</li>
              <li>• &quot;Watercolor painting with artistic flair, flowing brushwork, and soft gradients&quot;</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-surface-200 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors font-medium"
          >
            {isEditing ? "Save Changes" : `Create ${modeLabel}`}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-surface-300 text-surface-700 rounded hover:bg-surface-400 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
