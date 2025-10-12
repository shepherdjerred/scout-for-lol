import {
  AugmentSchema,
  FullAugmentSchema,
  type Augment,
  type AugmentRarity,
  type FullAugment,
} from "@scout-for-lol/data";
import z from "zod";

// This models the API response from CommunityDragon.
// API response objects do not include our internal discriminator `type`,
// and provide rarity as a number (r1=prismatic, r2=gold, r3=silver).
// Parse with an API-specific schema, then normalize to internal shape.
const ApiAugmentSchema = FullAugmentSchema.omit({
  type: true,
  rarity: true,
}).extend({ rarity: z.number().int() });
type ApiAugment = z.infer<typeof ApiAugmentSchema>;

const ApiAugmentsResponseSchema = z.strictObject({
  augments: z.array(ApiAugmentSchema),
});

// CommunityDragon Arena augments endpoint
const ARENA_AUGMENTS_URL =
  "https://raw.communitydragon.org/latest/cdragon/arena/en_us.json" as const;

let augmentMapCache: Map<number, FullAugment> | null = null;
let loadPromise: Promise<Map<number, FullAugment>> | null = null;

export async function initArenaAugmentsOnce(): Promise<
  Map<number, FullAugment>
> {
  if (augmentMapCache) return augmentMapCache;
  loadPromise ??= (async () => {
    const res = await fetch(ARENA_AUGMENTS_URL, { cache: "force-cache" });
    if (!res.ok) {
      throw new Error(
        `Failed to fetch Arena augments: ${res.status.toString()} ${res.statusText}`,
      );
    }
    const data = await res.json();
    const parsed = ApiAugmentsResponseSchema.parse(data);
    const rarityFromNumber = (n: number): AugmentRarity => {
      if (n === 1) return "prismatic";
      if (n === 2) return "gold";
      if (n === 3) return "silver";
      return "silver";
    };
    augmentMapCache = new Map(
      parsed.augments.map(
        (a: ApiAugment) =>
          [
            a.id,
            {
              ...a,
              rarity: rarityFromNumber(a.rarity),
              type: "full",
            },
          ] as const,
      ),
    );
    return augmentMapCache;
  })();
  return loadPromise;
}

export function getArenaAugmentMapSync(): Map<number, FullAugment> | null {
  return augmentMapCache;
}

export async function getArenaAugmentMap(): Promise<Map<number, FullAugment>> {
  if (augmentMapCache) return augmentMapCache;
  return initArenaAugmentsOnce();
}

export async function mapAugmentIdsToUnion(
  augmentIds: number[],
): Promise<Augment[]> {
  const map = await getArenaAugmentMap();
  const result: Augment[] = [];
  for (const id of augmentIds) {
    const aug = map.get(id);
    const parsed = AugmentSchema.safeParse({
      ...aug,
      type: "full",
    });
    if (parsed.success) {
      result.push(parsed.data);
    } else {
      result.push({ id, type: "id" });
    }
  }
  return result;
}
