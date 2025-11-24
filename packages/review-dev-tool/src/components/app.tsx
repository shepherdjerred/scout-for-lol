/**
 * Main application component
 */
import { useState, useEffect } from "react";
import type { GenerationResult, GlobalConfig, TabConfig } from "@scout-for-lol/review-dev-tool/config/schema";
import {
  createDefaultGlobalConfig,
  createDefaultTabConfig,
  mergeConfigs,
  splitConfig,
} from "@scout-for-lol/review-dev-tool/config/schema";
import {
  loadCurrentConfig,
  saveCurrentConfig,
  loadGlobalConfig,
  saveGlobalConfig,
} from "@scout-for-lol/review-dev-tool/lib/config-manager";
import { CostTracker } from "@scout-for-lol/review-dev-tool/lib/costs";
import { migrateFromLocalStorage } from "@scout-for-lol/review-dev-tool/lib/storage";
import { TabBar } from "@scout-for-lol/review-dev-tool/components/tab-bar";
import { ConfigModal } from "@scout-for-lol/review-dev-tool/components/config-modal";
import { TabSettingsPanel } from "@scout-for-lol/review-dev-tool/components/tab-settings-panel";
import { ResultsPanel } from "@scout-for-lol/review-dev-tool/components/results-panel";
import { MatchBrowser } from "@scout-for-lol/review-dev-tool/components/match-browser";
import { MatchDetailsPanel } from "@scout-for-lol/review-dev-tool/components/match-details-panel";
import { RatingsAnalytics } from "@scout-for-lol/review-dev-tool/components/ratings-analytics";
import { Footer } from "@scout-for-lol/review-dev-tool/components/footer";
import type { CompletedMatch, ArenaMatch } from "@scout-for-lol/data";

export type TabData = {
  id: string;
  name: string;
  config: TabConfig;
  result?: GenerationResult;
  match?: CompletedMatch | ArenaMatch;
};

const MAX_TABS = 5;

export default function App() {
  // Initialize with defaults
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(createDefaultGlobalConfig());
  const [tabs, setTabs] = useState<TabData[]>([
    {
      id: "tab-1",
      name: "Config 1",
      config: createDefaultTabConfig(),
    },
  ]);
  const [isInitialized, setIsInitialized] = useState(false);

  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [costTracker] = useState(() => new CostTracker());
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  // Migrate from localStorage and load initial configs
  useEffect(() => {
    const initializeApp = async () => {
      // First, migrate any localStorage data to IndexedDB
      await migrateFromLocalStorage();

      // Then load from IndexedDB
      const loaded = await loadGlobalConfig();
      if (loaded) {
        setGlobalConfig(loaded);
      } else {
        // Try migrating from old merged config
        const oldConfig = await loadCurrentConfig();
        if (oldConfig) {
          const { global } = splitConfig(oldConfig);
          setGlobalConfig(global);
        }
      }

      // Load tab config
      const oldConfig = await loadCurrentConfig();
      if (oldConfig) {
        const { tab } = splitConfig(oldConfig);
        setTabs([
          {
            id: "tab-1",
            name: "Config 1",
            config: tab,
          },
        ]);
      }

      setIsInitialized(true);
    };

    void initializeApp();
  }, []);

  // Save global config when it changes (after initialization)
  useEffect(() => {
    if (isInitialized) {
      void saveGlobalConfig(globalConfig);
    }
  }, [globalConfig, isInitialized]);

  // Save current tab config when it changes (after initialization)
  useEffect(() => {
    if (isInitialized && activeTab) {
      // Save as merged config for backwards compatibility
      const merged = mergeConfigs(globalConfig, activeTab.config);
      void saveCurrentConfig(merged);
    }
  }, [activeTab, activeTab?.config, globalConfig, isInitialized]);

  const addTab = () => {
    if (tabs.length >= MAX_TABS) {
      alert(`Maximum ${MAX_TABS.toString()} tabs allowed`);
      return;
    }

    const newTab: TabData = {
      id: `tab-${Date.now().toString()}`,
      name: `Config ${(tabs.length + 1).toString()}`,
      config: createDefaultTabConfig(),
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const cloneTab = (id: string) => {
    if (tabs.length >= MAX_TABS) {
      alert(`Maximum ${MAX_TABS.toString()} tabs allowed`);
      return;
    }

    const tabToClone = tabs.find((t) => t.id === id);
    if (!tabToClone) {
      return;
    }

    const newTab: TabData = {
      id: `tab-${Date.now().toString()}`,
      name: `${tabToClone.name} (Copy)`,
      config: structuredClone(tabToClone.config),
      // Don't copy result or match - start fresh
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

  const updateTabConfig = (id: string, config: TabConfig) => {
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
    return <div className="p-4 text-gray-900 dark:text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Generator Dev Tool</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Experiment with match review generation settings</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowConfigModal(true);
              }}
              className="px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              title="Configure API keys and settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </button>
            <button
              onClick={() => {
                setShowAnalytics(!showAnalytics);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              {showAnalytics ? "Hide Ratings" : "View Ratings"}
            </button>
          </div>
        </div>
      </header>

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={setActiveTabId}
        onTabClose={closeTab}
        onTabAdd={addTab}
        onTabClone={cloneTab}
        onTabRename={updateTabName}
      />

      <div className="flex-1">
        {showAnalytics ? (
          <div className="p-6">
            <RatingsAnalytics />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <MatchBrowser
                  onMatchSelected={(match) => {
                    updateTabMatch(activeTabId, match);
                  }}
                  apiSettings={globalConfig.api}
                />
              </div>
              {activeTab.match && <MatchDetailsPanel match={activeTab.match} />}
              <TabSettingsPanel
                config={activeTab.config}
                onChange={(config) => {
                  updateTabConfig(activeTabId, config);
                }}
              />
            </div>
            <div className="space-y-6">
              <ResultsPanel
                config={mergeConfigs(globalConfig, activeTab.config)}
                match={activeTab.match}
                result={activeTab.result}
                costTracker={costTracker}
                onResultGenerated={(result) => {
                  updateTabResult(activeTabId, result);
                }}
              />
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* API Configuration Modal */}
      <ConfigModal
        isOpen={showConfigModal}
        onClose={() => {
          setShowConfigModal(false);
        }}
        globalConfig={globalConfig}
        onGlobalChange={setGlobalConfig}
      />
    </div>
  );
}
