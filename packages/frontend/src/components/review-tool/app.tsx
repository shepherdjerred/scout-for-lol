/**
 * Main application component
 */
import { useState, useSyncExternalStore } from "react";
import type { GenerationResult, GlobalConfig, TabConfig } from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import {
  createDefaultGlobalConfig,
  createDefaultTabConfig,
  mergeConfigs,
  splitConfig,
} from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import {
  loadCurrentConfig,
  saveCurrentConfig,
  loadGlobalConfig,
  saveGlobalConfig,
} from "@scout-for-lol/frontend/lib/review-tool/config-manager";
import { CostTracker } from "@scout-for-lol/frontend/lib/review-tool/costs";
import { migrateFromLocalStorage } from "@scout-for-lol/frontend/lib/review-tool/storage";
import { TabBar } from "./tab-bar";
import { ConfigModal } from "./config-modal";
import { TabSettingsPanel } from "./tab-settings-panel";
import { ResultsPanel } from "./results-panel";
import { MatchBrowser } from "./match-browser";
import { MatchDetailsPanel } from "./match-details-panel";
import { RatingsAnalytics } from "./ratings-analytics";
import { Footer } from "./footer";
import type { CompletedMatch, ArenaMatch } from "@scout-for-lol/data";

export type TabData = {
  id: string;
  name: string;
  config: TabConfig;
  result?: GenerationResult;
  match?: CompletedMatch | ArenaMatch;
};

const MAX_TABS = 5;

// Store for app initialization state
type AppInitState = {
  globalConfig: GlobalConfig;
  tabs: TabData[];
  isInitialized: boolean;
};

let appInitState: AppInitState = {
  globalConfig: createDefaultGlobalConfig(),
  tabs: [
    {
      id: "tab-1",
      name: "Config 1",
      config: createDefaultTabConfig(),
    },
  ],
  isInitialized: false,
};

const appInitListeners = new Set<() => void>();

function subscribeToAppInit(callback: () => void) {
  appInitListeners.add(callback);
  return () => {
    appInitListeners.delete(callback);
  };
}

function getAppInitSnapshot() {
  return appInitState;
}

// Module-level initialization - runs once per app load
let appInitPromise: Promise<void> | null = null;

function initializeAppData() {
  appInitPromise ??= (async () => {
    try {
      // First, migrate any localStorage data to IndexedDB
      await migrateFromLocalStorage();

      // Then load from IndexedDB
      let globalConfig = await loadGlobalConfig();
      if (!globalConfig) {
        // Try migrating from old merged config
        const oldConfig = await loadCurrentConfig();
        if (oldConfig) {
          const { global } = splitConfig(oldConfig);
          globalConfig = global;
        } else {
          globalConfig = createDefaultGlobalConfig();
        }
      }

      // Load tab config
      let tabs: TabData[];
      const oldConfig = await loadCurrentConfig();
      if (oldConfig) {
        const { tab } = splitConfig(oldConfig);
        tabs = [
          {
            id: "tab-1",
            name: "Config 1",
            config: tab,
          },
        ];
      } else {
        tabs = [
          {
            id: "tab-1",
            name: "Config 1",
            config: createDefaultTabConfig(),
          },
        ];
      }

      // Create new object reference to trigger useSyncExternalStore update
      appInitState = {
        globalConfig,
        tabs,
        isInitialized: true,
      };
      appInitListeners.forEach((listener) => {
        listener();
      });
    } catch (error) {
      console.error("Failed to initialize app:", error);
      // Still update state even on error so component can render
      appInitState.isInitialized = true;
      appInitListeners.forEach((listener) => {
        listener();
      });
      throw error;
    }
  })();
  return appInitPromise;
}

// Start initialization immediately
void initializeAppData();

export default function App() {
  // Subscribe to app initialization state
  const initState = useSyncExternalStore(subscribeToAppInit, getAppInitSnapshot, getAppInitSnapshot);
  const { globalConfig, tabs, isInitialized } = initState;

  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [costTracker] = useState(() => new CostTracker());
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Show loading state while initializing
  if (!isInitialized) {
    return <div className="p-4 text-gray-900 dark:text-white">Loading configuration...</div>;
  }

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  // Wrapper to save global config when it changes
  const updateGlobalConfig = (config: GlobalConfig) => {
    appInitState = { ...appInitState, globalConfig: config };
    appInitListeners.forEach((listener) => {
      listener();
    });
    // Save config when it changes
    void saveGlobalConfig(config);
  };

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

    appInitState = { ...appInitState, tabs: [...tabs, newTab] };
    appInitListeners.forEach((listener) => {
      listener();
    });
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

    appInitState = { ...appInitState, tabs: [...tabs, newTab] };
    appInitListeners.forEach((listener) => {
      listener();
    });
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) {
      alert("Cannot close the last tab");
      return;
    }

    const index = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    appInitState = { ...appInitState, tabs: newTabs };
    appInitListeners.forEach((listener) => {
      listener();
    });

    // Set active tab to the one before or after the closed tab
    if (activeTabId === id) {
      const newActiveTab = newTabs[index] ?? newTabs[index - 1] ?? newTabs[0];
      if (newActiveTab) {
        setActiveTabId(newActiveTab.id);
      }
    }
  };

  const updateTabConfig = (id: string, config: TabConfig) => {
    const newTabs = tabs.map((t) => (t.id === id ? { ...t, config } : t));
    appInitState = { ...appInitState, tabs: newTabs };
    appInitListeners.forEach((listener) => {
      listener();
    });
    // Save config when it changes
    const updatedTab = newTabs.find((t) => t.id === id);
    if (updatedTab) {
      const merged = mergeConfigs(globalConfig, updatedTab.config);
      void saveCurrentConfig(merged);
    }
  };

  const updateTabResult = (id: string, result: GenerationResult) => {
    const newTabs = tabs.map((t) => (t.id === id ? { ...t, result } : t));
    appInitState = { ...appInitState, tabs: newTabs };
    appInitListeners.forEach((listener) => {
      listener();
    });
  };

  const updateTabMatch = (id: string, match: CompletedMatch | ArenaMatch) => {
    const newTabs = tabs.map((t) => (t.id === id ? { ...t, match } : t));
    appInitState = { ...appInitState, tabs: newTabs };
    appInitListeners.forEach((listener) => {
      listener();
    });
  };

  const updateTabName = (id: string, name: string) => {
    const newTabs = tabs.map((t) => (t.id === id ? { ...t, name } : t));
    appInitState = { ...appInitState, tabs: newTabs };
    appInitListeners.forEach((listener) => {
      listener();
    });
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
        onGlobalChange={updateGlobalConfig}
      />
    </div>
  );
}
