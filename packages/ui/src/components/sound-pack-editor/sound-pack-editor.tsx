/**
 * Sound Pack Editor Component
 *
 * Main editor component for creating and editing sound packs.
 */

import { useState } from "react";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  RULE_TEMPLATES,
  TEMPLATE_CATEGORY_LABELS,
  createRuleFromTemplate,
  createEmptySoundPool,
  type EventType,
  type RuleTemplate,
} from "@scout-for-lol/data";
import { useSoundPackEditor } from "@scout-for-lol/ui/hooks/use-sound-pack-editor.tsx";
import { VolumeSlider } from "./volume-slider.tsx";
import { SoundPoolEditor } from "./sound-pool-editor.tsx";
import { RuleEditor } from "./rule-editor.tsx";

type Tab = "defaults" | "rules" | "settings";

export function SoundPackEditor() {
  const [activeTab, setActiveTab] = useState<Tab>("defaults");
  const editor = useSoundPackEditor();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Sound Pack Editor</h2>
          {editor.isDirty && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { void editor.importPack(); }}
            disabled={editor.isLoading}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Import
          </button>
          <button
            type="button"
            onClick={() => { void editor.exportPack(); }}
            disabled={editor.isLoading}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => { void editor.savePack(); }}
            disabled={editor.isLoading || !editor.isDirty}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {editor.isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Error display */}
      {editor.error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{editor.error}</span>
          <button
            type="button"
            onClick={editor.clearError}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Pack name */}
      <div className="px-4 py-3 bg-white border-b">
        <label htmlFor="pack-name" className="block text-sm font-medium text-gray-700 mb-1">
          Pack Name
        </label>
        <input
          id="pack-name"
          type="text"
          value={editor.soundPack.name}
          onChange={(e) => { editor.updatePack({ name: e.currentTarget.value }); }}
          className="w-full px-3 py-2 border rounded"
          placeholder="My Sound Pack"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        {(["defaults", "rules", "settings"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => { setActiveTab(tab); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "defaults" && "Default Sounds"}
            {tab === "rules" && `Rules (${String(editor.soundPack.rules.length)})`}
            {tab === "settings" && "Settings"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "defaults" && <DefaultsTab />}
        {activeTab === "rules" && <RulesTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

// =============================================================================
// Defaults Tab
// =============================================================================

function DefaultsTab() {
  const editor = useSoundPackEditor();
  const [expandedEvent, setExpandedEvent] = useState<EventType | null>("kill");

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 mb-4">
        Default sounds play when no rules match. Configure sounds for each event type.
      </p>

      {EVENT_TYPES.map((eventType) => {
        const pool = editor.soundPack.defaults[eventType] ?? createEmptySoundPool();
        const info = EVENT_TYPE_LABELS[eventType];
        const isExpanded = expandedEvent === eventType;

        return (
          <div key={eventType} className="border rounded-lg bg-white overflow-hidden">
            {/* Header */}
            <button
              type="button"
              onClick={() => { setExpandedEvent(isExpanded ? null : eventType); }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-400">{isExpanded ? "▼" : "▶"}</span>
                <div className="text-left">
                  <div className="font-medium">{info.label}</div>
                  <div className="text-xs text-gray-500">{info.description}</div>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {pool.sounds.length} sound{pool.sounds.length !== 1 ? "s" : ""}
              </span>
            </button>

            {/* Content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t">
                <SoundPoolEditor
                  pool={pool}
                  onUpdate={(updatedPool) => { editor.setDefaultPool(eventType, updatedPool); }}
                  onAddSound={(entry) => { editor.addDefaultSound(eventType, entry); }}
                  onUpdateSound={(soundId, updates) => {
                    editor.updateDefaultSound(eventType, soundId, updates);
                  }}
                  onRemoveSound={(soundId) => { editor.removeDefaultSound(eventType, soundId); }}
                  onPreview={(source) => { void editor.previewSound(source); }}
                  onStopPreview={editor.stopPreview}
                  onSelectFile={editor.adapter.selectAudioFile}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Rules Tab
// =============================================================================

function RulesTab() {
  const editor = useSoundPackEditor();
  const [showTemplates, setShowTemplates] = useState(false);

  const templatesByCategory = (["multikill", "objective", "player", "game"] as const).map(
    (category) => ({
      category,
      label: TEMPLATE_CATEGORY_LABELS[category],
      templates: RULE_TEMPLATES.filter((t) => t.category === category),
    }),
  );

  const addFromTemplate = (template: RuleTemplate) => {
    const rule = createRuleFromTemplate(template);
    editor.addRule(rule);
    setShowTemplates(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Rules are evaluated in priority order. The first matching rule&apos;s sounds will play.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setShowTemplates(!showTemplates); }}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          >
            {showTemplates ? "Hide Templates" : "Add from Template"}
          </button>
          <button
            type="button"
            onClick={() => { editor.addRule(); }}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add Rule
          </button>
        </div>
      </div>

      {/* Template picker */}
      {showTemplates && (
        <div className="border rounded-lg p-4 bg-white space-y-4">
          <h3 className="font-medium">Choose a template</h3>
          {templatesByCategory.map(({ category, label, templates }) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{label}</h4>
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <button
                    key={template.templateId}
                    type="button"
                    onClick={() => { addFromTemplate(template); }}
                    className="px-3 py-1.5 text-sm border rounded hover:bg-blue-50 hover:border-blue-300"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rules list */}
      {editor.soundPack.rules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No rules configured.</p>
          <p className="text-sm mt-1">Add a rule to customize sounds based on game events.</p>
        </div>
      ) : (
        <div className="space-y-3">
            {editor.soundPack.rules
            .sort((a, b) => b.priority - a.priority)
            .map((rule) => (
              <RuleEditor
                key={rule.id}
                rule={rule}
                onUpdate={(updates) => { editor.updateRule(rule.id, updates); }}
                onRemove={() => { editor.removeRule(rule.id); }}
                onAddSound={(entry) => { editor.addRuleSound(rule.id, entry); }}
                onUpdateSound={(soundId, updates) => {
                  editor.updateRuleSound(rule.id, soundId, updates);
                }}
                onRemoveSound={(soundId) => { editor.removeRuleSound(rule.id, soundId); }}
                onPreview={(source) => { void editor.previewSound(source); }}
                onStopPreview={editor.stopPreview}
                onSelectFile={editor.adapter.selectAudioFile}
                champions={editor.champions}
                localPlayerName={editor.localPlayer?.summonerName}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Settings Tab
// =============================================================================

function SettingsTab() {
  const editor = useSoundPackEditor();

  return (
    <div className="max-w-md space-y-6">
      {/* Master Volume */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium mb-3">Volume</h3>
        <VolumeSlider
          value={editor.soundPack.settings.masterVolume}
          onChange={(volume) => { editor.setMasterVolume(volume); }}
          label="Master Volume"
        />
        <p className="text-xs text-gray-500 mt-2">
          Multiplied with each sound&apos;s individual volume. Set to 200% to make all sounds louder.
        </p>
      </div>

      {/* Normalization */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium mb-3">Audio Normalization</h3>
        <label htmlFor="normalization" className="flex items-center gap-2">
          <input
            id="normalization"
            type="checkbox"
            checked={editor.soundPack.settings.normalization}
            onChange={(e) => { editor.setNormalization(e.currentTarget.checked); }}
            className="rounded"
          />
          <span className="text-sm">Normalize audio levels</span>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          When enabled, all sounds are analyzed and adjusted to have consistent volume levels
          before the per-sound volume is applied.
        </p>
      </div>

      {/* Pack Info */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium mb-3">Pack Information</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="version" className="block text-sm text-gray-600 mb-1">Version</label>
            <input
              id="version"
              type="text"
              value={editor.soundPack.version}
              onChange={(e) => { editor.updatePack({ version: e.currentTarget.value }); }}
              className="w-full px-3 py-2 border rounded text-sm"
              placeholder="1.0.0"
            />
          </div>
          <div>
            <label htmlFor="author" className="block text-sm text-gray-600 mb-1">Author</label>
            <input
              id="author"
              type="text"
              value={editor.soundPack.author ?? ""}
              onChange={(e) => { editor.updatePack({ author: e.currentTarget.value || undefined }); }}
              className="w-full px-3 py-2 border rounded text-sm"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm text-gray-600 mb-1">Description</label>
            <textarea
              id="description"
              value={editor.soundPack.description ?? ""}
              onChange={(e) => { editor.updatePack({ description: e.currentTarget.value || undefined }); }}
              className="w-full px-3 py-2 border rounded text-sm"
              rows={3}
              placeholder="Describe your sound pack..."
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-red-200 rounded-lg p-4">
        <h3 className="font-medium text-red-600 mb-3">Danger Zone</h3>
        <button
          type="button"
          onClick={() => { editor.resetPack(); }}
          className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
        >
          Reset to Empty Pack
        </button>
        <p className="text-xs text-gray-500 mt-2">
          This will clear all defaults and rules. This action cannot be undone.
        </p>
      </div>
    </div>
  );
}
