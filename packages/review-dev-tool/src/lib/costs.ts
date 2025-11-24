/**
 * Cost calculation for AI API usage
 */
import type { GenerationMetadata } from "@scout-for-lol/review-dev-tool/config/schema";
import { CostBreakdownSchema, type CostBreakdown } from "@scout-for-lol/review-dev-tool/config/schema";
import { calculateCost as calculateCostShared, formatCost as formatCostShared } from "@scout-for-lol/data";
import { STORES, getItem, setItem } from "@scout-for-lol/review-dev-tool/lib/storage";

export type { CostBreakdown };

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

/**
 * Session cost tracker with IndexedDB persistence
 */
export class CostTracker {
  private costs: CostBreakdown[] = [];
  private initPromise: Promise<void>;

  constructor() {
    // Load costs from IndexedDB on initialization
    this.initPromise = this.loadFromStorage();
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await getItem<unknown>(STORES.COSTS, "costs");
      if (stored) {
        const ArraySchema = CostBreakdownSchema.array();
        const result = ArraySchema.safeParse(stored);
        if (result.success) {
          this.costs = result.data;
        }
      }
    } catch (error) {
      // Silently fail if storage fails
      console.error("Failed to load costs from storage:", error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await setItem(STORES.COSTS, "costs", this.costs);
    } catch (error) {
      // Silently fail if storage fails
      console.error("Failed to save costs to storage:", error);
    }
  }

  async add(cost: CostBreakdown): Promise<void> {
    await this.initPromise;
    this.costs.push(cost);
    await this.saveToStorage();
  }

  async getTotal(): Promise<CostBreakdown> {
    await this.initPromise;
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

  async getCount(): Promise<number> {
    await this.initPromise;
    return this.costs.length;
  }

  async getCosts(): Promise<CostBreakdown[]> {
    await this.initPromise;
    return [...this.costs];
  }

  async clear(): Promise<void> {
    await this.initPromise;
    this.costs = [];
    await this.saveToStorage();
  }

  async export(): Promise<string> {
    await this.initPromise;
    const total = await this.getTotal();
    const lines = [
      "Cost Report",
      "===========",
      `Total Requests: ${this.costs.length.toString()}`,
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
