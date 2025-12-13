import OpenAI from "openai";
import config from "@scout-for-lol/backend/configuration.js";
import { createLogger } from "@scout-for-lol/backend/logger.ts";

const logger = createLogger("tts");

/**
 * Pre-process review text to add ElevenLabs v3 audio tags using GPT-5 mini.
 *
 * ElevenLabs v3 supports expressive audio tags like:
 * - Emotional: [sarcastic], [curious], [excited], [crying], [mischievously]
 * - Laughter: [laughs], [laughs harder], [starts laughing], [wheezing]
 * - Soft delivery: [whispers]
 * - Breath sounds: [sighs], [exhales]
 * - Other: [snorts]
 *
 * The tags should be placed inline before or after relevant dialogue.
 */
async function preprocessTextForTTS(reviewText: string): Promise<string> {
  if (!config.openaiApiKey) {
    logger.info("[preprocessTextForTTS] OpenAI API key not configured, returning original text");
    return reviewText;
  }

  const client = new OpenAI({ apiKey: config.openaiApiKey });

  const systemPrompt = `You are a text processor that adds ElevenLabs v3 audio tags to text for text-to-speech synthesis.

Your job is to take review text and add expressive audio tags to make the speech more natural and engaging.

Available tags (use sparingly and naturally):
- Emotional: [sarcastic], [curious], [excited], [crying], [mischievously], [frustrated]
- Laughter: [laughs], [laughs harder], [starts laughing], [wheezing], [chuckles]
- Soft delivery: [whispers]
- Breath sounds: [sighs], [exhales]
- Other: [snorts]

Guidelines:
1. Add tags BEFORE the text they modify (e.g., "[sighs] That was rough...")
2. Use tags sparingly - only where they add natural expression
3. Match the emotional tone of the content (e.g., [excited] for victories, [sighs] for losses)
4. Don't overdo it - 3-6 tags per review is plenty
5. Keep the original text intact, only add tags
6. Remove any existing metadata sections (lines starting with ━━━ or containing **Review Metadata**)

Return ONLY the processed text with tags added. No explanations.`;

  try {
    logger.info("[preprocessTextForTTS] Calling GPT-5 mini to add audio tags...");
    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: reviewText },
      ],
      max_completion_tokens: 4000,
      temperature: 0.7,
    });

    const duration = Date.now() - startTime;
    logger.info(`[preprocessTextForTTS] GPT-5 mini response received in ${duration.toString()}ms`);

    const processedText = response.choices[0]?.message.content;
    if (!processedText) {
      logger.info("[preprocessTextForTTS] No content in response, returning original text");
      return reviewText;
    }

    logger.info(`[preprocessTextForTTS] Added audio tags to review text`);
    return processedText.trim();
  } catch (error) {
    logger.error("[preprocessTextForTTS] Error preprocessing text:", error);
    return reviewText;
  }
}

/**
 * Generate speech audio from text using ElevenLabs v3 API.
 *
 * @param text - The text to convert to speech (ideally preprocessed with audio tags)
 * @returns MP3 audio data as Uint8Array, or undefined if generation fails
 */
async function generateSpeech(text: string): Promise<Uint8Array | undefined> {
  if (!config.elevenLabsApiKey) {
    logger.info("[generateSpeech] ElevenLabs API key not configured");
    return undefined;
  }

  if (!config.elevenLabsVoiceId) {
    logger.info("[generateSpeech] ElevenLabs voice ID not configured");
    return undefined;
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenLabsVoiceId}`;

  try {
    logger.info("[generateSpeech] Calling ElevenLabs v3 API...");
    const startTime = Date.now();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": config.elevenLabsApiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_v3",
        output_format: "mp3_44100_128",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[generateSpeech] ElevenLabs API error: ${response.status.toString()} - ${errorText}`);
      return undefined;
    }

    const audioBuffer = await response.arrayBuffer();
    const duration = Date.now() - startTime;
    logger.info(
      `[generateSpeech] ElevenLabs response received in ${duration.toString()}ms (${audioBuffer.byteLength.toString()} bytes)`,
    );

    return new Uint8Array(audioBuffer);
  } catch (error) {
    logger.error("[generateSpeech] Error generating speech:", error);
    return undefined;
  }
}

/**
 * Generate TTS audio for a review text.
 *
 * This function:
 * 1. Pre-processes the text with GPT-5 mini to add ElevenLabs v3 audio tags
 * 2. Calls ElevenLabs v3 API to generate speech
 * 3. Returns the MP3 audio data
 *
 * @param reviewText - The review text to convert to speech
 * @returns MP3 audio data as Uint8Array, or undefined if generation fails
 */
export async function generateReviewAudio(reviewText: string): Promise<Uint8Array | undefined> {
  // Check if ElevenLabs is configured
  if (!config.elevenLabsApiKey || !config.elevenLabsVoiceId) {
    logger.info("[generateReviewAudio] ElevenLabs not configured, skipping TTS generation");
    return undefined;
  }

  try {
    // Step 1: Preprocess text to add audio tags
    const processedText = await preprocessTextForTTS(reviewText);

    // Step 2: Generate speech
    const audio = await generateSpeech(processedText);

    if (audio) {
      logger.info(`[generateReviewAudio] Successfully generated ${audio.byteLength.toString()} bytes of audio`);
    }

    return audio;
  } catch (error) {
    logger.error("[generateReviewAudio] Error generating review audio:", error);
    return undefined;
  }
}
