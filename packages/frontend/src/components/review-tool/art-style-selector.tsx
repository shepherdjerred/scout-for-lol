/**
 * Art style selector component
 */
import { GenericArtSelector } from "./generic-art-selector";
import type { CustomArtStyle } from "../../lib/review-tool/art-style-storage";

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
  return (
    <GenericArtSelector
      items={styles}
      customItems={customStyles}
      selectedItem={selectedStyle}
      editingItem={editingStyle}
      showEditor={showEditor}
      enabled={enabled}
      variant="primary"
      mode="style"
      label="Art Styles"
      randomDescription="Pick a random style for each review"
      onSelect={onSelect}
      onSelectRandom={onSelectRandom}
      onCreateNew={onCreateNew}
      onEdit={onEdit}
      onDelete={onDelete}
      onSave={onSave}
      onCancelEdit={onCancelEdit}
    />
  );
}
