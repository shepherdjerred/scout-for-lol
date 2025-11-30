/**
 * Cost calculation for AI API usage
 */
import type { GenerationMetadata, CostBreakdown } from "./config/schema.ts";
import { CostBreakdownSchema } from "./config/schema.ts";
import { calculateCost as calculateCostShared, formatCost as formatCostShared } from "@scout-for-lol/data";
import { STORES, getItem, setItem } from "./storage.ts";

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
  private subscribers = new Set<() => void>();
  private cachedTotal: CostBreakdown = {
    textInputCost: 0,
    textOutputCost: 0,
    imageCost: 0,
    totalCost: 0,
  };
  private cachedSnapshot: { total: CostBreakdown; count: number } = {
    total: this.cachedTotal,
    count: 0,
  };

  constructor() {
    // Load costs from IndexedDB on initialization
    this.initPromise = this.loadFromStorage();
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await getItem(STORES.COSTS, "costs");
      if (stored) {
        const ArraySchema = CostBreakdownSchema.array();
        const result = ArraySchema.safeParse(stored);
        if (result.success) {
          this.costs = result.data;
          this.updateCachedTotal();
          this.notifySubscribers();
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

  private updateCachedTotal(): void {
    this.cachedTotal = this.costs.reduce(
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
    // Update cached snapshot with new stable reference
    this.cachedSnapshot = {
      total: this.cachedTotal,
      count: this.costs.length,
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => {
      callback();
    });
  }

  /** Subscribe to cost updates - returns unsubscribe function */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /** Get current snapshot synchronously (safe to call from useSyncExternalStore) */
  getSnapshot(): { total: CostBreakdown; count: number } {
    // Return cached snapshot to avoid creating new object reference on every call
    return this.cachedSnapshot;
  }

  async add(cost: CostBreakdown): Promise<void> {
    await this.initPromise;
    this.costs.push(cost);
    this.updateCachedTotal();
    this.notifySubscribers();
    await this.saveToStorage();
  }

  async getTotal(): Promise<CostBreakdown> {
    await this.initPromise;
    return this.cachedTotal;
  }

  getCount(): number {
    return this.costs.length;
  }

  async getCosts(): Promise<CostBreakdown[]> {
    await this.initPromise;
    return [...this.costs];
  }

  async clear(): Promise<void> {
    await this.initPromise;
    this.costs = [];
    this.updateCachedTotal();
    this.notifySubscribers();
    await this.saveToStorage();
  }

  async export(): Promise<string> {
    await this.initPromise;
    const lines = [
      "Cost Report",
      "===========",
      `Total Requests: ${this.costs.length.toString()}`,
      "",
      "Breakdown:",
      `  Text Input:  ${formatCost(this.cachedTotal.textInputCost)}`,
      `  Text Output: ${formatCost(this.cachedTotal.textOutputCost)}`,
      `  Images:      ${formatCost(this.cachedTotal.imageCost)}`,
      `  --------------------------------`,
      `  TOTAL:       ${formatCost(this.cachedTotal.totalCost)}`,
      "",
      "Per-Request Details:",
    ];

    this.costs.forEach((cost, i) => {
      lines.push(`  Request ${(i + 1).toString()}: ${formatCost(cost.totalCost)}`);
    });

    return lines.join("\n");
  }
}
