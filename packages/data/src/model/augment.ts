import { z } from "zod";

// Minimal augment shape we care about for rendering and mapping
export const ArenaAugmentSchema = z.strictObject({
	id: z.number(),
	name: z.string(),
	rarity: z.number().int(),
	apiName: z.string().optional(),
});
export type ArenaAugment = z.infer<typeof ArenaAugmentSchema>;

const ArenaAugmentsResponseSchema = z.strictObject({
	augments: z.array(ArenaAugmentSchema.passthrough()),
});

// CommunityDragon Arena augments endpoint
const ARENA_AUGMENTS_URL =
	"https://raw.communitydragon.org/latest/cdragon/arena/en_us.json" as const;

let augmentMapCache: Map<number, ArenaAugment> | null = null;

export async function fetchArenaAugments(): Promise<ArenaAugment[]> {
	const res = await fetch(ARENA_AUGMENTS_URL, { cache: "no-store" });
	if (!res.ok) {
		throw new Error(
			`Failed to fetch Arena augments: ${res.status} ${res.statusText}`,
		);
	}
	const data = await res.json();
	const parsed = ArenaAugmentsResponseSchema.parse(data);
	return parsed.augments.map((a) => ({ id: a.id, name: a.name, rarity: a.rarity, apiName: a.apiName }));
}

export async function getArenaAugmentMap(): Promise<Map<number, ArenaAugment>> {
	if (augmentMapCache) return augmentMapCache;
	const augments = await fetchArenaAugments();
	augmentMapCache = new Map(augments.map((a) => [a.id, a] as const));
	return augmentMapCache;
}

export async function mapAugmentIdsToObjects(
	augmentIds: number[],
): Promise<ArenaAugment[]> {
	const map = await getArenaAugmentMap();
	const result: ArenaAugment[] = [];
	for (const id of augmentIds) {
		const aug = map.get(id);
		if (aug) result.push(aug);
	}
	return result;
}
