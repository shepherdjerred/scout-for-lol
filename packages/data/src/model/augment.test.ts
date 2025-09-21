import { expect, test, mock } from "bun:test";
import {
	__resetArenaAugmentsCacheForTestsOnly,
	ArenaAugmentUnionSchema,
	getArenaAugmentMap,
	getArenaAugmentMapSync,
	initArenaAugmentsOnce,
	mapAugmentIdsToUnion,
} from "./augment.js";

const sampleApi = {
	augments: [
		{ id: 1, name: "Warmup Routine", rarity: 1, apiName: "WarmupRoutine" },
		{ id: 2, name: "Vanish", rarity: 2, apiName: "Vanish" },
	],
};

test("parses normalized augment object with string rarity", async () => {
    __resetArenaAugmentsCacheForTestsOnly();
    const fetchSpy = mock(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => sampleApi,
    })) as unknown as typeof fetch;
    // @ts-ignore
    globalThis.fetch = fetchSpy;
    const map = await initArenaAugmentsOnce();
    const a = map.get(1)!;
    expect(a.name).toBe("Warmup Routine");
    expect(a.rarity).toBe("prismatic");
});

test("initializes cache once and maps by id", async () => {
	__resetArenaAugmentsCacheForTestsOnly();
	const fetchSpy = mock(async () => ({
		ok: true,
		status: 200,
		statusText: "OK",
		json: async () => sampleApi,
	})) as unknown as typeof fetch;
	// @ts-ignore
	globalThis.fetch = fetchSpy;
	const map = await initArenaAugmentsOnce();
	expect(map.get(1)?.name).toBe("Warmup Routine");
	expect(fetchSpy).toHaveBeenCalledTimes(1);
	const again = await getArenaAugmentMap();
	expect(again.get(2)?.name).toBe("Vanish");
	expect(fetchSpy).toHaveBeenCalledTimes(1);
});

test("maps ids to union with fallback when missing", async () => {
	__resetArenaAugmentsCacheForTestsOnly();
	const fetchSpy = mock(async () => ({
		ok: true,
		status: 200,
		statusText: "OK",
		json: async () => sampleApi,
	})) as unknown as typeof fetch;
	// @ts-ignore
	globalThis.fetch = fetchSpy;
	await initArenaAugmentsOnce();
	const res = await mapAugmentIdsToUnion([1, 999]);
	expect(res.length).toBe(2);
	const a = ArenaAugmentUnionSchema.parse(res[0]);
	expect("name" in a ? a.name : "").toBe("Warmup Routine");
	const b = ArenaAugmentUnionSchema.parse(res[1]);
	expect("id" in b && !("name" in b)).toBe(true);
});

test("getArenaAugmentMapSync returns null before init", () => {
	__resetArenaAugmentsCacheForTestsOnly();
	expect(getArenaAugmentMapSync()).toBeNull();
});
