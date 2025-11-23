/**
 * Cost calculation for AI API usage
 */
import type { GenerationMetadata, CostBreakdown } from "../config/schema";
import { getModelInfo } from "./models";

/**
 * Gemini pricing (per image)
 */
const GEMINI_PRICING = {
  "gemini-3-pro-image-preview": 0.10, // $0.10 per image
  "gemini-2.0-flash-exp": 0.05, // $0.05 per image (estimated)
  "gemini-1.5-pro": 0.08, // $0.08 per image (estimated)
} as const;

/**
 * Get pricing for a specific model
 */
export function getModelPricing(model: string): { input: number; output: number } {
  // Try to get pricing from centralized model info
  const modelInfo = getModelInfo(model);
  if (modelInfo) {
    return {
      input: modelInfo.capabilities.costPer1MInputTokens,
      output: modelInfo.capabilities.costPer1MOutputTokens,
    };
  }

  // Default pricing if model not found
  return {
    input: 5.0,
    output: 15.0,
  };
}

/**
 * Get pricing for image generation
 */
export function getImagePricing(model: string): number {
  // Check Gemini models
  for (const [modelName, pricing] of Object.entries(GEMINI_PRICING)) {
    if (model.includes(modelName) || modelName.includes(model)) {
      return pricing;
    }
  }

  // Default pricing if model not found
  return 0.10;
}

/**
 * Calculate cost breakdown from generation metadata
 */
export function calculateCost(
  metadata: GenerationMetadata,
  textModel: string,
  imageModel: string,
): CostBreakdown {
  const modelPricing = getModelPricing(textModel);
  const imagePricing = getImagePricing(imageModel);

  // Calculate text generation costs
  const inputTokens = metadata.textTokensPrompt ?? 0;
  const outputTokens = metadata.textTokensCompletion ?? 0;

  const textInputCost = (inputTokens / 1_000_000) * modelPricing.input;
  const textOutputCost = (outputTokens / 1_000_000) * modelPricing.output;

  // Calculate image generation cost
  const imageCost = metadata.imageGenerated ? imagePricing : 0;

  const totalCost = textInputCost + textOutputCost + imageCost;

  return {
    textInputCost,
    textOutputCost,
    imageCost,
    totalCost,
  };
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

const COST_STORAGE_KEY = "scout-review-costs";

/**
 * Session cost tracker with localStorage persistence
 */
export class CostTracker {
  private costs: CostBreakdown[] = [];

  constructor() {
    // Load costs from localStorage on initialization
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(COST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          this.costs = parsed as CostBreakdown[];
        }
      }
    } catch (error) {
      console.error("Failed to load costs from storage:", error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(COST_STORAGE_KEY, JSON.stringify(this.costs));
    } catch (error) {
      console.error("Failed to save costs to storage:", error);
    }
  }

  add(cost: CostBreakdown): void {
    this.costs.push(cost);
    this.saveToStorage();
  }

  getTotal(): CostBreakdown {
    return this.costs.reduce(
      (acc, cost) => ({
        textInputCost: acc.textInputCost + cost.textInputCost,
        textOutputCost: acc.textOutputCost + cost.textOutputCost,
        imageCost: acc.imageCost + cost.imageCost,
        totalCost: acc.totalCost + cost.totalCost,
      }),
      {
        textInputCost: 0,
        textOutputCost: 0,
        imageCost: 0,
        totalCost: 0,
      },
    );
  }

  getCount(): number {
    return this.costs.length;
  }

  getCosts(): CostBreakdown[] {
    return [...this.costs];
  }

  clear(): void {
    this.costs = [];
    this.saveToStorage();
  }

  export(): string {
    const total = this.getTotal();
    const lines = [
      "Cost Report",
      "===========",
      `Total Requests: ${this.getCount()}`,
      "",
      "Breakdown:",
      `  Text Input:  ${formatCost(total.textInputCost)}`,
      `  Text Output: ${formatCost(total.textOutputCost)}`,
      `  Images:      ${formatCost(total.imageCost)}`,
      `  --------------------------------`,
      `  TOTAL:       ${formatCost(total.totalCost)}`,
      "",
      "Per-Request Details:",
    ];

    this.costs.forEach((cost, i) => {
      lines.push(`  Request ${i + 1}: ${formatCost(cost.totalCost)}`);
    });

    return lines.join("\n");
  }
}
