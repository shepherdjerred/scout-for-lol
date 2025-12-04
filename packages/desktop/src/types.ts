export type LcuStatus = {
  connected: boolean;
  summonerName: string | null;
  inGame: boolean;
};

export type DiscordStatus = {
  connected: boolean;
  channelName: string | null;
  voiceConnected: boolean;
  voiceChannelName: string | null;
  activeSoundPack: string | null;
};

export type Config = {
  botToken: string | null;
  channelId: string | null;
  voiceChannelId: string | null;
  soundPack: string | null;
  eventSounds: Record<string, string> | null;
};

export type LogEntry = {
  timestamp: string;
  level: "info" | "error" | "warning";
  message: string;
};

export type LogPaths = {
  logs_dir: string;
  debug_log: string;
  startup_log: string;
};

export type Section = "league" | "discord" | "monitor" | "sounds";

export type AvailableSoundPack = {
  id: string;
  name: string;
  description?: string | undefined;
  isBuiltIn: boolean;
};

export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
}
