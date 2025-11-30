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
import { createTauriAdapter } from "../../adapters/sound-pack-adapter";

export function SoundPackSection() {
  // Create the adapter once
  const adapter = useMemo(() => createTauriAdapter(), []);

  return (
    <SoundPackEditorProvider adapter={adapter}>
      <div className="h-full">
        <SoundPackEditor />
      </div>
    </SoundPackEditorProvider>
  );
}
