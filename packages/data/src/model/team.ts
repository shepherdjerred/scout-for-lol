import { match } from "ts-pattern";
import { z } from "zod";

export type Team = z.infer<typeof TeamSchema>;
export const TeamSchema = z.enum(["red", "blue"]);

export function invertTeam(team: Team) {
  return match(team)
    .returnType<Team>()
    .with("red", () => "blue")
    .with("blue", () => "red")
    .exhaustive();
}

export function parseTeam(input: number) {
  return match(input)
    .returnType<Team | undefined>()
    .with(100, () => "blue")
    .with(200, () => "red")
    .otherwise(() => undefined);
}

// Arena teams (8 teams of 2 players each)
export type ArenaTeam = z.infer<typeof ArenaTeamSchema>;
export const ArenaTeamSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
]);

export function parseArenaTeam(input: number): ArenaTeam | undefined {
  return match(input)
    .returnType<ArenaTeam | undefined>()
    .with(1, () => 1)
    .with(2, () => 2)
    .with(3, () => 3)
    .with(4, () => 4)
    .with(5, () => 5)
    .with(6, () => 6)
    .with(7, () => 7)
    .with(8, () => 8)
    .otherwise(() => undefined);
}

// Union type for all team types
export type AnyTeam = Team | ArenaTeam;
export const AnyTeamSchema = z.union([TeamSchema, ArenaTeamSchema]);
