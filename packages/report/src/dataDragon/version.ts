import { z } from "zod";
import { first } from "remeda";

const versions = z
  .array(z.string())
  .parse(await (await fetch("https://ddragon.leagueoflegends.com/api/versions.json")).json());

const firstVersion = first(versions);

if (firstVersion === undefined) {
  throw new Error("latest version is undefined");
}

export const latestVersion = firstVersion;
