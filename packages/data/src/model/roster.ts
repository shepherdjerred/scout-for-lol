import { z } from "zod";
import { ChampionSchema } from "./champion.js";

export type Roster = z.infer<typeof RosterSchema>;
export const RosterSchema = z.array(ChampionSchema).length(5);
