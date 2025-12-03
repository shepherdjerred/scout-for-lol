/**
 * Pipeline traces display components for debugging AI review pipeline
 *
 * Shows detailed information about each stage's request/response for debugging.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.tsx";
import type {
  PipelineTraces,
  PipelineIntermediateResults,
  StageTrace,
} from "@scout-for-lol/frontend/lib/review-tool/config/schema";

type CollapsibleSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
};

function CollapsibleSection({ title, defaultOpen = false, children, badge }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-md border border-surface-200 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 bg-surface-50 hover:bg-surface-100 text-left"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs font-semibold text-surface-700">{title}</span>
        </div>
        {badge && <span className="text-xs text-surface-500">{badge}</span>}
      </button>
      {isOpen && <div className="p-2">{children}</div>}
    </div>
  );
}

type TraceCardProps = {
  label: string;
  trace: StageTrace | undefined;
  text: string | undefined;
};

function TraceCard({ label, trace, text }: TraceCardProps) {
  if (!trace && !text) {
    return null;
  }

  const systemPrompt = trace?.request.systemPrompt;
  const userPrompt = trace?.request.userPrompt;
  const responseText = trace?.response.text ?? text;

  const systemPromptLength = systemPrompt?.length ?? 0;
  const userPromptLength = userPrompt?.length ?? 0;
  const responseLength = responseText?.length ?? 0;

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <CardTitle>{label}</CardTitle>
        {trace && (
          <div className="text-xs text-surface-600 text-right space-y-0.5">
            <div>{trace.model.model}</div>
            <div className="flex items-center gap-2">
              <span>{trace.durationMs}ms</span>
              {trace.tokensPrompt !== undefined && (
                <span className="text-surface-500">{trace.tokensPrompt.toLocaleString()} input tokens</span>
              )}
              {trace.tokensCompletion !== undefined && (
                <span className="text-surface-500">{trace.tokensCompletion.toLocaleString()} output tokens</span>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {systemPrompt && (
          <CollapsibleSection title="System prompt" badge={`${systemPromptLength.toLocaleString()} chars`}>
            <pre className="whitespace-pre-wrap rounded-md bg-surface-50 p-2 text-xs text-surface-800 max-h-64 overflow-auto">
              {systemPrompt}
            </pre>
          </CollapsibleSection>
        )}
        {userPrompt && (
          <CollapsibleSection title="User prompt" badge={`${userPromptLength.toLocaleString()} chars`}>
            <pre className="whitespace-pre-wrap rounded-md bg-surface-50 p-2 text-xs text-surface-800 max-h-64 overflow-auto">
              {userPrompt}
            </pre>
          </CollapsibleSection>
        )}
        {responseText && (
          <CollapsibleSection title="Response" defaultOpen={true} badge={`${responseLength.toLocaleString()} chars`}>
            <pre className="whitespace-pre-wrap rounded-md bg-surface-50 p-2 text-xs text-surface-800 max-h-64 overflow-auto">
              {responseText}
            </pre>
          </CollapsibleSection>
        )}
      </CardContent>
    </Card>
  );
}

type PipelineTracesPanelProps = {
  traces: PipelineTraces | undefined;
  intermediate: PipelineIntermediateResults | undefined;
};

export function PipelineTracesPanel({ traces, intermediate }: PipelineTracesPanelProps) {
  if (!traces) {
    return null;
  }

  return (
    <div className="space-y-3">
      <TraceCard
        label="Stage 1a: Timeline Summary"
        trace={traces.timelineSummary}
        text={intermediate?.timelineSummaryText}
      />
      <TraceCard label="Stage 1b: Match Summary" trace={traces.matchSummary} text={intermediate?.matchSummaryText} />
      <TraceCard label="Stage 2: Review Text" trace={traces.reviewText} text={undefined} />
      {(intermediate?.selectedImagePrompts?.length ?? 0) > 0 || intermediate?.selectedArtStyle ? (
        <Card>
          <CardHeader>
            <CardTitle>Image Generation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-surface-800">
            {intermediate?.selectedArtStyle && (
              <div>
                <p className="text-surface-600 mb-1">Art style:</p>
                <p className="text-surface-700 bg-surface-50 rounded-md p-2">{intermediate.selectedArtStyle}</p>
              </div>
            )}
            {intermediate?.selectedImagePrompts && intermediate.selectedImagePrompts.length > 0 && (
              <div>
                <p className="text-surface-600 mb-1">
                  {intermediate.selectedImagePrompts.length.toString()} prompt
                  {intermediate.selectedImagePrompts.length === 1 ? "" : "s"} selected from personality:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {intermediate.selectedImagePrompts.map((prompt, index) => (
                    <li key={index} className="text-surface-700">
                      {prompt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
      <TraceCard
        label="Stage 3: Image Description"
        trace={traces.imageDescription}
        text={intermediate?.imageDescriptionText}
      />
      {traces.imageGeneration && (
        <Card>
          <CardHeader className="flex items-start justify-between">
            <CardTitle>Stage 4: Image Generation</CardTitle>
            <div className="text-xs text-surface-600">
              {traces.imageGeneration.model} · {traces.imageGeneration.durationMs}ms
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-surface-800">
            <CollapsibleSection
              title="Prompt"
              badge={`${traces.imageGeneration.request.prompt.length.toLocaleString()} chars`}
            >
              <pre className="whitespace-pre-wrap rounded-md bg-surface-50 p-2 max-h-64 overflow-auto">
                {traces.imageGeneration.request.prompt}
              </pre>
            </CollapsibleSection>
            <div className="text-surface-700">
              Generated: {traces.imageGeneration.response.imageGenerated ? "yes" : "no"}{" "}
              {traces.imageGeneration.response.imageSizeBytes
                ? `(${traces.imageGeneration.response.imageSizeBytes.toLocaleString()} bytes)`
                : ""}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
