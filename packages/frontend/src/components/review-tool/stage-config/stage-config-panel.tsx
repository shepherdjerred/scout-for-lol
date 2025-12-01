import { Card, CardContent, CardHeader, CardTitle } from "@scout-for-lol/frontend/components/review-tool/ui/card";
import { Label } from "@scout-for-lol/frontend/components/review-tool/ui/label";
import { Switch } from "@scout-for-lol/frontend/components/review-tool/ui/switch";
import type { ReviewTextStageConfig, StageConfig } from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import {
  TIMELINE_SUMMARY_SYSTEM_PROMPT,
  MATCH_SUMMARY_SYSTEM_PROMPT,
  REVIEW_TEXT_SYSTEM_PROMPT,
  IMAGE_DESCRIPTION_SYSTEM_PROMPT,
  TIMELINE_SUMMARY_USER_PROMPT,
  MATCH_SUMMARY_USER_PROMPT,
  REVIEW_TEXT_USER_PROMPT,
  IMAGE_DESCRIPTION_USER_PROMPT,
} from "@scout-for-lol/data";
import { ModelConfigForm } from "./model-config-form.tsx";
import { PromptEditor } from "./prompt-editor.tsx";
import type { STAGE_VARIABLES } from "./prompt-variables-info.tsx";

type ToggleableStageConfig = StageConfig;

type StageConfigPanelProps =
  | {
      type: "toggleable";
      title: string;
      description?: string;
      stageName: keyof typeof STAGE_VARIABLES;
      config: ToggleableStageConfig;
      onChange: (next: ToggleableStageConfig) => void;
    }
  | {
      type: "review-text";
      title: string;
      description?: string;
      stageName: keyof typeof STAGE_VARIABLES;
      config: ReviewTextStageConfig;
      onChange: (next: ReviewTextStageConfig) => void;
    };

/**
 * Get default prompts for a stage
 */
function getDefaultPrompts(stageName: string): { system?: string; user?: string } {
  switch (stageName) {
    case "timelineSummary":
      return { system: TIMELINE_SUMMARY_SYSTEM_PROMPT, user: TIMELINE_SUMMARY_USER_PROMPT };
    case "matchSummary":
      return { system: MATCH_SUMMARY_SYSTEM_PROMPT, user: MATCH_SUMMARY_USER_PROMPT };
    case "reviewText":
      return { system: REVIEW_TEXT_SYSTEM_PROMPT, user: REVIEW_TEXT_USER_PROMPT };
    case "imageDescription":
      return { system: IMAGE_DESCRIPTION_SYSTEM_PROMPT, user: IMAGE_DESCRIPTION_USER_PROMPT };
    default:
      return {};
  }
}

export function StageConfigPanel(props: StageConfigPanelProps) {
  const { title, description, stageName } = props;
  const defaults = getDefaultPrompts(stageName);

  if (props.type === "toggleable") {
    const { config, onChange } = props;
    return (
      <Card>
        <CardHeader className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <p className="mt-1 text-xs text-gray-600">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-600">Enabled</Label>
            <Switch
              checked={config.enabled}
              onChange={(e) => {
                onChange({ ...config, enabled: e.target.checked });
              }}
              aria-label={`${title} enabled`}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ModelConfigForm
            value={config.model}
            onChange={(next) => {
              onChange({ ...config, model: next });
            }}
          />

          {/* System Prompt Editor */}
          {defaults.system && (
            <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
              <div>
                <Label className="text-xs text-gray-600">System prompt</Label>
                <p className="text-xs text-gray-500">Instructions for the AI model (context, formatting rules).</p>
              </div>
              <PromptEditor
                label={`${title} - System Prompt`}
                prompt={config.systemPrompt}
                defaultPrompt={defaults.system}
                stage={stageName}
                promptType="system"
                onSave={(next) => {
                  onChange({ ...config, systemPrompt: next });
                }}
              />
            </div>
          )}

          {/* User Prompt Editor */}
          {defaults.user && (
            <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
              <div>
                <Label className="text-xs text-gray-600">User prompt template</Label>
                <p className="text-xs text-gray-500">Template with variables that get replaced with match data.</p>
              </div>
              <PromptEditor
                label={`${title} - User Prompt Template`}
                prompt={config.userPrompt}
                defaultPrompt={defaults.user}
                stage={stageName}
                promptType="user"
                onSave={(next) => {
                  onChange({ ...config, userPrompt: next });
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // review-text type
  const { config, onChange } = props;
  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <p className="mt-1 text-xs text-gray-600">{description}</p>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ModelConfigForm
          value={config.model}
          onChange={(next) => {
            onChange({ ...config, model: next });
          }}
        />

        {/* System Prompt Editor */}
        {defaults.system && (
          <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
            <div>
              <Label className="text-xs text-gray-600">System prompt</Label>
              <p className="text-xs text-gray-500">Instructions for the AI model (context, formatting rules).</p>
            </div>
            <PromptEditor
              label={`${title} - System Prompt`}
              prompt={config.systemPrompt}
              defaultPrompt={defaults.system}
              stage={stageName}
              promptType="system"
              onSave={(next) => {
                onChange({ ...config, systemPrompt: next });
              }}
            />
          </div>
        )}

        {/* User Prompt Editor */}
        {defaults.user && (
          <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
            <div>
              <Label className="text-xs text-gray-600">User prompt template</Label>
              <p className="text-xs text-gray-500">Template with variables that get replaced with match data.</p>
            </div>
            <PromptEditor
              label={`${title} - User Prompt Template`}
              prompt={config.userPrompt}
              defaultPrompt={defaults.user}
              stage={stageName}
              promptType="user"
              onSave={(next) => {
                onChange({ ...config, userPrompt: next });
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
