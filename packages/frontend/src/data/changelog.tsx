import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export type ChangelogEntry = {
  date: string;
  banner: ReactNode;
  text: ReactNode;
  formatted: {
    year: number;
    month: number;
    day: number;
  };
};

export function renderChangelogToHtml(content: ReactNode): string {
  return renderToStaticMarkup(content);
}

export const changelog: ChangelogEntry[] = [
  {
    date: "2025 11 23",
    banner: (
      <>
        <strong>Clash indicator</strong> on match reports
      </>
    ),
    text: (
      <>
        <section className="border-l-4 border-yellow-600 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 rounded-r-lg p-4">
          <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-300 mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-yellow-600 dark:bg-yellow-400 rounded-full"></span>
            Match Reports
          </h3>
          <ul className="space-y-2 list-none pl-4">
            <li className="text-gray-700 dark:text-gray-300 flex items-start gap-3">
              <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg leading-none">→</span>
              <span>Add clash badge indicator for clash and ARAM clash games</span>
            </li>
          </ul>
        </section>
      </>
    ),
    formatted: {
      year: 2025,
      month: 11,
      day: 23,
    },
  },
  {
    date: "2025 11 16",
    banner: (
      <>
        <strong>Arena reports</strong> with augment icons, <strong>subscription limits</strong> increased, and more!
      </>
    ),
    text: (
      <>
        <section className="border-l-4 border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 rounded-r-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
            Arena Reports
          </h3>
          <ul className="space-y-2 list-none pl-4">
            <li className="text-gray-700 dark:text-gray-300 flex items-start gap-3">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg leading-none">→</span>
              <span>Add augment icons</span>
            </li>
            <li className="text-gray-700 dark:text-gray-300 flex items-start gap-3">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg leading-none">→</span>
              <span>Reorganize report image layout</span>
            </li>
            <li className="text-gray-700 dark:text-gray-300 flex items-start gap-3">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg leading-none">→</span>
              <span>Add team KDA</span>
            </li>
          </ul>
        </section>
        <section className="border-l-4 border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 rounded-r-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
            Subscription Commands
          </h3>
          <ul className="space-y-2 list-none pl-4">
            <li className="text-gray-700 dark:text-gray-300 flex items-start gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-lg leading-none">→</span>
              <span>Increase limits from 10 → 50 accounts per server</span>
            </li>
            <li className="text-gray-700 dark:text-gray-300 flex items-start gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-lg leading-none">→</span>
              <span>Increase limits from 10 → 75 subscriptions per server</span>
            </li>
            <li className="text-gray-700 dark:text-gray-300 flex items-start gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-lg leading-none">→</span>
              <span>Add messages for approaching limits</span>
            </li>
          </ul>
        </section>
        <section className="border-l-4 border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/30 rounded-r-lg p-4">
          <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full"></span>
            Site
          </h3>
          <ul className="space-y-2 list-none pl-4">
            <li className="text-gray-700 dark:text-gray-300 flex items-start gap-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold text-lg leading-none">→</span>
              <span>Add changelog and What's New page</span>
            </li>
          </ul>
        </section>
      </>
    ),
    formatted: {
      year: 2025,
      month: 11,
      day: 16,
    },
  },
];

export function formatChangelogDate(entry: ChangelogEntry): string {
  const { year, month, day } = entry.formatted;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
