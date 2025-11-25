import { z } from "zod";
import type { LCUConnection, LiveGameData, LiveGameEvent } from "./types.js";
import { LiveGameDataSchema, LiveGameEventSchema } from "./types.js";

/**
 * LCU API client for connecting to League of Legends client
 */
export class LCUClient {
  private connection: LCUConnection | null = null;
  private baseUrl: string | null = null;

  /**
   * Connect to LCU using connection info
   */
  connect(connection: LCUConnection): void {
    this.connection = connection;
    this.baseUrl = `${connection.protocol}://127.0.0.1:${connection.port.toString()}`;
  }

  /**
   * Get the base URL for LCU API requests
   */
  private getBaseUrl(): string {
    if (!this.baseUrl) {
      throw new Error("LCU client not connected. Call connect() first.");
    }
    return this.baseUrl;
  }

  /**
   * Make an authenticated request to LCU API
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const auth = Buffer.from(`riot:${this.connection?.password ?? ""}`).toString("base64");

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Check if it's a 404 (no game active)
      if (response.status === 404) {
        const error = new Error(`LCU API request failed: 404 Not Found`);
        // Add a property to identify 404 errors easily
        (error as { is404?: boolean }).is404 = true;
        throw error;
      }
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`LCU API request failed: ${response.status.toString()} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data as T;
  }

  /**
   * Check if a live game is active
   * Uses the gameflow API to check game state
   */
  async isGameActive(): Promise<boolean> {
    try {
      const gameflow = await this.request<{ phase: string }>("/lol-gameflow/v1/gameflow-phase");
      // Game is active if phase is "InProgress" or "ChampSelect" (spectating)
      return gameflow.phase === "InProgress" || gameflow.phase === "ChampSelect";
    } catch (error) {
      const is404 = (error as { is404?: boolean }).is404 ?? false;
      if (is404) {
        return false;
      }
      // If we can't check gameflow, try checking live client data directly
      try {
        await this.request("/liveclientdata/allgamedata");
        return true;
      } catch (liveError) {
        const liveIs404 = (liveError as { is404?: boolean }).is404 ?? false;
        return !liveIs404;
      }
    }
  }

  /**
   * Get live game data
   * Returns null if no game is active
   */
  async getLiveGameData(): Promise<LiveGameData | null> {
    try {
      // Get all game data from live client API
      const allGameData = await this.request<unknown>("/liveclientdata/allgamedata");

      // Parse the response
      const parsed = LiveGameDataSchema.safeParse(allGameData);
      if (!parsed.success) {
        console.error("Failed to parse live game data:", parsed.error);
        return null;
      }

      return parsed.data;
    } catch (error) {
      const is404 = (error as { is404?: boolean }).is404 ?? false;
      if (is404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get live game events
   * Returns empty array if no game is active
   */
  async getLiveGameEvents(): Promise<LiveGameEvent[]> {
    try {
      const eventData = await this.request<{ Events: unknown[] }>("/liveclientdata/eventdata");
      const parsedEvents = z.array(LiveGameEventSchema).safeParse(eventData.Events);

      if (!parsedEvents.success) {
        console.error("Failed to parse live game events:", parsedEvents.error);
        return [];
      }

      return parsedEvents.data;
    } catch (error) {
      const is404 = (error as { is404?: boolean }).is404 ?? false;
      if (is404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get active player info
   */
  async getActivePlayer(): Promise<{ championName: string; summonerName: string } | null> {
    try {
      const player = await this.request<{ championName: string; summonerName: string }>(
        "/liveclientdata/activeplayer",
      );
      return player;
    } catch (error) {
      const is404 = (error as { is404?: boolean }).is404 ?? false;
      if (is404) {
        return null;
      }
      throw error;
    }
  }
}
