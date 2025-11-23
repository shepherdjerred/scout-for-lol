/**
 * Cost calculation for AI API usage
 */
import type { GenerationMetadata, CostBreakdown } from "../config/schema";
import { CostBreakdownSchema } from "../config/schema";
import { getModelPricing, getImagePricing, calculateCost as calculateCostShared, formatCost as formatCostShared } from "@scout-for-lol/data";

/**
 * Get pricing for a specific model
 * @deprecated Use getModelPricing from @scout-for-lol/data instead
 */
export { getModelPricing };

/**
 * Get pricing for image generation
 * @deprecated Use getImagePricing from @scout-for-lol/data instead
 */
export { getImagePricing };

/**
 * Calculate cost breakdown from generation metadata
 */
export function calculateCost(metadata: GenerationMetadata, textModel: string, imageModel: string): CostBreakdown {
  return calculateCostShared(metadata, textModel, imageModel);
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  return formatCostShared(cost);
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
    try {
      // Try to access localStorage - will throw in non-browser environments
      const stored = localStorage.getItem(COST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        const ArraySchema = CostBreakdownSchema.array();
        const result = ArraySchema.safeParse(parsed);
        if (result.success) {
          this.costs = result.data;
        }
      }
    } catch (error) {
      // Silently fail in non-browser environments or if storage fails
      console.error("Failed to load costs from storage:", error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(COST_STORAGE_KEY, JSON.stringify(this.costs));
    } catch (error) {
      // Silently fail in non-browser environments or if storage fails
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
      `Total Requests: ${this.getCount().toString()}`,
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
      lines.push(`  Request ${(i + 1).toString()}: ${formatCost(cost.totalCost)}`);
    });

    return lines.join("\n");
  }
}
