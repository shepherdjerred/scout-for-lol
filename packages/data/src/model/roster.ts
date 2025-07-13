import { z } from "zod";
import { ChampionSchema } from "./champion.js";

export type Roster = z.infer<typeof RosterSchema>;
export const RosterSchema = z.array(ChampionSchema).length(5);

// Arena roster (2 players per team)
export type ArenaRoster = z.infer<typeof ArenaRosterSchema>;
export const ArenaRosterSchema = z.array(ChampionSchema).length(2);

// Union type for all roster types - separate types for different roster sizes
// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents -- technically the Zod types are different
export type AnyRoster = Roster | ArenaRoster;
export const AnyRosterSchema = z.union([RosterSchema, ArenaRosterSchema]);
