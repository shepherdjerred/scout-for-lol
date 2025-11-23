import React from "react";
import { StarRating } from "./star-rating";
import type { ReviewImageData } from "../ai-review-storage";

export function EmptyDropZone({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
}: {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}): React.ReactNode {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2 style={{ marginBottom: "20px" }}>AI Review Rater</h2>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
        style={{
          border: isDragging ? "3px dashed #3b82f6" : "2px dashed #d1d5db",
          borderRadius: "8px",
          padding: "60px 40px",
          backgroundColor: isDragging ? "#eff6ff" : "#f9fafb",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📸</div>
        <p style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
          Drop AI review images here
        </p>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>or click to browse files</p>
        <p style={{ fontSize: "12px", color: "#9ca3af" }}>Images from: packages/backend/src/league/review/ai-images/</p>
      </div>
    </div>
  );
}

export function GalleryView({
  images,
  storageWarning,
  storageSizeMB,
  onAddImages,
  onSelectImage,
  onDeleteImage,
}: {
  images: ReviewImageData[];
  storageWarning: boolean;
  storageSizeMB: number;
  onAddImages: () => void;
  onSelectImage: (index: number) => void;
  onDeleteImage: (id: string) => void;
}): React.ReactNode {
  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>AI Review Gallery ({images.length.toString()})</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onAddImages}
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
            + Add Images
          </button>
        </div>
      </div>

      {storageWarning && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fef3c7",
            border: "1px solid #fbbf24",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "14px",
            color: "#92400e",
          }}
        >
          ⚠️ Storage usage: {storageSizeMB.toFixed(2)}MB - Approaching 5MB localStorage limit
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            onClick={() => {
              onSelectImage(index);
            }}
            style={{
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              overflow: "hidden",
              cursor: "pointer",
              transition: "all 0.2s ease",
              position: "relative",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <img
              src={image.imageDataUrl}
              alt={image.filename}
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover",
                display: "block",
              }}
            />
            <div style={{ padding: "12px", backgroundColor: "white" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px", wordBreak: "break-all" }}>
                {image.filename}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <StarRating rating={image.rating} readonly size="small" />
                {!image.rating && (
                  <span style={{ fontSize: "11px", color: "#9ca3af", fontStyle: "italic" }}>Not rated</span>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteImage(image.id);
              }}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                padding: "4px 8px",
                backgroundColor: "rgba(239, 68, 68, 0.9)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
