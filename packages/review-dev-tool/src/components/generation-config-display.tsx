/**
 * Generation configuration details display
 */
import type { ReviewConfig, GenerationResult } from "@scout-for-lol/review-dev-tool/config/schema";

type GenerationConfigDisplayProps = {
  config: ReviewConfig;
  result?: GenerationResult | undefined;
};

export function GenerationConfigDisplay({ config, result }: GenerationConfigDisplayProps) {
  return (
    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">Generation Configuration</h3>
      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Text Model:</span>
            <span className="ml-2 text-blue-900 dark:text-blue-100 font-mono text-xs">
              {config.textGeneration.model}
            </span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Personality:</span>
            <span className="ml-2 text-blue-900 dark:text-blue-100">
              {config.prompts.personalityId === "random"
                ? "Random"
                : (config.prompts.customPersonality?.metadata.name ?? config.prompts.personalityId)}
            </span>
          </div>
        </div>

        {config.imageGeneration.enabled ? (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Image Model:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100 font-mono text-xs">
                  {config.imageGeneration.model}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Mashup Mode:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100">
                  {config.imageGeneration.mashupMode ? "On (2 Themes)" : "Off"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Art Style:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100 text-xs">
                {config.imageGeneration.artStyle === "random" ? (
                  <span className="italic">Random</span>
                ) : config.imageGeneration.artStyle.length > 60 ? (
                  `${config.imageGeneration.artStyle.substring(0, 60)}...`
                ) : (
                  config.imageGeneration.artStyle
                )}
              </span>
            </div>

            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Art Theme:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100 text-xs">
                {config.imageGeneration.artTheme === "random" ? (
                  <span className="italic">Random</span>
                ) : config.imageGeneration.artTheme.length > 60 ? (
                  `${config.imageGeneration.artTheme.substring(0, 60)}...`
                ) : (
                  config.imageGeneration.artTheme
                )}
              </span>
            </div>

            {config.imageGeneration.mashupMode && (
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Second Theme:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100 text-xs">
                  {config.imageGeneration.secondArtTheme === "random" ? (
                    <span className="italic">Random</span>
                  ) : config.imageGeneration.secondArtTheme.length > 60 ? (
                    `${config.imageGeneration.secondArtTheme.substring(0, 60)}...`
                  ) : (
                    config.imageGeneration.secondArtTheme
                  )}
                </span>
              </div>
            )}
          </>
        ) : (
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Image Generation:</span>
            <span className="ml-2 text-blue-900 dark:text-blue-100">Disabled</span>
          </div>
        )}
      </div>
      {result &&
        !result.error &&
        (result.metadata.selectedPersonality ??
          result.metadata.selectedArtStyle ??
          result.metadata.selectedArtTheme) && (
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
            <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Actually Selected (for this generation):
            </h4>
            <div className="space-y-1.5 text-xs">
              {result.metadata.selectedPersonality && (
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Personality File:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100">{result.metadata.selectedPersonality}</span>
                </div>
              )}
              {result.metadata.reviewerName && (
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Personality Name:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100">{result.metadata.reviewerName}</span>
                </div>
              )}
              {result.metadata.selectedArtStyle && (
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Art Style:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100 font-mono wrap-break-word">
                    {result.metadata.selectedArtStyle.length > 80
                      ? `${result.metadata.selectedArtStyle.substring(0, 80)}...`
                      : result.metadata.selectedArtStyle}
                  </span>
                </div>
              )}
              {result.metadata.selectedArtTheme && (
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Art Theme:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100 wrap-break-word">
                    {result.metadata.selectedArtTheme.length > 80
                      ? `${result.metadata.selectedArtTheme.substring(0, 80)}...`
                      : result.metadata.selectedArtTheme}
                  </span>
                </div>
              )}
              {result.metadata.selectedSecondArtTheme && (
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Second Art Theme:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100 wrap-break-word">
                    {result.metadata.selectedSecondArtTheme.length > 80
                      ? `${result.metadata.selectedSecondArtTheme.substring(0, 80)}...`
                      : result.metadata.selectedSecondArtTheme}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
