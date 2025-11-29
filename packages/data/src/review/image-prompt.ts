/**
 * Image generation prompt template for AI-generated review images
 *
 * This module provides a simple wrapper for generating images from pre-crafted descriptions.
 * The image description is generated in a previous step (Step 3) from the review text.
 */

/**
 * Generate the image generation prompt for Gemini
 *
 * @param imageDescription - The pre-crafted image description from Step 3
 * @returns The prompt to send to Gemini for image generation
 */
export function generateImagePrompt(imageDescription: string): string {
  return `Generate a creative and visually striking image based on this art direction:

${imageDescription}

Important guidelines:
- Create the image exactly as described above
- Focus on visual storytelling and emotional impact
- DO NOT include any text, labels, or captions in the image
- Make it feel like cover art or a key moment illustration`;
}
