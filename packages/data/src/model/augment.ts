import { z } from "zod";

// Full augment shape from CommunityDragon (accept entire object via passthrough)
export const ArenaAugmentSchema = z
	.object({
		id: z.number(),
		name: z.string(),
		rarity: z.number().int(),
		apiName: z.string().optional(),
		desc: z.string().optional(),
		tooltip: z.string().optional(),
		iconLarge: z.string().optional(),
		iconSmall: z.string().optional(),
		calculations: z.unknown().optional(),
		dataValues: z.record(z.string(), z.unknown()).optional(),
	})
	.passthrough();
export type ArenaAugment = z.infer<typeof ArenaAugmentSchema>;

export const ArenaAugmentIdOnlySchema = z.strictObject({ id: z.number() });
export type ArenaAugmentIdOnly = z.infer<typeof ArenaAugmentIdOnlySchema>;

export const ArenaAugmentUnionSchema = z.union([
	ArenaAugmentSchema,
	ArenaAugmentIdOnlySchema,
]);
export type ArenaAugmentUnion = z.infer<typeof ArenaAugmentUnionSchema>;

const ArenaAugmentsResponseSchema = z.strictObject({
	augments: z.array(ArenaAugmentSchema),
});

// CommunityDragon Arena augments endpoint
const ARENA_AUGMENTS_URL =
	"https://raw.communitydragon.org/latest/cdragon/arena/en_us.json" as const;

let augmentMapCache: Map<number, ArenaAugment> | null = null;
let loadPromise: Promise<Map<number, ArenaAugment>> | null = null;

export async function initArenaAugmentsOnce(): Promise<Map<number, ArenaAugment>> {
	if (augmentMapCache) return augmentMapCache;
	if (!loadPromise) {
		loadPromise = (async () => {
			const res = await fetch(ARENA_AUGMENTS_URL, { cache: "force-cache" });
			if (!res.ok) {
				throw new Error(
					`Failed to fetch Arena augments: ${res.status} ${res.statusText}`,
				);
			}
			const data = await res.json();
			const parsed = ArenaAugmentsResponseSchema.parse(data);
			augmentMapCache = new Map(parsed.augments.map((a) => [a.id, a] as const));
			return augmentMapCache;
		})();
	}
	return loadPromise;
}

export function getArenaAugmentMapSync(): Map<number, ArenaAugment> | null {
	return augmentMapCache;
}

export async function getArenaAugmentMap(): Promise<Map<number, ArenaAugment>> {
	if (augmentMapCache) return augmentMapCache;
	return initArenaAugmentsOnce();
}

export async function mapAugmentIdsToUnion(
	augmentIds: number[],
): Promise<ArenaAugmentUnion[]> {
	const map = await getArenaAugmentMap();
	const result: ArenaAugmentUnion[] = [];
	for (const id of augmentIds) {
		const aug = map.get(id);
		if (aug) result.push(aug);
		else result.push({ id });
	}
	return result;
}

// tests-only helper
export function __resetArenaAugmentsCacheForTestsOnly() {
	augmentMapCache = null;
	loadPromise = null;
}
