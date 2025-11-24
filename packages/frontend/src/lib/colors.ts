/**
 * Shared color variant mappings for consistent styling across components
 */

export type ColorVariant = "green" | "blue" | "purple" | "indigo" | "yellow" | "red" | "gray";

export interface ColorClasses {
  bg: string;
  border: string;
  text: string;
  title?: string;
}

/**
 * Icon/badge background colors with dark mode support
 */
export const iconColors: Record<ColorVariant, string> = {
  green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
  yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
  red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  gray: "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400",
};

/**
 * Solid icon background colors for darker backgrounds
 */
export const solidIconColors: Record<ColorVariant, string> = {
  green: "bg-green-600",
  blue: "bg-blue-600",
  purple: "bg-purple-600",
  indigo: "bg-indigo-600",
  yellow: "bg-yellow-600",
  red: "bg-red-600",
  gray: "bg-gray-600",
};

/**
 * Badge/text colors for inline badges
 */
export const badgeColors: Record<ColorVariant, string> = {
  green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  red: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  gray: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400",
};

/**
 * Box/container variants with backgrounds, borders, and text colors
 */
export const boxVariants: Record<string, ColorClasses> = {
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-700 dark:text-blue-300",
    title: "text-blue-800 dark:text-blue-300",
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-900/30",
    border: "border-yellow-200 dark:border-yellow-700",
    text: "text-yellow-700 dark:text-yellow-300",
    title: "text-yellow-800 dark:text-yellow-300",
  },
  success: {
    bg: "bg-green-50 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-700",
    text: "text-green-700 dark:text-green-300",
    title: "text-green-800 dark:text-green-300",
  },
  danger: {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-300 dark:border-red-700",
    text: "text-red-700 dark:text-red-300",
    title: "text-red-800 dark:text-red-300",
  },
  note: {
    bg: "bg-gray-50 dark:bg-gray-800",
    border: "border-gray-200 dark:border-gray-700",
    text: "text-gray-700 dark:text-gray-300",
    title: "text-gray-900 dark:text-white",
  },
};

/**
 * Gradient colors for StatCard and similar components
 */
export const gradientColors: Record<string, string> = {
  yellow: "from-yellow-500 to-orange-600",
  purple: "from-purple-600 to-pink-600",
  blue: "from-blue-600 to-cyan-600",
  green: "from-green-500 to-emerald-600",
  red: "from-red-500 to-pink-600",
  indigo: "from-indigo-600 to-purple-600",
};
