/**
 * Application header with integrated tabs and quick actions
 */
import { useState } from "react";
import type { TabData } from "./app";
import { Button } from "./ui/button";
import { IconButton } from "./ui/icon-button";
import { ThemeToggle } from "./ui/theme-toggle";

type AppHeaderProps = {
  tabs: TabData[];
  activeTabId: string;
  showAnalytics: boolean;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabAdd: () => void;
  onTabClone: (id: string) => void;
  onTabRename: (id: string, name: string) => void;
  onSettingsClick: () => void;
  onAnalyticsToggle: () => void;
};

export function AppHeader({
  tabs,
  activeTabId,
  showAnalytics,
  onTabSelect,
  onTabClose,
  onTabAdd,
  onTabClone,
  onTabRename,
  onSettingsClick,
  onAnalyticsToggle,
}: AppHeaderProps) {
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
    <header className="sticky top-0 z-40 glass border-b border-surface-200/50 dark:border-surface-700/50">
      <div className="max-w-[1800px] mx-auto">
        {/* Top bar - Logo, title, actions */}
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-surface-900 dark:text-white">Review Generator</h1>
                <p className="text-xs text-surface-500 dark:text-surface-400">Scout for LoL Dev Tools</p>
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-2" />

            <Button variant={showAnalytics ? "primary" : "ghost"} size="sm" onClick={onAnalyticsToggle}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Analytics
            </Button>

            <Button variant="secondary" size="sm" onClick={onSettingsClick}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="px-6 border-t border-surface-200/50 dark:border-surface-700/50">
          <div className="flex items-center gap-1 -mb-px overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`
                  group relative flex items-center gap-2 px-4 py-3 cursor-pointer transition-all duration-200
                  ${
                    activeTabId === tab.id
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                  }
                `}
              >
                {/* Active indicator */}
                {activeTabId === tab.id && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-500 rounded-full" />
                )}

                {editingTabId === tab.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                    }}
                    onBlur={finishEditing}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        finishEditing();
                      }
                      if (e.key === "Escape") {
                        setEditingTabId(null);
                      }
                    }}
                    className="px-2 py-0.5 text-sm bg-white dark:bg-surface-800 border border-brand-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-surface-900 dark:text-white"
                    autoFocus
                  />
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onTabSelect(tab.id);
                    }}
                    onDoubleClick={() => {
                      startEditing(tab);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onTabSelect(tab.id);
                      }
                    }}
                    className="font-medium text-sm whitespace-nowrap"
                  >
                    {tab.name}
                  </span>
                )}

                {/* Tab actions - show on hover or when active */}
                <div
                  className={`flex items-center gap-0.5 transition-opacity ${
                    activeTabId === tab.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <IconButton
                    variant="ghost"
                    size="sm"
                    label="Clone tab"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabClone(tab.id);
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </IconButton>

                  {tabs.length > 1 && (
                    <IconButton
                      variant="danger"
                      size="sm"
                      label="Close tab"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabClose(tab.id);
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </IconButton>
                  )}
                </div>
              </div>
            ))}

            {/* Add tab button */}
            <button
              onClick={onTabAdd}
              className="flex items-center gap-1.5 px-3 py-2 mx-1 text-sm font-medium text-surface-400 hover:text-brand-500 dark:text-surface-500 dark:hover:text-brand-400 transition-colors rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
              title="Add new configuration tab"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
