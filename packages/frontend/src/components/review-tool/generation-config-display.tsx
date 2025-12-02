/**
 * Generation configuration details display
 */
import { useState } from "react";
import type { ReviewConfig, GenerationResult } from "@scout-for-lol/frontend/lib/review-tool/config/schema";

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

function StageStatus({ enabled, name }: { enabled: boolean; name: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${enabled ? "bg-victory-500" : "bg-surface-300"}`} />
      <span className={`text-xs ${enabled ? "text-surface-700" : "text-surface-400"}`}>{name}</span>
    </div>
  );
}

function ImageGenerationConfig({ config }: { config: ReviewConfig }) {
  if (!config.imageGeneration.enabled) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-surface-600 text-xs">Image Generation:</span>
        <span className="text-surface-400 text-xs">Disabled</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <ConfigRow label="Image Model" value={config.imageGeneration.model} mono />
      <div className="flex justify-between items-start py-1">
        <span className="text-surface-600 text-xs">Art Style</span>
        <span className="text-surface-900 text-xs text-right max-w-[200px]">
          {config.imageGeneration.artStyle === "random" ? (
            <span className="italic text-surface-500">Random</span>
          ) : config.imageGeneration.artStyle.length > 40 ? (
            `${config.imageGeneration.artStyle.substring(0, 40)}...`
          ) : (
            config.imageGeneration.artStyle
          )}
        </span>
      </div>
    </div>
  );
}

function ActuallySelectedDisplay({ result }: { result: GenerationResult }) {
  if (!result.metadata.selectedPersonality && !result.metadata.imageDescription) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-surface-200">
      <h4 className="text-xs font-semibold text-surface-700 mb-2">Selected for this generation:</h4>
      <div className="space-y-1 text-xs">
        {result.metadata.reviewerName && <ConfigRow label="Personality" value={result.metadata.reviewerName} />}
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

function PipelineStagesDisplay({ config }: { config: ReviewConfig }) {
  const stages = config.stages;
  if (!stages) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-surface-200">
      <h4 className="text-xs font-semibold text-surface-700 mb-2">Pipeline Stages</h4>
      <div className="grid grid-cols-2 gap-2">
        <StageStatus enabled={stages.timelineSummary.enabled} name="Timeline Summary" />
        <StageStatus enabled={stages.matchSummary.enabled} name="Match Summary" />
        <StageStatus enabled={true} name="Review Text" />
        <StageStatus enabled={stages.imageDescription.enabled} name="Image Description" />
        <StageStatus enabled={stages.imageGeneration.enabled} name="Image Generation" />
      </div>
    </div>
  );
}

export function GenerationConfigDisplay({ config, result }: GenerationConfigDisplayProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const personality =
    config.prompts.personalityId === "random"
      ? "Random"
      : (config.prompts.customPersonality?.metadata.name ?? config.prompts.personalityId);

  return (
    <div className="mb-4 p-4 bg-surface-50 border border-surface-200 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-surface-900">Generation Configuration</h3>
        <button
          onClick={() => {
            setShowAdvanced(!showAdvanced);
          }}
          className="text-xs text-surface-500 hover:text-surface-700 flex items-center gap-1"
        >
          {showAdvanced ? "Hide" : "Show"} details
          <svg
            className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
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
          <ConfigRow label="Text Model" value={config.textGeneration.model} mono />
          <ConfigRow label="Personality" value={personality} />
        </div>
        <div className="space-y-1">
          <ConfigRow label="Max Tokens" value={config.textGeneration.maxTokens.toLocaleString()} />
          <ConfigRow label="Temperature" value={config.textGeneration.temperature.toFixed(2)} />
        </div>
      </div>

      {/* Advanced Config - Collapsible */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-surface-200 space-y-3 animate-fade-in">
          {/* Model Details */}
          <div>
            <h4 className="text-xs font-semibold text-surface-700 mb-2">Model Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <ConfigRow label="Top P" value={config.textGeneration.topP.toFixed(2)} />
              </div>
            </div>
          </div>

          {/* Image Generation */}
          <div>
            <h4 className="text-xs font-semibold text-surface-700 mb-2">Image Generation</h4>
            <ImageGenerationConfig config={config} />
          </div>

          {/* Pipeline Stages */}
          <PipelineStagesDisplay config={config} />
        </div>
      )}

      {/* Summary when collapsed */}
      {!showAdvanced && config.imageGeneration.enabled && (
        <div className="mt-2 pt-2 border-t border-surface-200">
          <div className="flex items-center gap-2 text-xs text-surface-500">
            <span className="w-2 h-2 rounded-full bg-victory-500" />
            <span>Image: {config.imageGeneration.model}</span>
          </div>
        </div>
      )}

      {result && !result.error && <ActuallySelectedDisplay result={result} />}
    </div>
  );
}
