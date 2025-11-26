import { z } from "zod";
import { first } from "remeda";

let resolvedVersion: string;

if (typeof Bun === "undefined") {
  // Browser fallback: use a known stable version
  // ddragon is backwards compatible so this will work even if slightly outdated
  resolvedVersion = "14.24.1";
} else {
  // Server-side: Allow pinning the version via environment variable for deterministic tests
  const pinnedVersion = Bun.env["DATA_DRAGON_VERSION"];

  if (pinnedVersion) {
    resolvedVersion = pinnedVersion;
  } else {
    const versions = z
      .array(z.string())
      .parse(await (await fetch("https://ddragon.leagueoflegends.com/api/versions.json")).json());

    const firstVersion = first(versions);

    if (firstVersion === undefined) {
      throw new Error("latest version is undefined");
    }
    resolvedVersion = firstVersion;
  }
}

export const latestVersion = resolvedVersion;
