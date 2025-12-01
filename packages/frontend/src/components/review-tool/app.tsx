/**
 * Main application component - Redesigned UI
 */
import { useState, useSyncExternalStore } from "react";
import {
  createDefaultGlobalConfig,
  createDefaultTabConfig,
  mergeConfigs,
  splitConfig,
  type GenerationResult,
  type GlobalConfig,
  type TabConfig,
} from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import {
  loadCurrentConfig,
  saveCurrentConfig,
  loadGlobalConfig,
  saveGlobalConfig,
} from "@scout-for-lol/frontend/lib/review-tool/config-manager";
import { CostTracker } from "@scout-for-lol/frontend/lib/review-tool/costs";
import { migrateFromLocalStorage } from "@scout-for-lol/frontend/lib/review-tool/storage";
import { AppHeader } from "./app-header.tsx";
import { ConfigModal } from "./config-modal.tsx";
import { TabSettingsPanel } from "./tab-settings-panel.tsx";
import { ResultsPanel } from "./results-panel.tsx";
import { MatchBrowser } from "./match-browser.tsx";
import { MatchDetailsPanel } from "./match-details-panel.tsx";
import { RatingsAnalytics } from "./ratings-analytics.tsx";
import { Spinner } from "./ui/spinner.tsx";
import type { CompletedMatch, ArenaMatch, RawMatch, RawTimeline } from "@scout-for-lol/data";

export type TabData = {
  id: string;
  name: string;
  config: TabConfig;
  result?: GenerationResult;
  match?: CompletedMatch | ArenaMatch;
  rawMatch?: RawMatch;
  rawTimeline?: RawTimeline;
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
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center">
        <div className="card p-8 flex flex-col items-center gap-4 animate-fade-in">
          <Spinner size="lg" className="text-brand-500" />
          <p className="text-surface-600 dark:text-surface-300 font-medium">Loading configuration...</p>
        </div>
      </div>
    );
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

  const updateTabMatch = (
    id: string,
    match: CompletedMatch | ArenaMatch,
    rawMatch: RawMatch,
    rawTimeline: RawTimeline | null,
  ) => {
    const newTabs = tabs.map((t) => {
      if (t.id !== id) {
        return t;
      }
      const updated: TabData = { ...t, match, rawMatch };
      if (rawTimeline) {
        updated.rawTimeline = rawTimeline;
      }
      return updated;
    });
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
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center">
        <div className="card p-8 text-surface-600 dark:text-surface-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 bg-hero-pattern">
      {/* Header with integrated tabs */}
      <AppHeader
        tabs={tabs}
        activeTabId={activeTabId}
        showAnalytics={showAnalytics}
        onTabSelect={setActiveTabId}
        onTabClose={closeTab}
        onTabAdd={addTab}
        onTabClone={cloneTab}
        onTabRename={updateTabName}
        onSettingsClick={() => {
          setShowConfigModal(true);
        }}
        onAnalyticsToggle={() => {
          setShowAnalytics(!showAnalytics);
        }}
      />

      {/* Main content area */}
      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {showAnalytics ? (
          <div className="animate-fade-in">
            <RatingsAnalytics />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-in">
            {/* Left column - Match selection & settings */}
            <div className="space-y-6">
              {/* Match Browser */}
              <section className="card p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-200/50 dark:border-surface-700/50">
                  <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Browse Matches</h2>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                    Select a match to generate a review
                  </p>
                </div>
                <MatchBrowser
                  onMatchSelected={(match, rawMatch, rawTimeline) => {
                    updateTabMatch(activeTabId, match, rawMatch, rawTimeline);
                  }}
                  apiSettings={globalConfig.api}
                />
              </section>

              {/* Selected Match Details */}
              {activeTab.match && (
                <section className="animate-slide-up">
                  <MatchDetailsPanel match={activeTab.match} />
                </section>
              )}

              {/* Generation Settings */}
              <section>
                <TabSettingsPanel
                  config={activeTab.config}
                  onChange={(config) => {
                    updateTabConfig(activeTabId, config);
                  }}
                />
              </section>
            </div>

            {/* Right column - Results */}
            <div className="space-y-6">
              <ResultsPanel
                config={mergeConfigs(globalConfig, activeTab.config)}
                match={activeTab.match}
                rawMatch={activeTab.rawMatch}
                rawTimeline={activeTab.rawTimeline}
                result={activeTab.result}
                costTracker={costTracker}
                onResultGenerated={(result) => {
                  updateTabResult(activeTabId, result);
                }}
              />
            </div>
          </div>
        )}
      </main>

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
