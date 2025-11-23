/**
 * Art Style and Theme management UI
 */
import { useState, useEffect } from "react";
import { ART_STYLES, ART_THEMES } from "../data/art-styles";
import type { CustomArtStyle, CustomArtTheme } from "../lib/art-style-storage";
import {
  loadCustomArtStyles,
  addCustomArtStyle,
  updateCustomArtStyle,
  deleteCustomArtStyle,
  isCustomArtStyle,
  generateArtStyleId,
  loadCustomArtThemes,
  addCustomArtTheme,
  updateCustomArtTheme,
  deleteCustomArtTheme,
  isCustomArtTheme,
  generateArtThemeId,
} from "../lib/art-style-storage";
import { ArtStyleEditor } from "./ArtStyleEditor";

type ViewMode = "styles" | "themes";

interface ArtStyleThemeManagerProps {
  onStyleSelect?: (style: string) => void;
  onThemeSelect?: (theme: string) => void;
}

export function ArtStyleThemeManager({ onStyleSelect, onThemeSelect }: ArtStyleThemeManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("styles");
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [customStyles, setCustomStyles] = useState<CustomArtStyle[]>([]);
  const [customThemes, setCustomThemes] = useState<CustomArtTheme[]>([]);
  const [editingStyle, setEditingStyle] = useState<CustomArtStyle | null>(null);
  const [editingTheme, setEditingTheme] = useState<CustomArtTheme | null>(null);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load custom styles and themes on mount
  useEffect(() => {
    setCustomStyles(loadCustomArtStyles());
    setCustomThemes(loadCustomArtThemes());
  }, []);

  // Convert built-in styles to format with IDs
  const builtinStyles = ART_STYLES.map((style, index) => ({
    id: `builtin-style-${index}`,
    description: style,
  }));

  const builtinThemes = ART_THEMES.map((theme, index) => ({
    id: `builtin-theme-${index}`,
    description: theme,
  }));

  const allStyles = [...builtinStyles, ...customStyles];
  const allThemes = [...builtinThemes, ...customThemes];

  const filteredStyles = allStyles.filter((style) =>
    style.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredThemes = allThemes.filter((theme) =>
    theme.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedStyle = selectedStyleId ? allStyles.find((s) => s.id === selectedStyleId) : null;
  const selectedTheme = selectedThemeId ? allThemes.find((t) => t.id === selectedThemeId) : null;

  const handleCreateNewStyle = () => {
    setEditingStyle(null);
    setShowStyleEditor(true);
  };

  const handleCreateNewTheme = () => {
    setEditingTheme(null);
    setShowThemeEditor(true);
  };

  const handleEditStyle = (style: CustomArtStyle) => {
    setEditingStyle(style);
    setShowStyleEditor(true);
  };

  const handleEditTheme = (theme: CustomArtTheme) => {
    setEditingTheme(theme);
    setShowThemeEditor(true);
  };

  const handleSaveStyle = (style: CustomArtStyle) => {
    if (editingStyle) {
      updateCustomArtStyle(style.id, style);
    } else {
      const newStyle = {
        ...style,
        id: generateArtStyleId(style.description),
      };
      addCustomArtStyle(newStyle);
    }

    setCustomStyles(loadCustomArtStyles());
    setShowStyleEditor(false);
    setEditingStyle(null);
  };

  const handleSaveTheme = (theme: CustomArtTheme) => {
    if (editingTheme) {
      updateCustomArtTheme(theme.id, theme);
    } else {
      const newTheme = {
        ...theme,
        id: generateArtThemeId(theme.description),
      };
      addCustomArtTheme(newTheme);
    }

    setCustomThemes(loadCustomArtThemes());
    setShowThemeEditor(false);
    setEditingTheme(null);
  };

  const handleDeleteStyle = (id: string) => {
    if (confirm("Are you sure you want to delete this custom art style?")) {
      deleteCustomArtStyle(id);
      setCustomStyles(loadCustomArtStyles());
      if (selectedStyleId === id) {
        setSelectedStyleId(null);
      }
    }
  };

  const handleDeleteTheme = (id: string) => {
    if (confirm("Are you sure you want to delete this custom art theme?")) {
      deleteCustomArtTheme(id);
      setCustomThemes(loadCustomArtThemes());
      if (selectedThemeId === id) {
        setSelectedThemeId(null);
      }
    }
  };

  const handleUseStyle = (style: { id: string; description: string }) => {
    onStyleSelect?.(style.description);
  };

  const handleUseTheme = (theme: { id: string; description: string }) => {
    onThemeSelect?.(theme.description);
  };

  return (
    <>
      {showStyleEditor && (
        <ArtStyleEditor
          mode="style"
          style={editingStyle ?? undefined}
          onSave={handleSaveStyle}
          onCancel={() => {
            setShowStyleEditor(false);
            setEditingStyle(null);
          }}
        />
      )}

      {showThemeEditor && (
        <ArtStyleEditor
          mode="theme"
          theme={editingTheme ?? undefined}
          onSave={handleSaveTheme}
          onCancel={() => {
            setShowThemeEditor(false);
            setEditingTheme(null);
          }}
        />
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Art Style & Theme Manager</h3>
              <p className="text-sm text-gray-600">Browse built-in options or create your own</p>
            </div>
            <button
              onClick={viewMode === "styles" ? handleCreateNewStyle : handleCreateNewTheme}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
            >
              + Create New {viewMode === "styles" ? "Style" : "Theme"}
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode("styles")}
              className={`px-4 py-2 rounded transition-colors ${
                viewMode === "styles" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Styles ({allStyles.length})
            </button>
            <button
              onClick={() => setViewMode("themes")}
              className={`px-4 py-2 rounded transition-colors ${
                viewMode === "themes" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Themes ({allThemes.length})
            </button>
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${viewMode}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-200">
          {/* List Panel */}
          <div className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              {viewMode === "styles"
                ? `Available Styles (${filteredStyles.length})`
                : `Available Themes (${filteredThemes.length})`}
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {viewMode === "styles" &&
                filteredStyles.map((style) => {
                  const isCustom = isCustomArtStyle(style.id);
                  return (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyleId(style.id)}
                      className={`
                        w-full text-left px-3 py-2 rounded border-2 transition-colors
                        ${
                          selectedStyleId === style.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }
                      `}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            {isCustom && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded flex-shrink-0">
                                Custom
                              </span>
                            )}
                            <div className="text-sm text-gray-900">{style.description}</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

              {viewMode === "themes" &&
                filteredThemes.map((theme) => {
                  const isCustom = isCustomArtTheme(theme.id);
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`
                        w-full text-left px-3 py-2 rounded border-2 transition-colors
                        ${
                          selectedThemeId === theme.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }
                      `}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            {isCustom && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded flex-shrink-0">
                                Custom
                              </span>
                            )}
                            <div className="text-sm text-gray-900">{theme.description}</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

              {((viewMode === "styles" && filteredStyles.length === 0) ||
                (viewMode === "themes" && filteredThemes.length === 0)) && (
                <div className="text-center py-8 text-gray-400">No results found</div>
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Details</h4>
            {viewMode === "styles" && selectedStyle ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Name</div>
                  <div className="text-sm text-gray-900">{selectedStyle.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">{selectedStyle.description}</div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleUseStyle(selectedStyle)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Use This Style
                  </button>
                  {isCustomArtStyle(selectedStyle.id) && (
                    <>
                      <button
                        onClick={() => handleEditStyle(selectedStyle)}
                        className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStyle(selectedStyle.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : viewMode === "themes" && selectedTheme ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Name</div>
                  <div className="text-sm text-gray-900">{selectedTheme.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">{selectedTheme.description}</div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleUseTheme(selectedTheme)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Use This Theme
                  </button>
                  {isCustomArtTheme(selectedTheme.id) && (
                    <>
                      <button
                        onClick={() => handleEditTheme(selectedTheme)}
                        className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTheme(selectedTheme.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Select a {viewMode === "styles" ? "style" : "theme"} to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
