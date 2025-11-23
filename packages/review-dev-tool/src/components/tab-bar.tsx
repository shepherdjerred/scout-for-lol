/**
 * Tab bar for switching between configurations
 */
import { useState } from "react";
import type { TabData } from "./app";

type TabBarProps = {
  tabs: TabData[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabAdd: () => void;
  onTabClone: (id: string) => void;
  onTabRename: (id: string, name: string) => void;
};

export function TabBar({ tabs, activeTabId, onTabSelect, onTabClose, onTabAdd, onTabClone, onTabRename }: TabBarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startEditing = (tab: TabData) => {
    setEditingTabId(tab.id);
    setEditName(tab.name);
  };

  const finishEditing = () => {
    if (editingTabId && editName.trim()) {
      onTabRename(editingTabId, editName.trim());
    }
    setEditingTabId(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
      <div className="flex items-center gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`
              flex items-center gap-2 px-4 py-3 border-b-2 cursor-pointer transition-colors
              ${
                activeTabId === tab.id
                  ? "border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }
            `}
          >
            {editingTabId === tab.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                }}
                onBlur={finishEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishEditing();
                  if (e.key === "Escape") setEditingTabId(null);
                }}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm"
                autoFocus
              />
            ) : (
              <span
                onClick={() => {
                  onTabSelect(tab.id);
                }}
                onDoubleClick={() => {
                  startEditing(tab);
                }}
                className="font-medium whitespace-nowrap"
              >
                {tab.name}
              </span>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClone(tab.id);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                title="Clone tab"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Close tab"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          onClick={onTabAdd}
          className="px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          title="Add new tab"
        >
          + Add Tab
        </button>
      </div>
    </div>
  );
}
