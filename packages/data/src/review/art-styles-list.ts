/**
 * Art styles list
 */

import type { ArtStyle } from "@scout-for-lol/data/review/art-categories.ts";

/**
 * Visual art styles with category tags
 */
export const ART_STYLES: ArtStyle[] = [
  // Comic & Graphic Novel Techniques
  {
    description: "Bold comic book inking with dynamic action poses and dramatic shadows",
    categories: ["comic"],
  },
  {
    description: "Shonen manga style with energetic action and bold line work",
    categories: ["manga"],
  },
  {
    description: "Indie comic book with unique line work, creative paneling, and distinctive color palette",
    categories: ["comic"],
  },
  {
    description: "Golden age comics with Ben-Day dots, vintage feel, and retro typography",
    categories: ["comic"],
  },
  {
    description: "Graphic novel noir with high contrast, moody shadows, and cinematic angles",
    categories: ["comic", "cinema"],
  },
  {
    description: "Graphic novel style with dynamic paneling, dramatic angles, and sequential storytelling",
    categories: ["comic"],
  },

  // Classic & Fine Art Movements
  {
    description: "Impressionist painting style with visible brushstrokes, dappled light, and soft color blending",
    categories: ["fine-art"],
  },
  {
    description: "Oil painting with rich textures, classical composition, and painterly brushstrokes",
    categories: ["fine-art"],
  },
  {
    description: "Watercolor painting with artistic flair, flowing brushwork, and soft gradients",
    categories: ["fine-art"],
  },
  {
    description: "Art nouveau with decorative frames, elegant curves, and ornamental details",
    categories: ["fine-art"],
  },
  {
    description: "Art deco with geometric patterns, luxurious gold accents, and streamlined elegance",
    categories: ["fine-art"],
  },
  {
    description: "Surrealist dreamscape with impossible geometry, symbolic imagery, and ethereal atmosphere",
    categories: ["fine-art"],
  },
  {
    description: "Expressionist style with bold emotional colors, distorted forms, and raw intensity",
    categories: ["fine-art"],
  },
  {
    description: "Baroque painting with dramatic lighting, rich details, and dynamic movement",
    categories: ["fine-art"],
  },

  // Illustration & Poster Art
  {
    description: "Movie poster style with cinematic composition and dramatic lighting",
    categories: ["poster", "cinema"],
  },
  {
    description: "Epic fantasy illustration with dramatic composition and magical atmosphere",
    categories: ["poster"],
  },
  {
    description: "Soviet propaganda poster with bold typography, heroic figures, and striking red colors",
    categories: ["poster"],
  },
  {
    description: "Psychedelic 60s poster art with swirling patterns, vibrant colors, and groovy typography",
    categories: ["poster"],
  },
  {
    description: "Victorian Gothic illustration with intricate details, dark romanticism, and ornate borders",
    categories: ["poster"],
  },
  {
    description: "Medieval manuscript illumination with gold leaf, intricate borders, and vibrant miniatures",
    categories: ["traditional"],
  },
  {
    description: "Tarot card art with mystical symbols, ornate frames, and esoteric imagery",
    categories: ["poster"],
  },

  // Modern & Contemporary Art
  {
    description: "Pop art style with bold colors, Ben-Day dots, and comic-inspired compositions",
    categories: ["modern-art", "comic"],
  },
  {
    description: "Memphis design with bold geometric shapes, bright colors, and 80s postmodern aesthetic",
    categories: ["modern-art"],
  },
  {
    description: "Minimalist flat design with clean lines, limited color palette, and geometric simplicity",
    categories: ["modern-art"],
  },
  {
    description: "Bauhaus geometric style with primary colors, circles, squares, and functional beauty",
    categories: ["modern-art"],
  },
  {
    description: "Glitch art with digital corruption, chromatic aberration, and databending effects",
    categories: ["digital", "modern-art"],
  },

  // Cultural & Traditional Art
  {
    description: "Ukiyo-e Japanese woodblock print style with flat colors and elegant lines",
    categories: ["traditional", "manga"],
  },
  {
    description: "Chinese ink wash painting with flowing brushwork, misty atmosphere, and calligraphic elegance",
    categories: ["traditional"],
  },
  {
    description: "Aztec/Mayan art with geometric patterns, bold symbols, and ancient iconography",
    categories: ["traditional"],
  },
  {
    description: "Persian miniature painting with intricate patterns, rich colors, and delicate detail",
    categories: ["traditional"],
  },
  {
    description: "Aboriginal dot painting with symbolic patterns, earth tones, and dreamtime storytelling",
    categories: ["traditional"],
  },

  // Urban & Street Art
  {
    description: "Graffiti/street art style with bold colors, urban energy, and spray paint texture",
    categories: ["urban"],
  },
  {
    description: "Stencil art style with sharp edges, high contrast, and urban activist aesthetic",
    categories: ["urban"],
  },
  {
    description: "Neon sign art with glowing tubes, retro typography, and nighttime city vibes",
    categories: ["urban", "digital"],
  },

  // Digital & Gaming Art Styles
  {
    description: "Retro pixel art in detailed 16-bit game style with vibrant colors",
    categories: ["digital"],
  },
  {
    description: "Synthwave/vaporwave aesthetic with pink and purple gradients, retro-futuristic vibes",
    categories: ["digital"],
  },
  {
    description: "Isometric game art with precise angles, pixel-perfect details, and strategic perspective",
    categories: ["digital"],
  },
  {
    description: "Bowling alley strike animation with campy over-the-top 3D CGI and dramatic explosions",
    categories: ["digital"],
  },

  // Textures & Materials
  {
    description: "Stained glass window style with bold outlines and colorful geometric segments",
    categories: ["texture"],
  },
  {
    description: "Paper cut-out art with layered depth, bold shapes, and clean shadows",
    categories: ["texture"],
  },
  {
    description: "Mosaic tile art with small colorful pieces forming larger images and patterns",
    categories: ["texture"],
  },
  {
    description: "Carved wood relief with dimensional depth, natural grain, and tactile texture",
    categories: ["texture"],
  },
  {
    description: "Embroidered tapestry style with thread texture, cross-stitch detail, and textile warmth",
    categories: ["texture"],
  },

  // Photographic & Realistic Styles
  {
    description: "Film noir photography with dramatic shadows, high contrast, and moody black and white",
    categories: ["photo", "cinema"],
  },
  {
    description: "Hyperrealistic digital painting with meticulous detail, perfect lighting, and lifelike textures",
    categories: ["photo"],
  },
  {
    description: "Double exposure photography with overlapping images, dreamy transparency, and poetic layering",
    categories: ["photo"],
  },

  // Animation Styles
  {
    description: "Dreamy, whimsical animation aesthetic with soft colors and emotional depth",
    categories: ["animation"],
  },
  {
    description: "Expressive animation style with theatrical storytelling and musical energy",
    categories: ["animation"],
  },
  {
    description: "Comic book animation with Ben-Day dots, thought bubbles, and multiverse energy",
    categories: ["animation", "comic"],
  },

  // Cinematography Styles
  {
    description: "Perfectly symmetrical composition with pastel colors, flat staging, and quirky details",
    categories: ["cinema"],
  },
  {
    description: "Split-screen with retro 70s styling and pulp fiction title cards",
    categories: ["cinema"],
  },
  {
    description: "IMAX spectacle cinematography with practical effects and mind-bending perspective",
    categories: ["cinema"],
  },
  {
    description: "Gothic whimsy with striped patterns, twisted trees, and macabre charm",
    categories: ["cinema"],
  },
  {
    description: "Gritty realism with dark cityscapes and practical stunts",
    categories: ["cinema"],
  },
  {
    description: "Sepia-toned cinematic masterpiece with shadowy lighting",
    categories: ["cinema", "photo"],
  },
  {
    description: "Western aesthetic with dusty landscapes and bounty hunter cool",
    categories: ["cinema"],
  },
  {
    description: "Neon-noir cityscape with rain-soaked streets and cyberpunk melancholy",
    categories: ["cinema", "digital"],
  },
  {
    description: "Post-apocalyptic wasteland with desert chrome and explosive chaos",
    categories: ["cinema"],
  },
  {
    description: "Symmetrical horror with eerie patterns and isolated dread",
    categories: ["cinema"],
  },
  {
    description: "Southwestern desert cinematography with wide open spaces",
    categories: ["cinema"],
  },
  {
    description: "Mockumentary style with awkward zoom-ins and talking head interviews",
    categories: ["cinema"],
  },
  {
    description: "Dream-within-dream with folding impossible architecture and layered reality",
    categories: ["cinema"],
  },

  // Photographic Aesthetics
  {
    description: "Vintage Americana with nostalgic warmth and heartfelt storytelling",
    categories: ["photo"],
  },
  {
    description: "Somber documentary photography with emotional weight",
    categories: ["photo"],
  },
  {
    description: "Political debate stage dramatics with split-screen and news ticker overlays",
    categories: ["photo", "cinema"],
  },
  {
    description: "Stock photo aesthetic with exaggerated expressions",
    categories: ["photo", "internet"],
  },

  // Internet & Digital Media Aesthetics
  {
    description: "MS Paint simplicity with ironic composition",
    categories: ["internet", "digital"],
  },
  {
    description: "Dark mode UI with chaotic digital culture vibes",
    categories: ["internet", "digital"],
  },
  {
    description: "Deep-fried jpeg artifacts with lens flare and chaotic energy",
    categories: ["internet", "digital"],
  },
  {
    description: "Vertical video aesthetic with trending sound waves and duet split-screen",
    categories: ["internet", "digital"],
  },
  {
    description: "Webcam grid layout with awkward angles",
    categories: ["internet", "digital"],
  },
  {
    description: "Stream overlay with chat spam and emote explosions",
    categories: ["internet", "digital"],
  },
  {
    description: "Thumbnail style with red circles, arrows, and exaggeraged shocked faces",
    categories: ["internet", "digital"],
  },
];

/**
 * Themes with category tags
 */
