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
    date: "2025 11 16",
    banner: (
      <>
        <strong>Arena reports</strong> with augment icons, <strong>subscription limits</strong> increased, and more!
      </>
    ),
    text: (
      <>
        <section className="border-l-4 border-indigo-600 bg-indigo-50 rounded-r-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-indigo-900 mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-indigo-600 rounded-full"></span>
            Arena Reports
          </h3>
          <ul className="space-y-2 list-none pl-4">
            <li className="text-gray-700 flex items-start gap-3">
              <span className="text-indigo-600 font-bold text-lg leading-none">→</span>
              <span>Add augment icons</span>
            </li>
            <li className="text-gray-700 flex items-start gap-3">
              <span className="text-indigo-600 font-bold text-lg leading-none">→</span>
              <span>Reorganize report image layout</span>
            </li>
            <li className="text-gray-700 flex items-start gap-3">
              <span className="text-indigo-600 font-bold text-lg leading-none">→</span>
              <span>Add team KDA</span>
            </li>
          </ul>
        </section>
        <section className="border-l-4 border-blue-600 bg-blue-50 rounded-r-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
            Subscription Commands
          </h3>
          <ul className="space-y-2 list-none pl-4">
            <li className="text-gray-700 flex items-start gap-3">
              <span className="text-blue-600 font-bold text-lg leading-none">→</span>
              <span>Increase limits from 10 → 50 accounts per server</span>
            </li>
            <li className="text-gray-700 flex items-start gap-3">
              <span className="text-blue-600 font-bold text-lg leading-none">→</span>
              <span>Increase limits from 10 → 75 subscriptions per server</span>
            </li>
            <li className="text-gray-700 flex items-start gap-3">
              <span className="text-blue-600 font-bold text-lg leading-none">→</span>
              <span>Add messages for approaching limits</span>
            </li>
          </ul>
        </section>
        <section className="border-l-4 border-purple-600 bg-purple-50 rounded-r-lg p-4">
          <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-purple-600 rounded-full"></span>
            Site
          </h3>
          <ul className="space-y-2 list-none pl-4">
            <li className="text-gray-700 flex items-start gap-3">
              <span className="text-purple-600 font-bold text-lg leading-none">→</span>
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
