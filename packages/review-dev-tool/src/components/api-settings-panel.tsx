/**
 * Global API settings panel (for modal)
 */
import { useState } from "react";
import { z } from "zod";
import type { GlobalConfig } from "../config/schema";
import { exportGlobalConfigAsBlob, importGlobalConfigFromBlob } from "../lib/config-manager";

const ErrorSchema = z.object({ message: z.string() });

type ApiSettingsPanelProps = {
  config: GlobalConfig;
  onChange: (config: GlobalConfig) => void;
};

export function ApiSettingsPanel({ config, onChange }: ApiSettingsPanelProps) {
  const [showImportExport, setShowImportExport] = useState(false);
  const [importInput, setImportInput] = useState("");

  const handleExport = () => {
    const blob = exportGlobalConfigAsBlob(config);
    void navigator.clipboard.writeText(blob);
    alert("API config copied to clipboard! Share this with trusted users.");
  };

  const handleImport = () => {
    try {
      const importedConfig = importGlobalConfigFromBlob(importInput.trim());
      onChange(importedConfig);
      setImportInput("");
      setShowImportExport(false);
      alert("API config imported successfully!");
    } catch (error) {
      const errorResult = ErrorSchema.safeParse(error);
      alert(errorResult.success ? errorResult.data.message : "Failed to import config");
    }
  };

  return (
    <div className="space-y-6">
      {/* API Keys */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">API Keys</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OpenAI API Key</label>
            <input
              type="password"
              value={config.api.openaiApiKey ?? ""}
              onChange={(e) => {
                onChange({
                  ...config,
                  api: { ...config.api, openaiApiKey: e.target.value || undefined },
                });
              }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="sk-..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gemini API Key</label>
            <input
              type="password"
              value={config.api.geminiApiKey ?? ""}
              onChange={(e) => {
                onChange({
                  ...config,
                  api: { ...config.api, geminiApiKey: e.target.value || undefined },
                });
              }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="AI..."
            />
          </div>
        </div>
      </div>

      {/* S3/R2 Configuration */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          S3 / R2 Configuration (Optional)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bucket Name</label>
            <input
              type="text"
              value={config.api.s3BucketName ?? ""}
              onChange={(e) => {
                onChange({
                  ...config,
                  api: { ...config.api, s3BucketName: e.target.value || undefined },
                });
              }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="my-bucket-name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Key ID</label>
            <input
              type="password"
              value={config.api.awsAccessKeyId ?? ""}
              onChange={(e) => {
                onChange({
                  ...config,
                  api: { ...config.api, awsAccessKeyId: e.target.value || undefined },
                });
              }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="AKIA... or R2 access key"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secret Access Key</label>
            <input
              type="password"
              value={config.api.awsSecretAccessKey ?? ""}
              onChange={(e) => {
                onChange({
                  ...config,
                  api: { ...config.api, awsSecretAccessKey: e.target.value || undefined },
                });
              }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endpoint URL (for Cloudflare R2)
            </label>
            <input
              type="text"
              value={config.api.s3Endpoint ?? ""}
              onChange={(e) => {
                onChange({
                  ...config,
                  api: { ...config.api, s3Endpoint: e.target.value || undefined },
                });
              }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="https://<account-id>.r2.cloudflarestorage.com"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty for AWS S3. For R2, use your account endpoint.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Region</label>
            <input
              type="text"
              value={config.api.awsRegion}
              onChange={(e) => {
                onChange({
                  ...config,
                  api: { ...config.api, awsRegion: e.target.value },
                });
              }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="us-east-1 or auto for R2"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">For R2, use "auto" or "us-east-1"</p>
          </div>
        </div>
      </div>

      {/* Import/Export */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Share API Config</h3>

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
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-xs placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                disabled={!importInput.trim()}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowImportExport(false);
                  setImportInput("");
                }}
                className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Export creates a base64-encoded blob with API keys. Only share with trusted users.
        </p>
      </div>

      <div className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-3">
        ⚠️ API keys are stored in browser localStorage and shared across all tabs.
      </div>
    </div>
  );
}
