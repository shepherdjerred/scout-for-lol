import { z } from "zod";

/**
 * Zod schemas for type-safe localStorage operations
 */

export const ReviewImageMetadataSchema = z.object({
  style: z.string().optional(),
  themes: z.array(z.string()).optional(),
  reviewerName: z.string().optional(),
});

export type ReviewImageMetadata = z.infer<typeof ReviewImageMetadataSchema>;

export const ReviewImageDataSchema = z.object({
  id: z.string(),
  filename: z.string(),
  imageDataUrl: z.string(),
  timestamp: z.string(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  ratedAt: z.string().optional(),
  metadata: ReviewImageMetadataSchema.optional(),
  notes: z.string().optional(),
});

export type ReviewImageData = z.infer<typeof ReviewImageDataSchema>;

export const ReviewImageCollectionSchema = z.array(ReviewImageDataSchema);

const STORAGE_KEY = "ai-review-ratings";
const STORAGE_SIZE_WARNING_THRESHOLD = 4.5 * 1024 * 1024; // 4.5MB (warn before 5MB limit)

/**
 * Get the approximate size of data in localStorage
 */
function getStorageSize(): number {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {return 0;}
  // Approximate size in bytes (2 bytes per character in UTF-16)
  return data.length * 2;
}

/**
 * Check if storage is approaching limit
 */
export function isStorageNearLimit(): boolean {
  return getStorageSize() > STORAGE_SIZE_WARNING_THRESHOLD;
}

/**
 * Get current storage size in MB
 */
export function getStorageSizeMB(): number {
  return getStorageSize() / (1024 * 1024);
}

/**
 * Load all review images from localStorage
 */
export function loadReviewImages(): ReviewImageData[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }

    const parsed: unknown = JSON.parse(data);
    const result = ReviewImageCollectionSchema.safeParse(parsed);

    if (!result.success) {
      console.error("Failed to parse review images from localStorage:", result.error);
      return [];
    }

    return result.data;
  } catch (error) {
    console.error("Error loading review images:", error);
    return [];
  }
}

/**
 * Save all review images to localStorage
 */
export function saveReviewImages(images: ReviewImageData[]): boolean {
  try {
    const validated = ReviewImageCollectionSchema.parse(images);
    const serialized = JSON.stringify(validated);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.error("Error saving review images:", error);
    return false;
  }
}

/**
 * Add a new review image
 */
export function addReviewImage(image: ReviewImageData): boolean {
  const images = loadReviewImages();

  // Check if image with same ID already exists
  const existingIndex = images.findIndex((img) => img.id === image.id);
  if (existingIndex >= 0) {
    console.warn(`Image with ID ${image.id} already exists, updating instead`);
    images[existingIndex] = image;
  } else {
    images.push(image);
  }

  return saveReviewImages(images);
}

/**
 * Update a review image's rating
 */
export function updateReviewRating(id: string, rating: 1 | 2 | 3 | 4, notes?: string): boolean {
  const images = loadReviewImages();
  const image = images.find((img) => img.id === id);

  if (!image) {
    console.error(`Image with ID ${id} not found`);
    return false;
  }

  image.rating = rating;
  image.ratedAt = new Date().toISOString();
  if (notes !== undefined) {
    image.notes = notes;
  }

  return saveReviewImages(images);
}

/**
 * Delete a review image
 */
export function deleteReviewImage(id: string): boolean {
  const images = loadReviewImages();
  const filtered = images.filter((img) => img.id !== id);

  if (filtered.length === images.length) {
    console.warn(`Image with ID ${id} not found`);
    return false;
  }

  return saveReviewImages(filtered);
}

/**
 * Export all review images as JSON
 */
export function exportReviewImages(): string {
  const images = loadReviewImages();
  return JSON.stringify(images, null, 2);
}

/**
 * Import review images from JSON
 */
export function importReviewImages(jsonData: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed: unknown = JSON.parse(jsonData);
    const result = ReviewImageCollectionSchema.safeParse(parsed);

    if (!result.success) {
      return {
        success: false,
        count: 0,
        error: `Invalid data format: ${result.error.message}`,
      };
    }

    const currentImages = loadReviewImages();
    const newImages = result.data;

    // Merge: prefer imported data for matching IDs
    const mergedMap = new Map<string, ReviewImageData>();

    // Add current images first
    for (const img of currentImages) {
      mergedMap.set(img.id, img);
    }

    // Override with imported images
    for (const img of newImages) {
      mergedMap.set(img.id, img);
    }

    const merged = Array.from(mergedMap.values());
    const saved = saveReviewImages(merged);

    if (!saved) {
      return {
        success: false,
        count: 0,
        error: "Failed to save imported images",
      };
    }

    return {
      success: true,
      count: newImages.length,
    };
  } catch (error) {
    const ErrorSchema = z.object({ message: z.string() });
    const result = ErrorSchema.safeParse(error);
    const errorMessage = result.success ? result.data.message : String(error);
    return {
      success: false,
      count: 0,
      error: errorMessage,
    };
  }
}

/**
 * Parse timestamp from filename
 * Expected format: ai-review-2025-11-23T00-21-19-496Z.png
 */
export function parseTimestampFromFilename(filename: string): string | null {
  const pattern = /ai-review-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/;
  const match = pattern.exec(filename);
  const captured = match?.[1];

  if (!captured) {
    return null;
  }

  // Convert the dashes in time portion back to colons and dots
  const timestampStr = captured.replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ":$1:$2.$3Z");
  return timestampStr;
}

/**
 * Generate unique ID for an image
 */
export function generateImageId(filename: string, dataUrl: string): string {
  // Use filename and first 20 chars of data URL for uniqueness
  const hash = btoa(`${filename}-${dataUrl.slice(0, 20)}`).slice(0, 16);
  return `${filename}-${hash}`;
}

/**
 * Read image file and convert to data URL
 */
export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const StringSchema = z.string();
      const result = StringSchema.safeParse(reader.result);
      if (result.success) {
        resolve(result.data);
      } else {
        reject(new Error("Failed to read file as data URL"));
      }
    };
    reader.onerror = () => {
      reject(new Error("File reader error"));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Clear all review images from storage
 */
export function clearAllReviewImages(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing review images:", error);
    return false;
  }
}
