/**
 * Theme selector for switching between light and dark modes
 */
import { useSyncExternalStore } from "react";
import { z } from "zod";
import { STORES, getItem, setItem } from "@scout-for-lol/review-dev-tool/lib/storage";

const BooleanSchema = z.boolean();

// Store for theme state
let themeState: { isDarkMode: boolean; isInitialized: boolean } = {
  isDarkMode: true,
  isInitialized: false,
};

const themeListeners = new Set<() => void>();

function subscribeToTheme(callback: () => void) {
  themeListeners.add(callback);
  return () => {
    themeListeners.delete(callback);
  };
}

function getThemeSnapshot() {
  return themeState;
}

// Load theme preference at module level
let themeLoadPromise: Promise<void> | null = null;

function loadThemeData() {
  themeLoadPromise ??= (async () => {
    const WindowSchema = z.object({}).passthrough();
    const windowResult = WindowSchema.safeParse(globalThis.window);
    if (!windowResult.success) {
      themeState = { isDarkMode: true, isInitialized: true };
      themeListeners.forEach((listener) => {
        listener();
      });
      return;
    }

    try {
      const saved = await getItem(STORES.PREFERENCES, "darkMode");
      if (saved !== null) {
        const result = BooleanSchema.safeParse(saved);
        if (result.success) {
          themeState = { isDarkMode: result.data, isInitialized: true };
          // Apply to DOM
          if (result.data) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        } else {
          themeState = { isDarkMode: true, isInitialized: true };
        }
      } else {
        themeState = { isDarkMode: true, isInitialized: true };
        // Apply default to DOM
        document.documentElement.classList.add("dark");
      }
    } catch {
      // Use default (dark mode)
      themeState = { isDarkMode: true, isInitialized: true };
      document.documentElement.classList.add("dark");
    }
    themeListeners.forEach((listener) => {
      listener();
    });
  })();
  return themeLoadPromise;
}

// Start loading immediately
void loadThemeData();

export function ThemeSelector() {
  // Subscribe to theme state
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getThemeSnapshot);
  const { isDarkMode } = theme;

  const handleToggle = (): void => {
    const newDarkMode = !isDarkMode;
    themeState = { ...themeState, isDarkMode: newDarkMode };
    themeListeners.forEach((listener) => {
      listener();
    });

    // Apply theme change immediately and save
    const WindowSchema = z.object({}).passthrough();
    const windowResult = WindowSchema.safeParse(globalThis.window);
    if (windowResult.success) {
      if (newDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      void setItem(STORES.PREFERENCES, "darkMode", newDarkMode);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          Light
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          Dark
        </>
      )}
    </button>
  );
}
