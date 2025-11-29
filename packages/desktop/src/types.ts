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
  app_log_dir: string;
  working_dir_log: string;
};

export type Section = "league" | "discord" | "monitor";

export const DEFAULT_EVENT_SOUNDS: Record<string, string> = {
  gameStart: "gameStart",
  firstBlood: "firstBlood",
  kill: "kill",
  multiKill: "multiKill",
  objective: "objective",
  ace: "ace",
  gameEnd: "gameEnd",
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
