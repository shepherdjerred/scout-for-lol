import { z } from "zod";

export const RawEpicMonsterKillSchema = z
  .object({
    featState: z.number(),
  })
  .strict();

export const RawFeatsSchema = z
  .object({
    EPIC_MONSTER_KILL: RawEpicMonsterKillSchema,
    FIRST_BLOOD: RawEpicMonsterKillSchema,
    FIRST_TURRET: RawEpicMonsterKillSchema,
  })
  .strict();

export const RawObjectiveSchema = z
  .object({
    first: z.boolean(),
    kills: z.number(),
  })
  .strict();

export const RawObjectivesSchema = z
  .object({
    baron: RawObjectiveSchema,
    champion: RawObjectiveSchema,
    dragon: RawObjectiveSchema,
    inhibitor: RawObjectiveSchema,
    riftHerald: RawObjectiveSchema,
    tower: RawObjectiveSchema,
    horde: RawObjectiveSchema.optional(),
    atakhan: RawObjectiveSchema.optional(),
  })
  .strict();

export const RawBanSchema = z
  .object({
    championId: z.number(),
    pickTurn: z.number(),
  })
  .strict();

export const RawTeamSchema = z
  .object({
    bans: z.array(RawBanSchema),
    objectives: RawObjectivesSchema,
    feats: RawFeatsSchema.optional(),
    teamId: z.number(),
    win: z.boolean(),
  })
  .strict();

export type RawTeam = z.infer<typeof RawTeamSchema>;
export type RawObjectives = z.infer<typeof RawObjectivesSchema>;
