/**
 * Category types for art styles and themes
 */

export type StyleCategory =
  | "comic"
  | "manga"
  | "fine-art"
  | "poster"
  | "modern-art"
  | "traditional"
  | "urban"
  | "digital"
  | "texture"
  | "photo"
  | "animation"
  | "cinema"
  | "internet";

export type ThemeCategory =
  | "superhero"
  | "anime"
  | "gaming"
  | "pop-culture"
  | "politics"
  | "memes"
  | "tv-movie"
  | "music"
  | "sports"
  | "animation-studio"
  | "fantasy";

export type ArtStyle = {
  description: string;
  categories: StyleCategory[];
};

export type ArtTheme = {
  description: string;
  categories: ThemeCategory[];
};

/**
 * Category compatibility matrix
 * Maps style categories to compatible theme categories
 */
export const CATEGORY_COMPATIBILITY: Record<StyleCategory, ThemeCategory[]> = {
  comic: ["superhero", "pop-culture", "memes"],
  manga: ["anime", "gaming"],
  "fine-art": ["fantasy", "tv-movie", "music"],
  poster: ["pop-culture", "tv-movie", "music", "sports", "politics"],
  "modern-art": ["music", "memes", "pop-culture"],
  traditional: ["fantasy", "anime"],
  urban: ["music", "sports", "memes"],
  digital: ["gaming", "memes", "music"],
  texture: ["fantasy", "tv-movie"],
  photo: ["tv-movie", "politics", "sports"],
  animation: ["anime", "animation-studio", "pop-culture"],
  cinema: ["tv-movie", "pop-culture", "superhero"],
  internet: ["memes", "politics"],
};
