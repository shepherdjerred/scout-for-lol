/**
 * Art theme selector component
 */
import { GenericArtSelector } from "./generic-art-selector";
import type { CustomArtTheme } from "../../lib/review-tool/art-style-storage";

type ArtThemeSelectorProps = {
  themes: { id: string; description: string }[];
  customThemes: CustomArtTheme[];
  selectedTheme: string;
  editingTheme: CustomArtTheme | null;
  showEditor: boolean;
  enabled: boolean;
  variant?: "primary" | "secondary";
  onSelect: (theme: { id: string; description: string }) => void;
  onSelectRandom: () => void;
  onCreateNew: () => void;
  onEdit: (theme: { id: string; description: string }) => void;
  onDelete: (id: string) => void;
  onSave: (theme: CustomArtTheme) => Promise<void>;
  onCancelEdit: () => void;
};

export function ArtThemeSelector({
  themes,
  customThemes,
  selectedTheme,
  editingTheme,
  showEditor,
  enabled,
  variant = "primary",
  onSelect,
  onSelectRandom,
  onCreateNew,
  onEdit,
  onDelete,
  onSave,
  onCancelEdit,
}: ArtThemeSelectorProps) {
  return (
    <GenericArtSelector
      items={themes}
      customItems={customThemes}
      selectedItem={selectedTheme}
      editingItem={editingTheme}
      showEditor={showEditor}
      enabled={enabled}
      variant={variant}
      mode="theme"
      label="Art Themes"
      randomDescription="Pick a random theme for each review"
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
