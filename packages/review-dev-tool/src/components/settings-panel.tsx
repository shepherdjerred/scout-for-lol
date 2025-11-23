/**
 * Settings panel for configuring review generation
 */
import { useState } from "react";
import { z } from "zod";
import type { GlobalConfig, TabConfig } from "../config/schema";
import { getBasePrompt, PERSONALITIES } from "../lib/prompts";
import { exportGlobalConfigAsBlob, importGlobalConfigFromBlob } from "../lib/config-manager";
import { getModelsByCategory, modelSupportsParameter } from "../lib/models";

const ErrorSchema = z.object({ message: z.string() });

type SettingsPanelProps = {
  globalConfig: GlobalConfig;
  tabConfig: TabConfig;
  onGlobalChange: (config: GlobalConfig) => void;
  onTabChange: (config: TabConfig) => void;
  onOpenPersonalityManager?: () => void;
};

export function SettingsPanel({
  globalConfig,
  tabConfig,
  onGlobalChange,
  onTabChange,
  onOpenPersonalityManager,
}: SettingsPanelProps) {
  const [showImportExport, setShowImportExport] = useState(false);
  const [importInput, setImportInput] = useState("");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["text", "image", "prompts"]));

  const toggleSection = (section: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleExport = () => {
    const blob = exportGlobalConfigAsBlob(globalConfig);
    void navigator.clipboard.writeText(blob);
    alert("API config copied to clipboard! Share this with trusted users.");
  };

  const handleImport = () => {
    try {
      const config = importGlobalConfigFromBlob(importInput.trim());
      onGlobalChange(config);
      setImportInput("");
      setShowImportExport(false);
      alert("API config imported successfully!");
    } catch (error) {
      const errorResult = ErrorSchema.safeParse(error);
      alert(errorResult.success ? errorResult.data.message : "Failed to import config");
    }
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">Global</span>
            settings are shared across all tabs
          </span>
          <span className="mx-2">•</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">Per-Tab</span>
            settings are unique to each tab
          </span>
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {/* API Settings (Global) */}
        <div>
          <div className="w-full px-6 py-4 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">API Settings</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">Global</span>
            </div>
          </div>
          <div className="px-6 pb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
              <input
                type="password"
                value={globalConfig.api.openaiApiKey ?? ""}
                onChange={(e) => {
                  onGlobalChange({
                    ...globalConfig,
                    api: { ...globalConfig.api, openaiApiKey: e.target.value || undefined },
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
              <input
                type="password"
                value={globalConfig.api.geminiApiKey ?? ""}
                onChange={(e) => {
                  onGlobalChange({
                    ...globalConfig,
                    api: { ...globalConfig.api, geminiApiKey: e.target.value || undefined },
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="AI..."
              />
            </div>

            <div className="pt-2 border-t border-gray-200">
              <h5 className="text-sm font-semibold text-gray-700 mb-3">S3 / R2 Configuration (Optional)</h5>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
                  <input
                    type="text"
                    value={globalConfig.api.s3BucketName ?? ""}
                    onChange={(e) => {
                      onGlobalChange({
                        ...globalConfig,
                        api: { ...globalConfig.api, s3BucketName: e.target.value || undefined },
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="my-bucket-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Key ID</label>
                  <input
                    type="password"
                    value={globalConfig.api.awsAccessKeyId ?? ""}
                    onChange={(e) => {
                      onGlobalChange({
                        ...globalConfig,
                        api: { ...globalConfig.api, awsAccessKeyId: e.target.value || undefined },
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="AKIA... or R2 access key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secret Access Key</label>
                  <input
                    type="password"
                    value={globalConfig.api.awsSecretAccessKey ?? ""}
                    onChange={(e) => {
                      onGlobalChange({
                        ...globalConfig,
                        api: { ...globalConfig.api, awsSecretAccessKey: e.target.value || undefined },
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endpoint URL (for Cloudflare R2)
                  </label>
                  <input
                    type="text"
                    value={globalConfig.api.s3Endpoint ?? ""}
                    onChange={(e) => {
                      onGlobalChange({
                        ...globalConfig,
                        api: { ...globalConfig.api, s3Endpoint: e.target.value || undefined },
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://<account-id>.r2.cloudflarestorage.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty for AWS S3. For R2, use your account endpoint.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input
                    type="text"
                    value={globalConfig.api.awsRegion}
                    onChange={(e) => {
                      onGlobalChange({
                        ...globalConfig,
                        api: { ...globalConfig.api, awsRegion: e.target.value },
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="us-east-1 or auto for R2"
                  />
                  <p className="mt-1 text-xs text-gray-500">For R2, use "auto" or "us-east-1"</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 space-y-3">
              <h5 className="text-sm font-semibold text-gray-700">Share API Config</h5>

              {!showImportExport ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    📋 Export (Copy to Clipboard)
                  </button>
                  <button
                    onClick={() => {
                      setShowImportExport(true);
                    }}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                  >
                    📥 Import
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={importInput}
                    onChange={(e) => {
                      setImportInput(e.target.value);
                    }}
                    placeholder="Paste config blob here..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleImport}
                      disabled={!importInput.trim()}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Import
                    </button>
                    <button
                      onClick={() => {
                        setShowImportExport(false);
                        setImportInput("");
                      }}
                      className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Export creates a base64-encoded blob with API keys. Only share with trusted users.
              </p>
            </div>

            <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3">
              ⚠️ API keys are stored in browser localStorage and shared across all tabs.
            </div>
          </div>
        </div>

        {/* Text Generation Settings (Per-Tab) */}
        <div>
          <button
            onClick={() => {
              toggleSection("text");
            }}
            className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Text Generation</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">Per-Tab</span>
            </div>
            <span className="text-gray-400">{openSections.has("text") ? "−" : "+"}</span>
          </button>
          {openSections.has("text") && (
            <div className="px-6 pb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <select
                  value={tabConfig.textGeneration.model}
                  onChange={(e) => {
                    onTabChange({
                      ...tabConfig,
                      textGeneration: { ...tabConfig.textGeneration, model: e.target.value },
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {(() => {
                    const modelsByCategory = getModelsByCategory();
                    return (
                      <>
                        <optgroup label="GPT-4 Series">
                          {modelsByCategory["gpt-4"]?.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name} {model.deprecated ? "(deprecated)" : ""}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="O-Series (Reasoning)">
                          {modelsByCategory["o-series"]?.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="GPT-3.5 Series">
                          {modelsByCategory["gpt-3.5"]?.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Other Models">
                          {modelsByCategory["other"]?.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </optgroup>
                      </>
                    );
                  })()}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Tokens: {tabConfig.textGeneration.maxTokens}
                </label>
                <input
                  type="range"
                  min="100"
                  max="100000"
                  step="100"
                  value={tabConfig.textGeneration.maxTokens}
                  onChange={(e) => {
                    onTabChange({
                      ...tabConfig,
                      textGeneration: {
                        ...tabConfig.textGeneration,
                        maxTokens: Number.parseInt(e.target.value),
                      },
                    });
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature: {tabConfig.textGeneration.temperature.toFixed(2)}
                  {!modelSupportsParameter(tabConfig.textGeneration.model, "temperature") && (
                    <span className="ml-2 text-xs text-amber-600">(Not supported by this model)</span>
                  )}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={tabConfig.textGeneration.temperature}
                  onChange={(e) => {
                    onTabChange({
                      ...tabConfig,
                      textGeneration: {
                        ...tabConfig.textGeneration,
                        temperature: Number.parseFloat(e.target.value),
                      },
                    });
                  }}
                  className="w-full"
                  disabled={!modelSupportsParameter(tabConfig.textGeneration.model, "temperature")}
                />
                {!modelSupportsParameter(tabConfig.textGeneration.model, "temperature") && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ This model does not support custom temperature values. The API will use its default.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Top P: {tabConfig.textGeneration.topP.toFixed(2)}
                  {!modelSupportsParameter(tabConfig.textGeneration.model, "topP") && (
                    <span className="ml-2 text-xs text-amber-600">(Not supported by this model)</span>
                  )}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={tabConfig.textGeneration.topP}
                  onChange={(e) => {
                    onTabChange({
                      ...tabConfig,
                      textGeneration: {
                        ...tabConfig.textGeneration,
                        topP: Number.parseFloat(e.target.value),
                      },
                    });
                  }}
                  className="w-full"
                  disabled={!modelSupportsParameter(tabConfig.textGeneration.model, "topP")}
                />
                {!modelSupportsParameter(tabConfig.textGeneration.model, "topP") && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ This model does not support custom top_p values. The API will use its default.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Image Generation Settings (Per-Tab) */}
        <div>
          <button
            onClick={() => {
              toggleSection("image");
            }}
            className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Image Generation</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">Per-Tab</span>
            </div>
            <span className="text-gray-400">{openSections.has("image") ? "−" : "+"}</span>
          </button>
          {openSections.has("image") && (
            <div className="px-6 pb-4 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tabConfig.imageGeneration.enabled}
                  onChange={(e) => {
                    onTabChange({
                      ...tabConfig,
                      imageGeneration: { ...tabConfig.imageGeneration, enabled: e.target.checked },
                    });
                  }}
                  className="rounded"
                />
                <label className="text-sm font-medium text-gray-700">Enable Image Generation</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <select
                  value={tabConfig.imageGeneration.model}
                  onChange={(e) => {
                    onTabChange({
                      ...tabConfig,
                      imageGeneration: { ...tabConfig.imageGeneration, model: e.target.value },
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!tabConfig.imageGeneration.enabled}
                >
                  <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image Preview</option>
                  <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout: {(tabConfig.imageGeneration.timeoutMs / 1000).toFixed(0)}s
                </label>
                <input
                  type="range"
                  min="10000"
                  max="300000"
                  step="5000"
                  value={tabConfig.imageGeneration.timeoutMs}
                  onChange={(e) => {
                    onTabChange({
                      ...tabConfig,
                      imageGeneration: {
                        ...tabConfig.imageGeneration,
                        timeoutMs: Number.parseInt(e.target.value),
                      },
                    });
                  }}
                  className="w-full"
                  disabled={!tabConfig.imageGeneration.enabled}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tabConfig.imageGeneration.useMatchingPairs}
                  onChange={(e) => {
                    onTabChange({
                      ...tabConfig,
                      imageGeneration: {
                        ...tabConfig.imageGeneration,
                        useMatchingPairs: e.target.checked,
                      },
                    });
                  }}
                  className="rounded"
                  disabled={!tabConfig.imageGeneration.enabled}
                />
                <label className="text-sm font-medium text-gray-700">Use Matching Style-Theme Pairs</label>
              </div>
              {tabConfig.imageGeneration.useMatchingPairs && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matching Pair Probability: {(tabConfig.imageGeneration.matchingPairProbability * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={tabConfig.imageGeneration.matchingPairProbability}
                    onChange={(e) => {
                      onTabChange({
                        ...tabConfig,
                        imageGeneration: {
                          ...tabConfig.imageGeneration,
                          matchingPairProbability: Number.parseFloat(e.target.value),
                        },
                      });
                    }}
                    className="w-full"
                    disabled={!tabConfig.imageGeneration.enabled}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prompt Settings (Per-Tab) */}
        <div>
          <button
            onClick={() => {
              toggleSection("prompts");
            }}
            className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Prompts & Personality</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">Per-Tab</span>
            </div>
            <span className="text-gray-400">{openSections.has("prompts") ? "−" : "+"}</span>
          </button>
          {openSections.has("prompts") && (
            <div className="px-6 pb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Prompt</label>
                <textarea
                  value={tabConfig.prompts.basePrompt || getBasePrompt()}
                  onChange={(e) => {
                    onTabChange({
                      ...tabConfig,
                      prompts: { ...tabConfig.prompts, basePrompt: e.target.value },
                    });
                  }}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="Base prompt template..."
                />
                <button
                  onClick={() => {
                    onTabChange({
                      ...tabConfig,
                      prompts: { ...tabConfig.prompts, basePrompt: getBasePrompt() },
                    });
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Reset to Default
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Personality</label>
                <div className="flex gap-2">
                  <select
                    value={tabConfig.prompts.personalityId}
                    onChange={(e) => {
                      onTabChange({
                        ...tabConfig,
                        prompts: { ...tabConfig.prompts, personalityId: e.target.value },
                      });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="random">Random</option>
                    {PERSONALITIES.filter((p) => p.id !== "generic").map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.metadata.name}
                      </option>
                    ))}
                  </select>
                  {onOpenPersonalityManager && (
                    <button
                      onClick={onOpenPersonalityManager}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                      title="Manage Personalities"
                    >
                      Manage
                    </button>
                  )}
                </div>
                {tabConfig.prompts.customPersonality && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                    Using custom personality: {tabConfig.prompts.customPersonality.metadata.name}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
