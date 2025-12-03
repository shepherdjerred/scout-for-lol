/**
 * Sound Pack Section Component
 *
 * Integrates the shared SoundPackEditor into the desktop app.
 */

import { useMemo } from "react";
import {
  SoundPackEditorProvider,
  SoundPackEditor,
} from "@scout-for-lol/ui";
import { createTauriAdapter } from "@scout-for-lol/desktop/adapters/sound-pack-adapter.ts";

type SoundPackSectionProps = {
  onSave?: () => void;
};

export function SoundPackSection({ onSave }: SoundPackSectionProps) {
  // Create the adapter with save callback
  const adapter = useMemo(() => createTauriAdapter(onSave), [onSave]);

  return (
    <SoundPackEditorProvider adapter={adapter}>
      <div className="h-full">
        <SoundPackEditor />
      </div>
    </SoundPackEditorProvider>
  );
}
