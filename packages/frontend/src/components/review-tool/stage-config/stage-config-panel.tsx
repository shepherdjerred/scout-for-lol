import { Card, CardContent, CardHeader, CardTitle } from "@scout-for-lol/frontend/components/review-tool/ui/card";
import { Label } from "@scout-for-lol/frontend/components/review-tool/ui/label";
import { Switch } from "@scout-for-lol/frontend/components/review-tool/ui/switch";
import type { ReviewTextStageConfig, StageConfig } from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import { ModelConfigForm } from "./model-config-form.tsx";
import { PromptEditor } from "./prompt-editor.tsx";

type ToggleableStageConfig = StageConfig;

type StageConfigPanelProps =
  | {
      type: "toggleable";
      title: string;
      description?: string;
      config: ToggleableStageConfig;
      onChange: (next: ToggleableStageConfig) => void;
    }
  | {
      type: "review-text";
      title: string;
      description?: string;
      config: ReviewTextStageConfig;
      onChange: (next: ReviewTextStageConfig) => void;
    };

export function StageConfigPanel(props: StageConfigPanelProps) {
  const { title, description } = props;
  const isToggleable = props.type === "toggleable";

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <p className="mt-1 text-xs text-gray-600">{description}</p>}
        </div>
        {isToggleable && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-600">Enabled</Label>
            <Switch
              checked={props.config.enabled}
              onChange={(e) => {
                props.onChange({ ...props.config, enabled: e.target.checked });
              }}
              aria-label={`${title} enabled`}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ModelConfigForm
          value={props.config.model}
          onChange={(next) => {
            if (isToggleable) {
              props.onChange({ ...props.config, model: next });
            } else {
              props.onChange({ ...props.config, model: next });
            }
          }}
        />
        {isToggleable && (
          <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
            <div>
              <Label className="text-xs text-gray-600">System prompt override</Label>
              <p className="text-xs text-gray-500">Leave blank to use the default prompt from the data package.</p>
            </div>
            <PromptEditor
              label={`${title} system prompt`}
              prompt={props.config.systemPrompt}
              onSave={(next) => {
                props.onChange({ ...props.config, systemPrompt: next });
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
