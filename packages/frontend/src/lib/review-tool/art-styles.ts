/**
 * Art style selection utilities
 *
 * Re-exports the shared selectRandomStyleAndTheme from @scout-for-lol/data
 * which uses category-based matching for better style/theme combinations.
 */
export {
  selectRandomStyleAndTheme,
  type StyleThemeSelection,
} from "@scout-for-lol/data";
export { ART_STYLES, ART_THEMES } from "@scout-for-lol/data";
