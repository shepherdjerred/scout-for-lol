/**
 * Generic art selector component (for styles)
 */
import { ArtStyleEditor } from "./art-style-editor.tsx";
import type { CustomArtStyle } from "@scout-for-lol/frontend/lib/review-tool/art-style-storage";

type GenericArtSelectorProps<T extends CustomArtStyle> = {
  items: T[];
  customItems: T[];
  selectedItem: string;
  editingItem: T | null;
  showEditor: boolean;
  enabled: boolean;
  variant?: "primary" | "secondary";
  mode: "style";
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

export function GenericArtSelector<T extends CustomArtStyle>({
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
  const borderColor = isSecondary ? "border-purple-500 bg-purple-50" : "border-blue-500 bg-blue-50";
  const checkColor = isSecondary ? "text-purple-600" : "text-brand-600";
  const buttonColor = isSecondary ? "bg-purple-600 hover:bg-purple-700" : "bg-brand-600 hover:bg-brand-700";

  if (showEditor) {
    // When creating new, editingItem should be provided by the parent with a default template
    // If it's null, we can't proceed - the parent should handle creating a default item
    if (!editingItem) {
      // This shouldn't happen if parent is implemented correctly
      // Show a fallback to avoid crashes
      return (
        <div className="p-4 text-sm text-surface-600">
          <p>Error: No item to edit. Please try again.</p>
          <button onClick={onCancelEdit} className="mt-2 text-brand-600 hover:text-brand-700">
            Cancel
          </button>
        </div>
      );
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
        <label className="block text-sm font-medium text-surface-700">
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
            ${selectedItem === "random" ? borderColor : "border-surface-200 bg-white hover:border-surface-300"}
          `}
          disabled={!enabled}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-medium text-surface-900">Random</h4>
              <p className="text-xs text-surface-600">{randomDescription}</p>
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
                ${isSelected ? borderColor : "border-surface-200 bg-white hover:border-surface-300"}
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
                  <p className="text-xs text-surface-900">{item.description}</p>
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
                  {isCustom && (
                    <>
                      <button
                        onClick={() => {
                          onEdit(item);
                        }}
                        className="px-2 py-1 bg-surface-600 text-white text-xs rounded hover:bg-surface-700"
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
