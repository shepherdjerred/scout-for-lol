/**
 * Analytics view showing rating statistics
 */
import { useMemo, useState, useEffect } from "react";
import { loadHistory } from "../lib/history-manager";

export function RatingsAnalytics() {
  const [history, setHistory] = useState<Awaited<ReturnType<typeof loadHistory>>>([]);

  useEffect(() => {
    void (async () => {
      const loaded = await loadHistory();
      setHistory(loaded);
    })();
  }, []);

  const statistics = useMemo(() => {
    const ratedEntries = history.filter((entry) => entry.rating && entry.status === "complete");

    // Overall stats
    const totalRated = ratedEntries.length;
    const averageRating =
      totalRated > 0 ? ratedEntries.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) / totalRated : 0;

    // Rating distribution
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const entry of ratedEntries) {
      if (entry.rating) {
        ratingCounts[entry.rating] = (ratingCounts[entry.rating] ?? 0) + 1;
      }
    }

    // Personality stats
    const personalityMap = new Map<string, { total: number; sum: number }>();
    for (const entry of ratedEntries) {
      const personality = entry.configSnapshot.personality;
      if (personality && entry.rating) {
        const existing = personalityMap.get(personality);
        if (existing) {
          existing.total += 1;
          existing.sum += entry.rating;
        } else {
          personalityMap.set(personality, { total: 1, sum: entry.rating });
        }
      }
    }

    const personalityStats = Array.from(personalityMap.entries())
      .map(([personality, data]) => ({
        personality,
        average: data.sum / data.total,
        count: data.total,
      }))
      .sort((a, b) => b.average - a.average);

    // Art style stats
    const styleMap = new Map<string, { total: number; sum: number }>();
    for (const entry of ratedEntries) {
      const style = entry.configSnapshot.artStyle;
      if (style && entry.rating) {
        const existing = styleMap.get(style);
        if (existing) {
          existing.total += 1;
          existing.sum += entry.rating;
        } else {
          styleMap.set(style, { total: 1, sum: entry.rating });
        }
      }
    }

    const styleStats = Array.from(styleMap.entries())
      .map(([style, data]) => ({
        style: style.length > 60 ? `${style.substring(0, 60)}...` : style,
        average: data.sum / data.total,
        count: data.total,
      }))
      .sort((a, b) => b.average - a.average);

    // Art theme stats
    const themeMap = new Map<string, { total: number; sum: number }>();
    for (const entry of ratedEntries) {
      const theme = entry.configSnapshot.artTheme;
      if (theme && entry.rating) {
        const existing = themeMap.get(theme);
        if (existing) {
          existing.total += 1;
          existing.sum += entry.rating;
        } else {
          themeMap.set(theme, { total: 1, sum: entry.rating });
        }
      }
    }

    const themeStats = Array.from(themeMap.entries())
      .map(([theme, data]) => ({
        theme: theme.length > 60 ? `${theme.substring(0, 60)}...` : theme,
        average: data.sum / data.total,
        count: data.total,
      }))
      .sort((a, b) => b.average - a.average);

    return {
      totalRated,
      totalGenerated: history.filter((e) => e.status === "complete").length,
      averageRating,
      ratingCounts,
      personalityStats,
      styleStats,
      themeStats,
    };
  }, [history]);

  if (statistics.totalRated === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="text-4xl mb-3">📊</div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No ratings yet</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
          Generate some reviews and rate them to see analytics here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Rating Analytics</h2>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalRated}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Rated Generations</div>
          </div>
          <div className="p-4 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-900">{statistics.totalGenerated}</div>
            <div className="text-sm text-blue-700">Total Generations</div>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-900">{statistics.averageRating.toFixed(2)}</div>
            <div className="text-sm text-green-700">Average Rating</div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Rating Distribution</h3>
          <div className="flex gap-4 items-end h-32">
            {[1, 2, 3, 4].map((rating) => {
              const count = statistics.ratingCounts[rating] ?? 0;
              const maxCount = Math.max(...Object.values(statistics.ratingCounts));
              const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

              return (
                <div key={rating} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all flex items-start justify-center pt-2 text-white font-semibold text-sm"
                    style={{ height: `${height}%`, minHeight: count > 0 ? "32px" : "0" }}
                  >
                    {count > 0 && count}
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">
                    {rating} ⭐
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Best Personalities */}
      {statistics.personalityStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Best Personalities</h3>
          <div className="space-y-2">
            {statistics.personalityStats.slice(0, 10).map((stat) => (
              <div
                key={stat.personality}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{stat.personality}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    {stat.count} generations
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-600">{stat.average.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Art Styles */}
      {statistics.styleStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Best Art Styles</h3>
          <div className="space-y-2">
            {statistics.styleStats.slice(0, 10).map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{stat.style}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    {stat.count} generations
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-600">{stat.average.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Art Themes */}
      {statistics.themeStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Best Art Themes</h3>
          <div className="space-y-2">
            {statistics.themeStats.slice(0, 10).map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{stat.theme}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    {stat.count} generations
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-600">{stat.average.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
