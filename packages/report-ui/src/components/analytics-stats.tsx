import React from "react";

type StatisticsData = {
  totalImages: number;
  ratedImages: number;
  unratedImages: number;
  averageRating: number;
  ratingCounts: Record<number, number>;
};

export function StatisticsCards({ stats }: { stats: StatisticsData }): React.ReactNode {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      <div style={{ padding: "16px", backgroundColor: "#f3f4f6", borderRadius: "8px" }}>
        <div style={{ fontSize: "24px", fontWeight: 700, color: "#1f2937" }}>{stats.totalImages.toString()}</div>
        <div style={{ fontSize: "13px", color: "#6b7280" }}>Total Images</div>
      </div>
      <div style={{ padding: "16px", backgroundColor: "#dbeafe", borderRadius: "8px" }}>
        <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e40af" }}>{stats.ratedImages.toString()}</div>
        <div style={{ fontSize: "13px", color: "#1e40af" }}>Rated</div>
      </div>
      <div style={{ padding: "16px", backgroundColor: "#fef3c7", borderRadius: "8px" }}>
        <div style={{ fontSize: "24px", fontWeight: 700, color: "#92400e" }}>{stats.unratedImages.toString()}</div>
        <div style={{ fontSize: "13px", color: "#92400e" }}>Unrated</div>
      </div>
      <div style={{ padding: "16px", backgroundColor: "#dcfce7", borderRadius: "8px" }}>
        <div style={{ fontSize: "24px", fontWeight: 700, color: "#166534" }}>{stats.averageRating.toFixed(2)}</div>
        <div style={{ fontSize: "13px", color: "#166534" }}>Average Rating</div>
      </div>
    </div>
  );
}

export function RatingDistribution({ ratingCounts }: { ratingCounts: Record<number, number> }): React.ReactNode {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        marginBottom: "24px",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "16px" }}>Rating Distribution</h3>
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", height: "120px" }}>
        {[1, 2, 3, 4].map((rating) => {
          const count = ratingCounts[rating] ?? 0;
          const maxCount = Math.max(...Object.values(ratingCounts));
          const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={rating} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: "100%",
                  height: `${height.toString()}%`,
                  backgroundColor: "#3b82f6",
                  borderRadius: "4px 4px 0 0",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  paddingTop: "8px",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "14px",
                  minHeight: count > 0 ? "30px" : "0",
                }}
              >
                {count.toString()}
              </div>
              <div style={{ marginTop: "8px", fontSize: "14px", fontWeight: 500, color: "#6b7280" }}>
                {rating.toString()} ⭐
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type PerformanceStat = {
  name: string;
  average: number;
  count: number;
};

export function TopPerformers({
  title,
  stats,
  countLabel,
}: {
  title: string;
  stats: PerformanceStat[];
  countLabel: string;
}): React.ReactNode {
  if (stats.length === 0) return null;

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        marginBottom: "24px",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "16px" }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {stats.slice(0, 5).map((stat) => (
          <div
            key={stat.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              backgroundColor: "#f9fafb",
              borderRadius: "6px",
            }}
          >
            <div style={{ flex: 1, fontSize: "14px", color: "#374151" }}>{stat.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                ({stat.count.toString()} {countLabel})
              </span>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", minWidth: "40px" }}>
                {stat.average.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
