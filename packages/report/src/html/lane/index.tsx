import { type Lane, LaneSchema } from "@scout-for-lol/data";
import { z } from "zod";
import { match } from "ts-pattern";

let images: Record<Lane, string>;

if (typeof Bun !== "undefined") {
  images = z.record(LaneSchema, z.string()).parse(
    Object.fromEntries(
      await Promise.all(
        LaneSchema.options.map(async (lane): Promise<[Lane, string]> => {
          const image = await Bun.file(
            new URL(`assets/${lane}.svg`, import.meta.url)
          ).arrayBuffer();
          return [lane, Buffer.from(image).toString("base64")];
        })
      )
    )
  );
}

export async function Lane({ lane }: { lane: Lane }) {
  const environment = typeof Bun !== "undefined" ? "bun" : "browser";
  const image = await match(environment)
    .with("bun", () =>
      Promise.resolve(`data:image/svg+xml;base64,${images[lane]}`)
    )
    .with("browser", async () => {
      const module = (await import(`./assets/${lane}.svg`)) as {
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
  return (
    <span style={{ width: "20rem", display: "flex", justifyContent: "center" }}>
      <img src={image} style={{ width: "8rem" }} />
    </span>
  );
}
