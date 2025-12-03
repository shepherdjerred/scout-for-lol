/**
 * Generation configuration details display
 *
 * Shows pipeline stage configurations - each stage has its own model settings.
 */
import { useState } from "react";
import type {
  ReviewConfig,
  GenerationResult,
  StageConfig,
  ReviewTextStageConfig,
  ImageGenerationStageConfig,
} from "@scout-for-lol/frontend/lib/review-tool/config/schema";

type GenerationConfigDisplayProps = {
  config: ReviewConfig;
  result?: GenerationResult | undefined;
};

function ConfigRow({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-surface-600 text-xs">{label}</span>
      <span className={`text-surface-900 text-xs ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function StageModelDisplay({
  name,
  enabled,
  model,
  maxTokens,
  temperature,
  topP,
}: {
  name: string;
  enabled: boolean;
  model: string;
  maxTokens: number;
  temperature?: number | undefined;
  topP?: number | undefined;
}) {
  if (!enabled) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="w-2 h-2 rounded-full bg-surface-300" />
        <span className="text-surface-400 text-xs">{name}</span>
        <span className="text-surface-300 text-xs italic ml-auto">Disabled</span>
      </div>
    );
  }

  return (
    <div className="py-2 border-b border-surface-100 last:border-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-victory-500" />
        <span className="text-surface-700 text-xs font-medium">{name}</span>
      </div>
      <div className="ml-4 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
        <div className="flex justify-between">
          <span className="text-surface-500">Model</span>
          <span className="text-surface-800 font-mono">{model}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-surface-500">Max Tokens</span>
          <span className="text-surface-800">{maxTokens.toLocaleString()}</span>
        </div>
        {temperature !== undefined && (
          <div className="flex justify-between">
            <span className="text-surface-500">Temperature</span>
            <span className="text-surface-800">{temperature.toFixed(2)}</span>
          </div>
        )}
        {topP !== undefined && (
          <div className="flex justify-between">
            <span className="text-surface-500">Top P</span>
            <span className="text-surface-800">{topP.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ImageGenStageDisplay({ name, config }: { name: string; config: ImageGenerationStageConfig }) {
  if (!config.enabled) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="w-2 h-2 rounded-full bg-surface-300" />
        <span className="text-surface-400 text-xs">{name}</span>
        <span className="text-surface-300 text-xs italic ml-auto">Disabled</span>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-victory-500" />
        <span className="text-surface-700 text-xs font-medium">{name}</span>
      </div>
      <div className="ml-4 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
        <div className="flex justify-between">
          <span className="text-surface-500">Model</span>
          <span className="text-surface-800 font-mono">{config.model}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-surface-500">Timeout</span>
          <span className="text-surface-800">{(config.timeoutMs / 1000).toFixed(0)}s</span>
        </div>
      </div>
    </div>
  );
}

function PipelineStagesDisplay({ config }: { config: ReviewConfig }) {
  const stages = config.stages;
  if (!stages) {
    return null;
  }

  const renderTextStage = (name: string, stage: StageConfig) => (
    <StageModelDisplay
      key={name}
      name={name}
      enabled={stage.enabled}
      model={stage.model.model}
      maxTokens={stage.model.maxTokens}
      temperature={stage.model.temperature}
      topP={stage.model.topP}
    />
  );

  const renderReviewTextStage = (name: string, stage: ReviewTextStageConfig) => (
    <StageModelDisplay
      key={name}
      name={name}
      enabled={true}
      model={stage.model.model}
      maxTokens={stage.model.maxTokens}
      temperature={stage.model.temperature}
      topP={stage.model.topP}
    />
  );

  return (
    <div className="space-y-1">
      {renderTextStage("Timeline Summary", stages.timelineSummary)}
      {renderTextStage("Match Summary", stages.matchSummary)}
      {renderReviewTextStage("Review Text", stages.reviewText)}
      {renderTextStage("Image Description", stages.imageDescription)}
      <ImageGenStageDisplay name="Image Generation" config={stages.imageGeneration} />
    </div>
  );
}

function ActuallySelectedDisplay({ result, artStyle }: { result: GenerationResult; artStyle: string }) {
  const hasSelection =
    result.metadata.reviewerName !== undefined || result.metadata.intermediate?.selectedArtStyle !== undefined;

  if (!hasSelection) {
    return null;
  }

  // Show selected art style (may differ from config if "random" was used)
  const displayArtStyle = result.metadata.intermediate?.selectedArtStyle ?? artStyle;

  return (
    <div className="mt-3 pt-3 border-t border-surface-200">
      <h4 className="text-xs font-semibold text-surface-700 mb-2">Selected for this generation:</h4>
      <div className="space-y-1 text-xs">
        {result.metadata.reviewerName && <ConfigRow label="Personality" value={result.metadata.reviewerName} />}
        {displayArtStyle && displayArtStyle !== "random" && <ConfigRow label="Art Style" value={displayArtStyle} />}
        {result.metadata.imageDescription && (
          <div className="flex justify-between items-start py-1">
            <span className="text-surface-600 text-xs shrink-0">Image Prompt</span>
            <span className="text-surface-900 text-xs text-right max-w-[250px] break-words ml-2">
              {result.metadata.imageDescription.length > 100
                ? `${result.metadata.imageDescription.substring(0, 100)}...`
                : result.metadata.imageDescription}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function GenerationConfigDisplay({ config, result }: GenerationConfigDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  const personality =
    config.prompts.personalityId === "random"
      ? "Random"
      : (config.prompts.customPersonality?.metadata.name ?? config.prompts.personalityId);

  // Get the review text model from stages (primary model)
  const reviewTextModel = config.stages?.reviewText.model;
  const artStyle = config.imageGeneration.artStyle;

  return (
    <div className="mb-4 p-4 bg-surface-50 border border-surface-200 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-surface-900">Generation Configuration</h3>
        <button
          onClick={() => {
            setShowDetails(!showDetails);
          }}
          className="text-xs text-surface-500 hover:text-surface-700 flex items-center gap-1"
        >
          {showDetails ? "Hide" : "Show"} details
          <svg
            className={`w-3 h-3 transition-transform ${showDetails ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Primary Config - Always Visible */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <ConfigRow label="Text Model" value={reviewTextModel?.model ?? config.textGeneration.model} mono />
          <ConfigRow label="Personality" value={personality} />
        </div>
        <div className="space-y-1">
          <ConfigRow
            label="Max Tokens"
            value={(reviewTextModel?.maxTokens ?? config.textGeneration.maxTokens).toLocaleString()}
          />
          {reviewTextModel?.temperature !== undefined && (
            <ConfigRow label="Temperature" value={reviewTextModel.temperature.toFixed(2)} />
          )}
        </div>
      </div>

      {/* Image/Art Style Summary (always visible) */}
      {config.stages?.imageGeneration.enabled && (
        <div className="mt-2 pt-2 border-t border-surface-200">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex justify-between">
              <span className="text-surface-600">Image Model</span>
              <span className="text-surface-900 font-mono">{config.stages.imageGeneration.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600">Art Style</span>
              <span className="text-surface-900">{artStyle === "random" ? <em>Random</em> : artStyle}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Stages - Collapsible */}
      {showDetails && config.stages && (
        <div className="mt-3 pt-3 border-t border-surface-200 animate-fade-in">
          <h4 className="text-xs font-semibold text-surface-700 mb-2">Pipeline Stages</h4>
          <PipelineStagesDisplay config={config} />
        </div>
      )}

      {result && !result.error && <ActuallySelectedDisplay result={result} artStyle={artStyle} />}
    </div>
  );
}
