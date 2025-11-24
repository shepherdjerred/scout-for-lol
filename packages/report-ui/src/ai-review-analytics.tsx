import React, { useState, useMemo } from "react";
import { z } from "zod";
import { StarRating } from "@scout-for-lol/report-ui/components/star-rating";
import {
  StatisticsCards,
  RatingDistribution,
  TopPerformers,
} from "@scout-for-lol/report-ui/components/analytics-stats";
import {
  loadReviewImages,
  exportReviewImages,
  importReviewImages,
  clearAllReviewImages,
  type ReviewImageData,
} from "@scout-for-lol/report-ui/ai-review-storage";

type SortOption = "rating-desc" | "rating-asc" | "date-desc" | "date-asc";
type FilterRating = "all" | "unrated" | "1" | "2" | "3" | "4";

export function AIReviewAnalytics(): React.ReactNode {
  const [images, setImages] = useState<ReviewImageData[]>(loadReviewImages());
  const [sortBy, setSortBy] = useState<SortOption>("rating-desc");
  const [filterRating, setFilterRating] = useState<FilterRating>("all");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Reload images
  const refreshImages = () => {
    setImages(loadReviewImages());
  };

  // Filter and sort images
  const filteredAndSortedImages = useMemo(() => {
    let filtered = [...images];

    // Apply rating filter
    if (filterRating === "unrated") {
      filtered = filtered.filter((img) => !img.rating);
    } else if (filterRating !== "all") {
      const RatingSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
      const parsed = parseInt(filterRating, 10);
      const validationResult = RatingSchema.safeParse(parsed);
      if (validationResult.success) {
        filtered = filtered.filter((img) => img.rating === validationResult.data);
      }
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating-desc": {
          const ratingA = a.rating ?? 0;
          const ratingB = b.rating ?? 0;
          return ratingB - ratingA;
        }
        case "rating-asc": {
          const ratingA = a.rating ?? 0;
          const ratingB = b.rating ?? 0;
          return ratingA - ratingB;
        }
        case "date-desc":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case "date-asc":
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [images, sortBy, filterRating]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const ratedImages = images.filter((img) => img.rating);
    const totalRatings = ratedImages.length;
    const averageRating =
      totalRatings > 0 ? ratedImages.reduce((sum, img) => sum + (img.rating ?? 0), 0) / totalRatings : 0;

    const ratingCounts: Record<number, number> = {
      1: images.filter((img) => img.rating === 1).length,
      2: images.filter((img) => img.rating === 2).length,
      3: images.filter((img) => img.rating === 3).length,
      4: images.filter((img) => img.rating === 4).length,
    };

    // Style statistics
    const styleMap = new Map<string, { total: number; sum: number }>();
    for (const img of ratedImages) {
      if (img.metadata?.style && img.rating) {
        const existing = styleMap.get(img.metadata.style);
        if (existing) {
          existing.total += 1;
          existing.sum += img.rating;
        } else {
          styleMap.set(img.metadata.style, { total: 1, sum: img.rating });
        }
      }
    }

    const styleStats = Array.from(styleMap.entries())
      .map(([style, data]) => ({
        style,
        average: data.sum / data.total,
        count: data.total,
      }))
      .sort((a, b) => b.average - a.average);

    // Theme statistics
    const themeMap = new Map<string, { total: number; sum: number }>();
    for (const img of ratedImages) {
      if (img.metadata?.themes && img.rating) {
        for (const theme of img.metadata.themes) {
          const existing = themeMap.get(theme);
          if (existing) {
            existing.total += 1;
            existing.sum += img.rating;
          } else {
            themeMap.set(theme, { total: 1, sum: img.rating });
          }
        }
      }
    }

    const themeStats = Array.from(themeMap.entries())
      .map(([theme, data]) => ({
        theme,
        average: data.sum / data.total,
        count: data.total,
      }))
      .sort((a, b) => b.average - a.average);

    return {
      totalImages: images.length,
      ratedImages: totalRatings,
      unratedImages: images.length - totalRatings,
      averageRating,
      ratingCounts,
      styleStats: styleStats.slice(0, 10), // Top 10
      themeStats: themeStats.slice(0, 10), // Top 10
    };
  }, [images]);

  const handleExport = () => {
    const json = exportReviewImages();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const datePart = new Date().toISOString().split("T")[0] ?? "unknown";
    a.download = `ai-review-ratings-${datePart}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const StringSchema = z.string();
      const contentResult = StringSchema.safeParse(content);
      if (contentResult.success) {
        const result = importReviewImages(contentResult.data);
        if (result.success) {
          alert(`Successfully imported ${result.count.toString()} images`);
          refreshImages();
        } else {
          const errorMsg = result.error ?? "Unknown error";
          alert(`Import failed: ${errorMsg}`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (!confirm("This will delete ALL images and ratings. Are you sure?")) {
      return;
    }
    clearAllReviewImages();
    refreshImages();
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ marginBottom: "16px" }}>AI Review Analytics</h2>

        <StatisticsCards stats={statistics} />
        <RatingDistribution ratingCounts={statistics.ratingCounts} />
        <TopPerformers
          title="Best Performing Styles"
          stats={statistics.styleStats.map((s) => ({ name: s.style, average: s.average, count: s.count }))}
          countLabel="images"
        />
        <TopPerformers
          title="Best Performing Themes"
          stats={statistics.themeStats.map((s) => ({ name: s.theme, average: s.average, count: s.count }))}
          countLabel="uses"
        />

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={handleExport}
            style={{
              padding: "8px 16px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Export Ratings
          </button>
          <label
            style={{
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Import Ratings
            <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
          </label>
          <button
            onClick={handleClearAll}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "16px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <label style={{ fontSize: "14px", fontWeight: 500, marginRight: "8px", color: "#374151" }}>Filter:</label>
          <select
            value={filterRating}
            onChange={(e) => {
              const FilterRatingSchema = z.enum(["all", "unrated", "1", "2", "3", "4"]);
              const result = FilterRatingSchema.safeParse(e.target.value);
              if (result.success) {
                setFilterRating(result.data);
              }
            }}
            style={{
              padding: "6px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <option value="all">All Ratings</option>
            <option value="unrated">Unrated Only</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "14px", fontWeight: 500, marginRight: "8px", color: "#374151" }}>Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => {
              const SortOptionSchema = z.enum(["rating-desc", "rating-asc", "date-desc", "date-asc"]);
              const result = SortOptionSchema.safeParse(e.target.value);
              if (result.success) {
                setSortBy(result.data);
              }
            }}
            style={{
              padding: "6px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <option value="rating-desc">Rating (High to Low)</option>
            <option value="rating-asc">Rating (Low to High)</option>
            <option value="date-desc">Date (Newest First)</option>
            <option value="date-asc">Date (Oldest First)</option>
          </select>
        </div>
        <div style={{ marginLeft: "auto", fontSize: "14px", color: "#6b7280" }}>
          Showing {filteredAndSortedImages.length.toString()} of {images.length.toString()} images
        </div>
      </div>

      {/* Image List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredAndSortedImages.map((image) => (
          <div
            key={image.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "16px",
              backgroundColor: "white",
            }}
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              {/* Thumbnail */}
              <img
                src={image.imageDataUrl}
                alt={image.filename}
                onClick={() => {
                  setExpandedImage(expandedImage === image.id ? null : image.id);
                }}
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: expandedImage === image.id ? "2px solid #3b82f6" : "2px solid transparent",
                }}
              />

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937", marginBottom: "8px" }}>
                  {image.filename}
                </div>
                <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
                  {new Date(image.timestamp).toLocaleString()}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <StarRating rating={image.rating} readonly size="small" />
                </div>
                {image.metadata?.style && (
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                    <strong>Style:</strong> {image.metadata.style}
                  </div>
                )}
                {image.metadata?.themes && image.metadata.themes.length > 0 && (
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                    <strong>Themes:</strong> {image.metadata.themes.join(", ")}
                  </div>
                )}
                {image.notes && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "4px",
                      fontSize: "12px",
                      color: "#374151",
                      fontStyle: "italic",
                    }}
                  >
                    &quot;{image.notes}&quot;
                  </div>
                )}
              </div>
            </div>

            {/* Expanded view */}
            {expandedImage === image.id && (
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
                <img
                  src={image.imageDataUrl}
                  alt={image.filename}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "600px",
                    objectFit: "contain",
                    borderRadius: "6px",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAndSortedImages.length === 0 && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "14px",
          }}
        >
          No images match the current filters
        </div>
      )}
    </div>
  );
}
