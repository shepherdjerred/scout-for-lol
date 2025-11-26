import { z } from "zod";
import { first } from "remeda";

// Allow pinning the version via environment variable for deterministic tests
const pinnedVersion = Bun.env["DATA_DRAGON_VERSION"];

let resolvedVersion: string;

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

export const latestVersion = resolvedVersion;
