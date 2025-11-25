import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { LockfileSchema, type Lockfile } from "./types.js";

/**
 * Default lockfile location on Windows
 */
const DEFAULT_LOCKFILE_PATH_WINDOWS = join(
  process.env.LOCALAPPDATA ?? "",
  "Riot Games",
  "League of Legends",
  "lockfile",
);

/**
 * Default lockfile location on macOS
 */
const DEFAULT_LOCKFILE_PATH_MACOS = join(
  process.env.HOME ?? "",
  "Library",
  "Application Support",
  "League of Legends",
  "lockfile",
);

/**
 * Default lockfile location on Linux
 */
const DEFAULT_LOCKFILE_PATH_LINUX = join(
  process.env.HOME ?? "",
  ".config",
  "league-of-legends",
  "lockfile",
);

/**
 * Get the default lockfile path based on the operating system
 */
function getDefaultLockfilePath(): string {
  const platform = process.platform;
  if (platform === "win32") {
    return DEFAULT_LOCKFILE_PATH_WINDOWS;
  }
  if (platform === "darwin") {
    return DEFAULT_LOCKFILE_PATH_MACOS;
  }
  return DEFAULT_LOCKFILE_PATH_LINUX;
}

/**
 * Parse lockfile content
 * Format: "name:pid:port:password:protocol"
 */
export function parseLockfile(content: string): Lockfile {
  const parts = content.trim().split(":");
  if (parts.length !== 5) {
    throw new Error(`Invalid lockfile format. Expected 5 parts, got ${parts.length.toString()}`);
  }

  return LockfileSchema.parse({
    name: parts[0],
    pid: parts[1],
    port: parts[2],
    password: parts[3],
    protocol: parts[4],
  });
}

/**
 * Read and parse the League client lockfile
 *
 * @param lockfilePath Optional custom path to lockfile. If not provided, uses default OS path.
 * @returns Parsed lockfile data
 * @throws Error if lockfile cannot be read or parsed
 */
export async function readLockfile(lockfilePath?: string): Promise<Lockfile> {
  const path = lockfilePath ?? getDefaultLockfilePath();

  try {
    const content = await readFile(path, "utf-8");
    return parseLockfile(content);
  } catch (error) {
    const result = z.object({ code: z.string() }).safeParse(error);
    if (result.success && result.data.code === "ENOENT") {
      throw new Error(
        `Lockfile not found at ${path}. Make sure League of Legends client is running and you're logged in.`,
      );
    }
    throw new Error(`Failed to read lockfile at ${path}: ${error}`);
  }
}

/**
 * Get LCU connection info from lockfile
 */
export async function getLCUConnection(lockfilePath?: string): Promise<{
  port: number;
  password: string;
  protocol: "https" | "http";
}> {
  const lockfile = await readLockfile(lockfilePath);
  const port = Number.parseInt(lockfile.port, 10);
  if (Number.isNaN(port)) {
    throw new Error(`Invalid port in lockfile: ${lockfile.port}`);
  }

  const protocol = lockfile.protocol === "https" ? "https" : "http";

  return {
    port,
    password: lockfile.password,
    protocol,
  };
}
