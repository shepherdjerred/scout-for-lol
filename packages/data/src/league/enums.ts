import { z } from "zod";

/**
 * Enum schemas used across match DTOs
 */

export const DescriptionSchema = z.enum(["primaryStyle", "subStyle"]);

export const PositionSchema = z.enum(["", "Invalid", "TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]);

export const RoleSchema = z.enum(["SOLO", "NONE", "CARRY", "SUPPORT"]);

export const LaneSchema = z.enum(["TOP", "JUNGLE", "MIDDLE", "BOTTOM"]);
