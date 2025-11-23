/**
 * Image generation prompt template for AI-generated review images
 */

/**
 * Generate the image generation prompt for Gemini
 */
export function generateImagePrompt(params: {
  artStyle: string;
  artTheme: string;
  secondArtTheme?: string | undefined;
  reviewText: string;
  matchData?: string | undefined;
}): string {
  const { artStyle, artTheme, secondArtTheme, reviewText, matchData } = params;

  const themeDescription = secondArtTheme
    ? `Theme 1: ${artTheme}
Theme 2: ${secondArtTheme}`
    : `Theme: ${artTheme}`;

  const mashupInstructions = secondArtTheme
    ? `
MASHUP MODE:
- You have TWO themes to blend together in a creative crossover
- Merge elements from both themes into a single cohesive image
- Think of it as a crossover episode or collaboration between these universes
- Be creative in how you combine the visual elements and characters from both themes
`
    : "";

  const matchDataSection = matchData ? `\n\nHere is the match data: ${matchData}` : "";

  return `Generate a creative and visually striking image based on this League of Legends match review.

Art style (visual aesthetic): ${artStyle}

${themeDescription}

CRITICAL INSTRUCTIONS:
- You MUST use the EXACT art style specified above for the visual aesthetic (how it looks)
- You MUST incorporate the theme(s) specified above for the subject matter (what's depicted)
- These are SEPARATE elements that must work together - apply the style TO the theme(s)
- Do not change the specified style
- Commit fully to both the visual aesthetic AND the subject matter
${mashupInstructions}
Review text to visualize and elaborate on: "${reviewText}"

Important:
- Interpret and expand on the themes, emotions, and key moments from the review
- Create something visually interesting that captures the essence of the performance and feedback
- Apply the specified art style consistently throughout the entire image
- Incorporate the specified theme(s) into the subject matter and characters
- Add visual storytelling elements - show the action, emotion, and drama beyond the literal text
- Make it feel like cover art or a key moment illustration
- The art style defines HOW it looks, the theme(s) define WHAT is shown
- DO NOT include long text strings or labels (e.g., no "irfan here:", no reviewer names, no text captions)
- Small numerical stats are acceptable (e.g., kill counts, scores), but avoid any prose or identifying text
- Focus on visual storytelling rather than text explanations${matchDataSection}`;
}
