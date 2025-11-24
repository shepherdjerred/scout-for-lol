/**
 * Art style selector component
 */
import { ArtStyleEditor } from "@scout-for-lol/review-dev-tool/components/art-style-editor";
import type { CustomArtStyle } from "@scout-for-lol/review-dev-tool/lib/art-style-storage";

type ArtStyleSelectorProps = {
  styles: { id: string; description: string }[];
  customStyles: CustomArtStyle[];
  selectedStyle: string;
  editingStyle: CustomArtStyle | null;
  showEditor: boolean;
  enabled: boolean;
  onSelect: (style: { id: string; description: string }) => void;
  onSelectRandom: () => void;
  onCreateNew: () => void;
  onEdit: (style: { id: string; description: string }) => void;
  onDelete: (id: string) => void;
  onSave: (style: CustomArtStyle) => Promise<void>;
  onCancelEdit: () => void;
};

export function ArtStyleSelector({
  styles,
  customStyles,
  selectedStyle,
  editingStyle,
  showEditor,
  enabled,
  onSelect,
  onSelectRandom,
  onCreateNew,
  onEdit,
  onDelete,
  onSave,
  onCancelEdit,
}: ArtStyleSelectorProps) {
  if (showEditor) {
    return (
      <div>
        <ArtStyleEditor
          mode="style"
          style={editingStyle ?? undefined}
          onSave={(style) => {
            void onSave(style);
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
          Art Styles ({styles.length})
        </label>
        <button
          onClick={onCreateNew}
          className="text-xs text-green-600 hover:text-green-700 font-medium"
          disabled={!enabled}
        >
          + Create New
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        <button
          onClick={onSelectRandom}
          className={`
            w-full p-2 rounded border transition-colors text-left
            ${selectedStyle === "random" ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}
          `}
          disabled={!enabled}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-medium text-gray-900 dark:text-white">Random</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pick a random style for each review</p>
            </div>
            {selectedStyle === "random" && <span className="text-blue-600 text-xs">✓</span>}
          </div>
        </button>

        {styles.map((style) => {
          const isCustom = customStyles.some((s) => s.id === style.id);
          const isSelected = selectedStyle === style.description;
          return (
            <div
              key={style.id}
              className={`
                p-2 rounded border transition-colors
                ${isSelected ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    {isCustom && (
                      <span className="px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded shrink-0">Custom</span>
                    )}
                    {isSelected && <span className="text-blue-600 text-xs shrink-0">✓</span>}
                  </div>
                  <p className="text-xs text-gray-900 dark:text-white">{style.description}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      onSelect(style);
                    }}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 whitespace-nowrap"
                    disabled={!enabled}
                  >
                    {isSelected ? "✓" : "Use"}
                  </button>
                  {isCustom && (
                    <>
                      <button
                        onClick={() => {
                          onEdit(style);
                        }}
                        className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                        disabled={!enabled}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          void onDelete(style.id);
                        }}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        disabled={!enabled}
                      >
                        Del
                      </button>
                    </>
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
