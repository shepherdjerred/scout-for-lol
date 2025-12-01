/**
 * Pipeline traces panel showing debug information for each pipeline stage
 */
import type {
  PipelineIntermediateResults,
  PipelineTraces,
  StageTrace,
} from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.tsx";

type TraceCardProps = {
  label: string;
  trace: StageTrace | undefined;
  text: string | undefined;
};

function TraceCard({ label, trace, text }: TraceCardProps) {
  if (!trace && !text) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <CardTitle>{label}</CardTitle>
        {trace && (
          <div className="text-xs text-gray-600">
            {trace.model.model} · {trace.durationMs}ms
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {trace?.request.systemPrompt && (
          <div>
            <div className="text-xs font-semibold text-gray-700">System prompt</div>
            <pre className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-xs text-gray-800">
              {trace.request.systemPrompt}
            </pre>
          </div>
        )}
        {trace?.request.userPrompt && (
          <div>
            <div className="text-xs font-semibold text-gray-700">User prompt</div>
            <pre className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-xs text-gray-800">
              {trace.request.userPrompt}
            </pre>
          </div>
        )}
        {(trace?.response.text ?? text) && (
          <div>
            <div className="text-xs font-semibold text-gray-700">Response</div>
            <pre className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-xs text-gray-800">
              {trace?.response.text ?? text}
            </pre>
          </div>
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
      {intermediate?.selectedImagePrompts && intermediate.selectedImagePrompts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Image Prompts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-gray-800">
            <p className="text-gray-600">
              {intermediate.selectedImagePrompts.length.toString()} prompt
              {intermediate.selectedImagePrompts.length === 1 ? "" : "s"} selected from personality to influence Stage
              3:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {intermediate.selectedImagePrompts.map((prompt, index) => (
                <li key={index} className="text-gray-700">
                  {prompt}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <TraceCard
        label="Stage 3: Image Description"
        trace={traces.imageDescription}
        text={intermediate?.imageDescriptionText}
      />
      {traces.imageGeneration && (
        <Card>
          <CardHeader className="flex items-start justify-between">
            <CardTitle>Stage 4: Image Generation</CardTitle>
            <div className="text-xs text-gray-600">
              {traces.imageGeneration.model} · {traces.imageGeneration.durationMs}ms
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-gray-800">
            <div className="font-semibold text-gray-700">Prompt</div>
            <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-2">{traces.imageGeneration.request.prompt}</pre>
            <div className="text-gray-700">
              Generated: {traces.imageGeneration.response.imageGenerated ? "yes" : "no"}{" "}
              {traces.imageGeneration.response.imageSizeBytes
                ? `(${traces.imageGeneration.response.imageSizeBytes.toString()} bytes)`
                : ""}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
