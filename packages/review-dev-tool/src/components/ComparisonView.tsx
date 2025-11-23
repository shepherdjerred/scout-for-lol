/**
 * Side-by-side comparison view for multiple tabs
 */
import type { TabData } from "./App";
import type { CostTracker } from "../lib/costs";
import { calculateCost, formatCost } from "../lib/costs";

interface ComparisonViewProps {
  tabs: TabData[];
  costTracker: CostTracker;
}

export function ComparisonView({ tabs, costTracker }: ComparisonViewProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration Comparison</h2>
        <p className="text-gray-600">Compare results across multiple configurations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tabs.map((tab) => {
          const cost = tab.result?.metadata
            ? calculateCost(
                tab.result.metadata,
                tab.config.textGeneration.model,
                tab.config.imageGeneration.model,
              )
            : null;

          return (
            <div key={tab.id} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">{tab.name}</h3>
              </div>

              <div className="p-4 space-y-4">
                {/* Configuration Summary */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Configuration</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Text Model:</span>
                      <span className="font-mono">{tab.config.textGeneration.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temperature:</span>
                      <span className="font-mono">{tab.config.textGeneration.temperature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Image Gen:</span>
                      <span className="font-mono">
                        {tab.config.imageGeneration.enabled ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Personality:</span>
                      <span className="font-mono">{tab.config.prompts.personalityId}</span>
                    </div>
                  </div>
                </div>

                {/* Result */}
                {tab.result ? (
                  <>
                    {tab.result.error ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                        Error: {tab.result.error}
                      </div>
                    ) : (
                      <>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Review</h4>
                          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
                            {tab.result.text}
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            {tab.result.text.length} chars
                            {tab.result.text.length > 400 && (
                              <span className="ml-2 text-orange-600">⚠️ Too long</span>
                            )}
                          </div>
                        </div>

                        {tab.result.image && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Image</h4>
                            <img
                              src={`data:image/png;base64,${tab.result.image}`}
                              alt="Generated"
                              className="w-full rounded border border-gray-200"
                            />
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Metadata</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Text Gen:</span>
                              <span className="font-mono">{tab.result.metadata.textDurationMs}ms</span>
                            </div>
                            {tab.result.metadata.textTokensPrompt && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tokens:</span>
                                <span className="font-mono">
                                  {tab.result.metadata.textTokensPrompt} +{" "}
                                  {tab.result.metadata.textTokensCompletion}
                                </span>
                              </div>
                            )}
                            {tab.result.metadata.imageGenerated && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Image Gen:</span>
                                <span className="font-mono">
                                  {tab.result.metadata.imageDurationMs}ms
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {cost && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Cost</h4>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Text:</span>
                                <span className="font-mono">
                                  {formatCost(cost.textInputCost + cost.textOutputCost)}
                                </span>
                              </div>
                              {cost.imageCost > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Image:</span>
                                  <span className="font-mono">{formatCost(cost.imageCost)}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t border-gray-200 pt-1">
                                <span className="font-semibold">Total:</span>
                                <span className="font-mono font-bold text-blue-600">
                                  {formatCost(cost.totalCost)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No result generated yet
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Session Summary */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total Requests</div>
            <div className="text-2xl font-bold text-gray-900">{costTracker.getCount()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Text Cost</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCost(
                costTracker.getTotal().textInputCost + costTracker.getTotal().textOutputCost,
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Image Cost</div>
            <div className="text-2xl font-bold text-purple-600">
              {formatCost(costTracker.getTotal().imageCost)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Cost</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCost(costTracker.getTotal().totalCost)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
