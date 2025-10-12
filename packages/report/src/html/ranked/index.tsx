import {
  divisionToString,
  Rank,
  Tier,
  TierSchema,
  wasDemoted,
  wasPromoted,
} from "@scout-for-lol/data";
import { palette } from "../../assets/colors.ts";
import { z } from "zod";
import { match } from "ts-pattern";

// in a Node.js environment, we want to grab these from the file system
let images: Record<Tier, string>;

if (typeof Bun !== "undefined") {
  images = z.record(TierSchema, z.string()).parse(
    Object.fromEntries(
      await Promise.all(
        TierSchema.options.map(async (tier): Promise<[Tier, string]> => {
          const image = await Bun.file(
            new URL(
              `assets/Rank=${tier.charAt(0).toUpperCase() + tier.slice(1)}.png`,
              import.meta.url,
            ),
          ).arrayBuffer();
          return [tier, Buffer.from(image).toString("base64")];
        }),
      ),
    ),
  );
}

export async function RankedBadge({
  oldRank,
  newRank,
}: {
  oldRank: Rank | undefined;
  newRank: Rank;
}) {
  const environment = typeof Bun !== "undefined" ? "bun" : "browser";
  const badge = await match(environment)
    .with("bun", () =>
      Promise.resolve(`data:image/png;base64,${images[newRank.tier]}`),
    )
    .with("browser", async () => {
      const module = (await import(
        `./assets/Rank=${newRank.tier.charAt(0).toUpperCase() + newRank.tier.slice(1)}.png`
      )) as {
        default: {
          src: string;
          width: number;
          height: number;
          format: string;
        };
      };
      return module.default.src;
    })
    .exhaustive();

  const showPromoted = wasPromoted(oldRank, newRank);
  const showDemoted = wasDemoted(oldRank, newRank);
  const showPlacements = !oldRank && newRank;
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
      }}
    >
      <div
        style={{
          color: palette.gold[1],
          fontSize: "6rem",
          display: "flex",
          alignItems: "flex-end",
          gap: "4rem",
          position: "absolute",
          right: "2rem",
          top: "-20rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column-reverse",
            alignItems: "stretch",
            gap: "2rem",
          }}
        >
          <span
            style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <div style={{ width: "24rem", height: "24rem", display: "flex" }}>
              <img
                src={badge}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </div>
            <span style={{ position: "relative", left: "-8rem", top: "-2rem" }}>
              {divisionToString(newRank.division)}
            </span>
          </span>
          <span style={{ position: "absolute", top: "22rem" }}>
            {showPromoted && `Promoted`}
            {showDemoted && `Demoted`}
            {showPlacements && `Placed`}
          </span>
        </div>
      </div>
    </div>
  );
}
