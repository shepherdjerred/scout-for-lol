import { type Lane, LaneSchema } from "@scout-for-lol/data";
import { z } from "zod";

const images: Record<Lane, string> = z
  .record(LaneSchema, z.string())
  .refine((obj): obj is Required<typeof obj> =>
    LaneSchema.options.every((key) => obj[key] != null)
  )
  .parse(
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

export function Lane({ lane }: { lane: Lane }) {
  return (
    <span style={{ width: "20rem", display: "flex", justifyContent: "center" }}>
      <img
        src={`data:image/svg+xml;base64,${images[lane]}`}
        style={{ width: "8rem" }}
      />
    </span>
  );
}
