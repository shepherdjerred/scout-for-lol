/**
 * Main application component
 */
import { useState, useEffect } from "react";
import type { ReviewConfig, GenerationResult } from "../config/schema";
import { createDefaultConfig } from "../config/schema";
import { loadCurrentConfig, saveCurrentConfig } from "../lib/config-manager";
import { CostTracker } from "../lib/costs";
import { TabBar } from "./TabBar";
import { SettingsPanel } from "./SettingsPanel";
import { ResultsPanel } from "./ResultsPanel";
import { MatchBrowser } from "./MatchBrowser";
import { PersonalityManager } from "./PersonalityManager";
import { Footer } from "./Footer";
import type { CompletedMatch, ArenaMatch } from "@scout-for-lol/data";

export interface TabData {
  id: string;
  name: string;
  config: ReviewConfig;
  result?: GenerationResult;
  match?: CompletedMatch | ArenaMatch;
}

const MAX_TABS = 5;

export default function App() {
  const [tabs, setTabs] = useState<TabData[]>([
    {
      id: "tab-1",
      name: "Config 1",
      config: loadCurrentConfig() ?? createDefaultConfig(),
    },
  ]);
  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [costTracker] = useState(() => new CostTracker());
  const [showPersonalityManager, setShowPersonalityManager] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  // Save current config when it changes
  useEffect(() => {
    if (activeTab) {
      saveCurrentConfig(activeTab.config);
    }
  }, [activeTab?.config]);

  const addTab = () => {
    if (tabs.length >= MAX_TABS) {
      alert(`Maximum ${MAX_TABS} tabs allowed`);
      return;
    }

    const newTab: TabData = {
      id: `tab-${Date.now()}`,
      name: `Config ${tabs.length + 1}`,
      config: createDefaultConfig(),
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) {
      alert("Cannot close the last tab");
      return;
    }

    const index = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);

    // Set active tab to the one before or after the closed tab
    if (activeTabId === id) {
      const newActiveTab = newTabs[index] ?? newTabs[index - 1] ?? newTabs[0];
      if (newActiveTab) {
        setActiveTabId(newActiveTab.id);
      }
    }
  };

  const updateTabConfig = (id: string, config: ReviewConfig) => {
    setTabs(tabs.map((t) => (t.id === id ? { ...t, config } : t)));
  };

  const updateTabResult = (id: string, result: GenerationResult) => {
    setTabs(tabs.map((t) => (t.id === id ? { ...t, result } : t)));
  };

  const updateTabMatch = (id: string, match: CompletedMatch | ArenaMatch) => {
    setTabs(tabs.map((t) => (t.id === id ? { ...t, match } : t)));
  };

  const updateTabName = (id: string, name: string) => {
    setTabs(tabs.map((t) => (t.id === id ? { ...t, name } : t)));
  };

  if (!activeTab) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Review Generator Dev Tool</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Experiment with match review generation settings
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPersonalityManager(!showPersonalityManager)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {showPersonalityManager ? "Hide" : "Manage"} Personalities
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1">
        {showPersonalityManager && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <PersonalityManager
            onPersonalitySelect={(personality) => {
              updateTabConfig(activeTabId, {
                ...activeTab.config,
                prompts: {
                  ...activeTab.config.prompts,
                  customPersonality: personality,
                  personalityId: personality.id,
                },
              });
              setShowPersonalityManager(false);
            }}
          />
          </div>
        )}

        <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={setActiveTabId}
        onTabClose={closeTab}
        onTabAdd={addTab}
        onTabRename={updateTabName}
      />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <MatchBrowser
              onMatchSelected={(match) => {
                updateTabMatch(activeTabId, match);
              }}
              apiSettings={activeTab.config.api}
            />
          </div>
          <SettingsPanel
            config={activeTab.config}
            onChange={(config) => updateTabConfig(activeTabId, config)}
            onOpenPersonalityManager={() => setShowPersonalityManager(true)}
          />
        </div>
          <div className="space-y-6">
            <ResultsPanel
              config={activeTab.config}
              match={activeTab.match}
              result={activeTab.result}
              costTracker={costTracker}
              onResultGenerated={(result) => updateTabResult(activeTabId, result)}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
