import { z } from "zod";
import { DescriptionSchema } from "./enums.js";

export const PerkStyleSelectionDtoSchema = z
  .object({
    perk: z.number(),
    var1: z.number(),
    var2: z.number(),
    var3: z.number(),
  })
  .strict();

export const PerkStyleDtoSchema = z
  .object({
    description: DescriptionSchema,
    selections: z.array(PerkStyleSelectionDtoSchema),
    style: z.number(),
  })
  .strict();

export const PerkStatsDtoSchema = z
  .object({
    defense: z.number(),
    flex: z.number(),
    offense: z.number(),
  })
  .strict();

export const PerksDtoSchema = z
  .object({
    statPerks: PerkStatsDtoSchema,
    styles: z.array(PerkStyleDtoSchema),
  })
  .strict();

export type PerksDto = z.infer<typeof PerksDtoSchema>;
