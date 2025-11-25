/**
 * Footer component with cache management and theme selector
 */
import { CacheButton } from "./cache-button";
import { ThemeSelector } from "./theme-selector";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">Review Generator Dev Tool</div>
        <div className="flex gap-3">
          <CacheButton />
          <ThemeSelector />
        </div>
      </div>
    </footer>
  );
}
