import { Card, CardContent, CardHeader, CardTitle } from "@scout-for-lol/frontend/components/review-tool/ui/card";
import { Input } from "@scout-for-lol/frontend/components/review-tool/ui/input";
import { Label } from "@scout-for-lol/frontend/components/review-tool/ui/label";
import { Switch } from "@scout-for-lol/frontend/components/review-tool/ui/switch";
import type { ImageGenerationStageConfig } from "@scout-for-lol/frontend/lib/review-tool/config/schema";

type ImageGenerationPanelProps = {
  config: ImageGenerationStageConfig;
  onChange: (next: ImageGenerationStageConfig) => void;
};

export function ImageGenerationPanel({ config, onChange }: ImageGenerationPanelProps) {
  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle>Stage 4: Image Generation</CardTitle>
          <p className="mt-1 text-xs text-gray-600">Gemini image generation settings</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Enabled</span>
          <Switch
            checked={config.enabled}
            onChange={(e) => {
              onChange({ ...config, enabled: e.target.checked });
            }}
          />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="imageModel">Model</Label>
          <Input
            id="imageModel"
            value={config.model}
            onChange={(e) => {
              onChange({ ...config, model: e.target.value });
            }}
            placeholder="gemini-3-pro-image-preview"
          />
        </div>
        <div>
          <Label htmlFor="timeoutMs">Timeout (ms)</Label>
          <Input
            id="timeoutMs"
            type="number"
            min={5000}
            max={300000}
            value={config.timeoutMs}
            onChange={(e) => {
              onChange({ ...config, timeoutMs: Number.parseInt(e.target.value, 10) });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
