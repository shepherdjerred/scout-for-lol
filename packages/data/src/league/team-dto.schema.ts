import { z } from "zod";

export const EpicMonsterKillDtoSchema = z
  .object({
    featState: z.number(),
  })
  .strict();

export const FeatsDtoSchema = z
  .object({
    EPIC_MONSTER_KILL: EpicMonsterKillDtoSchema,
    FIRST_BLOOD: EpicMonsterKillDtoSchema,
    FIRST_TURRET: EpicMonsterKillDtoSchema,
  })
  .strict();

export const ObjectiveDtoSchema = z
  .object({
    first: z.boolean(),
    kills: z.number(),
  })
  .strict();

export const ObjectivesDtoSchema = z
  .object({
    baron: ObjectiveDtoSchema,
    champion: ObjectiveDtoSchema,
    dragon: ObjectiveDtoSchema,
    inhibitor: ObjectiveDtoSchema,
    riftHerald: ObjectiveDtoSchema,
    tower: ObjectiveDtoSchema,
    horde: ObjectiveDtoSchema.optional(),
    atakhan: ObjectiveDtoSchema.optional(),
  })
  .strict();

export const BanDtoSchema = z
  .object({
    championId: z.number(),
    pickTurn: z.number(),
  })
  .strict();

export const TeamDtoSchema = z
  .object({
    bans: z.array(BanDtoSchema),
    objectives: ObjectivesDtoSchema,
    feats: FeatsDtoSchema.optional(),
    teamId: z.number(),
    win: z.boolean(),
  })
  .strict();

export type TeamDto = z.infer<typeof TeamDtoSchema>;
export type ObjectivesDto = z.infer<typeof ObjectivesDtoSchema>;
