/**
 * Personality management UI
 */
import { useState, useEffect } from "react";
import { BUILTIN_PERSONALITIES } from "../lib/prompts";
import type { Personality } from "../config/schema";
import {
  loadCustomPersonalities,
  addCustomPersonality,
  updateCustomPersonality,
  deleteCustomPersonality,
  isCustomPersonality,
  generatePersonalityId,
} from "../lib/personality-storage";
import { PersonalityEditor } from "./PersonalityEditor";

interface PersonalityManagerProps {
  onPersonalitySelect: (personality: Personality) => void;
}

export function PersonalityManager({ onPersonalitySelect }: PersonalityManagerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customPersonalities, setCustomPersonalities] = useState<Personality[]>([]);
  const [editingPersonality, setEditingPersonality] = useState<Personality | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Load custom personalities on mount
  useEffect(() => {
    setCustomPersonalities(loadCustomPersonalities());
  }, []);

  const allPersonalities = [...BUILTIN_PERSONALITIES.filter((p) => p.id !== "generic"), ...customPersonalities];
  const selectedPersonality = selectedId ? allPersonalities.find((p) => p.id === selectedId) : null;

  const handleCreateNew = () => {
    setEditingPersonality(null);
    setShowEditor(true);
  };

  const handleEdit = (personality: Personality) => {
    setEditingPersonality(personality);
    setShowEditor(true);
  };

  const handleSave = (personality: Personality) => {
    if (editingPersonality) {
      // Update existing
      updateCustomPersonality(personality.id, personality);
    } else {
      // Create new with generated ID
      const newPersonality = {
        ...personality,
        id: generatePersonalityId(personality.metadata.name),
      };
      addCustomPersonality(newPersonality);
    }

    setCustomPersonalities(loadCustomPersonalities());
    setShowEditor(false);
    setEditingPersonality(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this personality?")) {
      deleteCustomPersonality(id);
      setCustomPersonalities(loadCustomPersonalities());
      if (selectedId === id) {
        setSelectedId(null);
      }
    }
  };

  return (
    <>
      {showEditor && (
        <PersonalityEditor
          personality={editingPersonality ?? undefined}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false);
            setEditingPersonality(null);
          }}
        />
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Personality Manager</h3>
              <p className="text-sm text-gray-600">Browse, create, and edit reviewer personalities</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
            >
              + Create New
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-200">
          {/* Personality List */}
          <div className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Available Personalities ({allPersonalities.length})
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allPersonalities.map((personality) => {
                const isCustom = isCustomPersonality(personality.id);
                return (
                  <button
                    key={personality.id}
                    onClick={() => setSelectedId(personality.id)}
                    className={`
                    w-full text-left px-4 py-3 rounded border-2 transition-colors relative
                    ${
                      selectedId === personality.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }
                  `}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {personality.metadata.name}
                          {isCustom && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Custom</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {personality.metadata.description.substring(0, 60)}
                          {personality.metadata.description.length > 60 ? "..." : ""}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {personality.metadata.favoriteChampions.slice(0, 3).map((champ) => (
                            <span key={champ} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                              {champ}
                            </span>
                          ))}
                        </div>
                      </div>
                      {isCustom && (
                        <div className="flex flex-col gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(personality);
                            }}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(personality.id);
                            }}
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personality Details */}
          <div className="p-4">
            {selectedPersonality ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Name</h4>
                  <div className="text-gray-900">{selectedPersonality.metadata.name}</div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                  <div className="text-sm text-gray-600">{selectedPersonality.metadata.description}</div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Favorite Champions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPersonality.metadata.favoriteChampions.map((champ) => (
                      <span key={champ} className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded">
                        {champ}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Favorite Lanes</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPersonality.metadata.favoriteLanes.map((lane) => (
                      <span key={lane} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                        {lane}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Instructions</h4>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {selectedPersonality.instructions}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onPersonalitySelect(selectedPersonality)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Use This Personality
                  </button>
                  {isCustomPersonality(selectedPersonality.id) && (
                    <button
                      onClick={() => handleEdit(selectedPersonality)}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Select a personality to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
