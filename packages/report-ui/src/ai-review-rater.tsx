import React, { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { StarRating } from "./components/star-rating";
import { EmptyDropZone, GalleryView } from "./components/rater-gallery";
import {
  loadReviewImages,
  addReviewImage,
  updateReviewRating,
  deleteReviewImage,
  readImageFile,
  generateImageId,
  parseTimestampFromFilename,
  isStorageNearLimit,
  getStorageSizeMB,
  type ReviewImageData,
} from "./ai-review-storage";

type ViewMode = "rate" | "gallery";

export function AIReviewRater(): React.ReactNode {
  const [images, setImages] = useState<ReviewImageData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [notes, setNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load images on mount
  useEffect(() => {
    const loadedImages = loadReviewImages();
    setImages(loadedImages);
    setStorageWarning(isStorageNearLimit());
  }, []);

  // Update notes when current image changes
  useEffect(() => {
    const currentImage = images[currentIndex];
    setNotes(currentImage?.notes ?? "");
  }, [currentIndex, images]);

  const currentImage = images[currentIndex];

  const handleFilesDrop = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter((file) => file.type.startsWith("image/"));

    for (const file of imageFiles) {
      try {
        const dataUrl = await readImageFile(file);
        const id = generateImageId(file.name, dataUrl);
        const timestamp = parseTimestampFromFilename(file.name) ?? new Date().toISOString();

        const newImage: ReviewImageData = {
          id,
          filename: file.name,
          imageDataUrl: dataUrl,
          timestamp,
        };

        addReviewImage(newImage);
      } catch (error) {
        console.error(`Failed to load image ${file.name}:`, error);
      }
    }

    // Reload images
    const loadedImages = loadReviewImages();
    setImages(loadedImages);
    setStorageWarning(isStorageNearLimit());

    // Switch to gallery view if we just added images
    if (imageFiles.length > 0) {
      setViewMode("gallery");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      void handleFilesDrop(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      void handleFilesDrop(files);
    }
  };

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    if (!currentImage) return;

    updateReviewRating(currentImage.id, rating, notes);
    const loadedImages = loadReviewImages();
    setImages(loadedImages);
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    if (currentImage?.rating) {
      updateReviewRating(currentImage.id, currentImage.rating, newNotes);
      const loadedImages = loadReviewImages();
      setImages(loadedImages);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this image?")) return;

    deleteReviewImage(id);
    const loadedImages = loadReviewImages();
    setImages(loadedImages);

    // Adjust current index if needed
    if (currentIndex >= loadedImages.length) {
      setCurrentIndex(Math.max(0, loadedImages.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== "rate") return;

      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key >= "1" && e.key <= "4") {
        const KeyNumberSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
        const parsed = parseInt(e.key, 10);
        const validationResult = KeyNumberSchema.safeParse(parsed);
        if (validationResult.success) {
          handleRate(validationResult.data);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewMode, currentIndex, images, notes]);

  if (images.length === 0) {
    return (
      <>
        <EmptyDropZone
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
      </>
    );
  }

  if (viewMode === "gallery") {
    return (
      <>
        <GalleryView
          images={images}
          storageWarning={storageWarning}
          storageSizeMB={getStorageSizeMB()}
          onAddImages={() => {
            fileInputRef.current?.click();
          }}
          onSelectImage={(index) => {
            setCurrentIndex(index);
            setViewMode("rate");
          }}
          onDeleteImage={handleDelete}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
      </>
    );
  }

  // Rate view
  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={() => {
            setViewMode("gallery");
          }}
          style={{
            padding: "8px 16px",
            backgroundColor: "#e5e7eb",
            color: "#374151",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          ← Back to Gallery
        </button>
        <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {currentImage && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          {/* Image viewer */}
          <div>
            <div
              style={{
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: "16px",
                backgroundColor: "#f9fafb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "400px",
              }}
            >
              <img
                src={currentImage.imageDataUrl}
                alt={currentImage.filename}
                style={{
                  maxWidth: "100%",
                  maxHeight: "600px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={handlePrevious}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Next →
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", marginTop: "8px" }}>
              Use arrow keys to navigate, 1-4 to rate
            </p>
          </div>

          {/* Rating panel */}
          <div>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "20px",
                backgroundColor: "white",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>Rate this image</h3>

              <div style={{ marginBottom: "20px" }}>
                <StarRating rating={currentImage.rating} onRate={handleRate} size="large" />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="notes"
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => {
                    handleNotesChange(e.target.value);
                  }}
                  placeholder="What did you like or dislike?"
                  style={{
                    width: "100%",
                    minHeight: "100px",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#374151" }}>
                  Image Info
                </h4>
                <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.6" }}>
                  <div style={{ marginBottom: "6px" }}>
                    <strong>File:</strong> {currentImage.filename}
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    <strong>Date:</strong> {new Date(currentImage.timestamp).toLocaleString()}
                  </div>
                  {currentImage.ratedAt && (
                    <div style={{ marginBottom: "6px" }}>
                      <strong>Rated:</strong> {new Date(currentImage.ratedAt).toLocaleString()}
                    </div>
                  )}
                  {currentImage.metadata?.style && (
                    <div style={{ marginBottom: "6px" }}>
                      <strong>Style:</strong> {currentImage.metadata.style}
                    </div>
                  )}
                  {currentImage.metadata?.themes && currentImage.metadata.themes.length > 0 && (
                    <div style={{ marginBottom: "6px" }}>
                      <strong>Themes:</strong> {currentImage.metadata.themes.join(", ")}
                    </div>
                  )}
                  {currentImage.metadata?.reviewerName && (
                    <div style={{ marginBottom: "6px" }}>
                      <strong>Reviewer:</strong> {currentImage.metadata.reviewerName}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  handleDelete(currentImage.id);
                  setViewMode("gallery");
                }}
                style={{
                  marginTop: "16px",
                  width: "100%",
                  padding: "8px",
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Delete Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
