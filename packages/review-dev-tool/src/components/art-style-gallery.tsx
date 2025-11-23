/**
 * Art style browser with visual examples
 */
import { useState } from "react";
import { getAllArtStyles, getAllArtThemes, getAllStyleThemePairs } from "../lib/art-styles";

type ViewMode = "styles" | "themes" | "pairs";

type ArtStyleGalleryProps = {
  onStyleSelect?: (style: string) => void;
  onThemeSelect?: (theme: string) => void;
  onPairSelect?: (style: string, theme: string) => void;
};

export function ArtStyleGallery({ onStyleSelect, onThemeSelect, onPairSelect }: ArtStyleGalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("pairs");
  const [searchTerm, setSearchTerm] = useState("");

  const allStyles = getAllArtStyles();
  const allThemes = getAllArtThemes();
  const allPairs = getAllStyleThemePairs();

  const filteredStyles = allStyles.filter((style) => style.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredThemes = allThemes.filter((theme) => theme.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredPairs = allPairs.filter(
    (pair) =>
      pair.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pair.theme.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Art Style Gallery</h3>

        <div className="flex gap-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode("pairs");
              }}
              className={`px-4 py-2 rounded transition-colors ${
                viewMode === "pairs" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pairs ({allPairs.length})
            </button>
            <button
              onClick={() => {
                setViewMode("styles");
              }}
              className={`px-4 py-2 rounded transition-colors ${
                viewMode === "styles" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Styles ({allStyles.length})
            </button>
            <button
              onClick={() => {
                setViewMode("themes");
              }}
              className={`px-4 py-2 rounded transition-colors ${
                viewMode === "themes" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Themes ({allThemes.length})
            </button>
          </div>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          placeholder="Search..."
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {viewMode === "pairs" && (
          <div className="space-y-3">
            {filteredPairs.map((pair, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => onPairSelect?.(pair.style, pair.theme)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-700 mb-1">Style:</div>
                    <div className="text-sm text-gray-900 mb-2">{pair.style}</div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">Theme:</div>
                    <div className="text-sm text-gray-900">{pair.theme}</div>
                  </div>
                  <button
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPairSelect?.(pair.style, pair.theme);
                    }}
                  >
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === "styles" && (
          <div className="space-y-2">
            {filteredStyles.map((style, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded hover:border-blue-500 transition-colors cursor-pointer flex justify-between items-center"
                onClick={() => onStyleSelect?.(style)}
              >
                <div className="text-sm text-gray-900 flex-1">{style}</div>
                <button
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors ml-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStyleSelect?.(style);
                  }}
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        )}

        {viewMode === "themes" && (
          <div className="space-y-2">
            {filteredThemes.map((theme, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded hover:border-blue-500 transition-colors cursor-pointer flex justify-between items-center"
                onClick={() => onThemeSelect?.(theme)}
              >
                <div className="text-sm text-gray-900 flex-1">{theme}</div>
                <button
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors ml-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onThemeSelect?.(theme);
                  }}
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        )}

        {((viewMode === "pairs" && filteredPairs.length === 0) ||
          (viewMode === "styles" && filteredStyles.length === 0) ||
          (viewMode === "themes" && filteredThemes.length === 0)) && (
          <div className="text-center py-8 text-gray-400">No results found</div>
        )}
      </div>
    </div>
  );
}
