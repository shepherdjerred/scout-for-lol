import { Button } from "@scout-for-lol/frontend/components/review-tool/ui/button";
import { Dialog } from "@scout-for-lol/frontend/components/review-tool/ui/dialog";
import { Textarea } from "@scout-for-lol/frontend/components/review-tool/ui/textarea";
import { useState } from "react";

type PromptEditorProps = {
  label: string;
  prompt: string | undefined;
  onSave: (next: string | undefined) => void;
};

export function PromptEditor({ label, prompt, onSave }: PromptEditorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(prompt ?? "");

  const handleSave = () => {
    onSave(draft.trim().length > 0 ? draft : undefined);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Edit prompt
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title={label}
        className="max-h-[90vh] overflow-hidden"
      >
        <div className="space-y-3">
          <Textarea
            className="h-64"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
            }}
            placeholder="System prompt override (leave blank to use default)"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
