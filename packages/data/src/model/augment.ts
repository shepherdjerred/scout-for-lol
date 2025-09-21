import { z } from "zod";

// Full augment shape from CommunityDragon (accept entire object via passthrough)
export const ArenaAugmentRaritySchema = z.union([
	z.literal("prismatic"),
	z.literal("gold"),
	z.literal("silver"),
]);
export type ArenaAugmentRarity = z.infer<typeof ArenaAugmentRaritySchema>;

export const ArenaAugmentSchema = z
	.object({
		id: z.number(),
		name: z.string(),
		rarity: ArenaAugmentRaritySchema,
		apiName: z.string().optional(),
		desc: z.string().optional(),
		tooltip: z.string().optional(),
		iconLarge: z.string().optional(),
		iconSmall: z.string().optional(),
		calculations: z.unknown().optional(),
		dataValues: z.record(z.string(), z.unknown()).optional(),
		type: z.literal("full"),
	})
	.passthrough();
export type ArenaAugment = z.infer<typeof ArenaAugmentSchema>;

export const ArenaAugmentIdOnlySchema = z.strictObject({ id: z.number(), type: z.literal("id") });
export type ArenaAugmentIdOnly = z.infer<typeof ArenaAugmentIdOnlySchema>;

export const ArenaAugmentUnionSchema = z.discriminatedUnion("type", [
	ArenaAugmentSchema,
	ArenaAugmentIdOnlySchema,
]);
export type ArenaAugmentUnion = z.infer<typeof ArenaAugmentUnionSchema>;

// API response objects do not include our internal discriminator `type`,
// and provide rarity as a number (r1=prismatic, r2=gold, r3=silver).
// Parse with an API-specific schema, then normalize to internal shape.
const ArenaAugmentFromApiSchema = ArenaAugmentSchema
	.omit({ type: true, rarity: true })
	.extend({ rarity: z.number().int() });
type ArenaAugmentFromApi = z.infer<typeof ArenaAugmentFromApiSchema>;

const ArenaAugmentsResponseSchema = z.strictObject({
	augments: z.array(ArenaAugmentFromApiSchema),
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
			const rarityFromNumber = (n: number): ArenaAugmentRarity => {
				if (n === 1) return "prismatic";
				if (n === 2) return "gold";
				if (n === 3) return "silver";
				return "silver";
			};
			augmentMapCache = new Map(
				parsed.augments.map(
					(a: ArenaAugmentFromApi) =>
						[
							a.id,
							{ ...a, rarity: rarityFromNumber(a.rarity), type: "full" } as ArenaAugment,
						] as const,
				),
			);
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
		const parsed = ArenaAugmentUnionSchema.safeParse({
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

// tests-only helper
export function __resetArenaAugmentsCacheForTestsOnly() {
	augmentMapCache = null;
	loadPromise = null;
}
