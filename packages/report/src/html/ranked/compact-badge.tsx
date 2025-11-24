import { divisionToString, wasDemoted, wasPromoted, TierSchema } from "@scout-for-lol/data";
import type { Rank, Tier } from "@scout-for-lol/data";
import { palette } from "@scout-for-lol/report/assets/colors.ts";
import { match } from "ts-pattern";
import { z } from "zod";

// in a Node.js environment, we want to grab these from the file system
let images: Record<Tier, string>;

if (typeof Bun !== "undefined") {
  images = z.record(TierSchema, z.string()).parse(
    Object.fromEntries(
      await Promise.all(
        TierSchema.options.map(async (tier): Promise<[Tier, string]> => {
          const image = await Bun.file(
            new URL(`./assets/Rank=${tier.charAt(0).toUpperCase() + tier.slice(1)}.png`, import.meta.url),
          ).arrayBuffer();
          const bytes = new Uint8Array(image);
          return [tier, btoa(String.fromCharCode(...bytes))];
        }),
      ),
    ),
  );
}

export function CompactRankedBadge({ oldRank, newRank }: { oldRank: Rank | undefined; newRank: Rank }) {
  const environment = typeof Bun !== "undefined" ? "bun" : "browser";

  // Use the pre-loaded images in Bun environment, or construct a URL for browser
  const badge = match(environment)
    .with("bun", () => `data:image/png;base64,${images[newRank.tier]}`)
    .with("browser", () => {
      // Construct the import path for Vite to handle at build time
      return new URL(
        `./assets/Rank=${newRank.tier.charAt(0).toUpperCase() + newRank.tier.slice(1)}.png`,
        import.meta.url,
      ).href;
    })
    .exhaustive();

  const showPromoted = wasPromoted(oldRank, newRank);
  const showDemoted = wasDemoted(oldRank, newRank);
  const showPlacements = !oldRank && newRank;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        color: palette.gold[1],
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ width: "8rem", height: "8rem", display: "flex" }}>
          <img src={badge} alt="" style={{ width: "100%", height: "100%", display: "block" }} />
        </div>
        <span style={{ fontSize: "4rem", fontWeight: 700 }}>{divisionToString(newRank.division)}</span>
      </div>
      {(showPromoted || showDemoted || showPlacements) && (
        <span style={{ fontSize: "2.5rem", fontWeight: 600 }}>
          {showPromoted && "Promoted"}
          {showDemoted && "Demoted"}
          {showPlacements && "Placed"}
        </span>
      )}
    </div>
  );
}
