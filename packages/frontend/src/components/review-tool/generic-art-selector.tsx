/**
 * Generic art selector component (for styles and themes)
 */
import { ArtStyleEditor } from "./art-style-editor";
import type { CustomArtStyle, CustomArtTheme } from "@scout-for-lol/frontend/lib/review-tool/art-style-storage";

type GenericArtSelectorProps<T extends CustomArtStyle | CustomArtTheme> = {
  items: T[];
  customItems: T[];
  selectedItem: string;
  editingItem: T | null;
  showEditor: boolean;
  enabled: boolean;
  variant?: "primary" | "secondary";
  mode: "style" | "theme";
  label: string;
  randomDescription: string;
  onSelect: (item: T) => void;
  onSelectRandom: () => void;
  onCreateNew: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onSave: (item: T) => Promise<void>;
  onCancelEdit: () => void;
};

export function GenericArtSelector<T extends CustomArtStyle | CustomArtTheme>({
  items,
  customItems,
  selectedItem,
  editingItem,
  showEditor,
  enabled,
  variant = "primary",
  mode,
  label,
  randomDescription,
  onSelect,
  onSelectRandom,
  onCreateNew,
  onEdit,
  onDelete,
  onSave,
  onCancelEdit,
}: GenericArtSelectorProps<T>) {
  const isSecondary = variant === "secondary";
  const borderColor = isSecondary
    ? "border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30"
    : "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30";
  const checkColor = isSecondary ? "text-purple-600" : "text-blue-600";
  const buttonColor = isSecondary ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700";

  if (showEditor) {
    if (!editingItem) {
      return null;
    }
    return (
      <div>
        <ArtStyleEditor
          mode={mode}
          item={editingItem}
          onSave={(item) => {
            void onSave(item);
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
          {label} ({items.length})
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
            ${selectedItem === "random" ? borderColor : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}
          `}
          disabled={!enabled}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-medium text-gray-900 dark:text-white">Random</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">{randomDescription}</p>
            </div>
            {selectedItem === "random" && <span className={`${checkColor} text-xs`}>✓</span>}
          </div>
        </button>

        {items.map((item) => {
          const isCustom = customItems.some((c) => c.id === item.id);
          const isSelected = selectedItem === item.description;
          return (
            <div
              key={item.id}
              className={`
                p-2 rounded border transition-colors
                ${isSelected ? borderColor : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    {isCustom && (
                      <span className="px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded shrink-0">Custom</span>
                    )}
                    {isSelected && <span className={`${checkColor} text-xs shrink-0`}>✓</span>}
                  </div>
                  <p className="text-xs text-gray-900 dark:text-white">{item.description}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      onSelect(item);
                    }}
                    className={`px-2 py-1 ${buttonColor} text-white text-xs rounded whitespace-nowrap`}
                    disabled={!enabled}
                  >
                    {isSelected ? "✓" : "Use"}
                  </button>
                  {isCustom && (mode === "style" || !isSecondary) && (
                    <>
                      <button
                        onClick={() => {
                          onEdit(item);
                        }}
                        className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                        disabled={!enabled}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete(item.id);
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
