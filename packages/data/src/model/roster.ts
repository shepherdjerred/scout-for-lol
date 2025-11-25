import { z } from "zod";
import { ChampionSchema } from "@scout-for-lol/data/model/champion.js";

export type Roster = z.infer<typeof RosterSchema>;
export const RosterSchema = z.array(ChampionSchema).length(5);
