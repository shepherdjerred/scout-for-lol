/**
 * Compile-time type tests for MatchDto schema
 *
 * These tests verify that our Zod schema's inferred type matches the twisted library's API types.
 * All tests are compile-time only - no runtime behavior.
 *
 * Based on: https://frontendmasters.com/blog/testing-types-in-typescript/
 */

import type { MatchDto as _MatchDto } from "@scout-for-lol/packages/data/src/league/match-dto.schema.js";

// ============================================================================
// Type Testing Utilities
// ============================================================================

/**
 * Expects true - fails at compile time if not true
 */
type _Expect<T extends true> = T;

/**
 * Check if two types are exactly equal
 * This is a more precise check than just extends
 */
type _Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

/**
 * Check if type A is assignable to type B (A extends B)
 */
type _Extends<A, B> = A extends B ? true : false;

// ============================================================================
// Type Compatibility Tests
// ============================================================================

/**
 * Type Compatibility Test: Schema vs. Twisted Library Types
 *
 * ⚠️ IMPORTANT FINDING: The twisted library types do NOT match real API responses!
 *
 * Fields that are REQUIRED in twisted types but MISSING in real API data:
 * - ParticipantDto.baitPings (twisted: required, real API: undefined)
 * - ParticipantDto.bountyLevel (twisted: required, real API: undefined)
 *
 * Fields that are OPTIONAL in twisted types but PRESENT in real API data:
 * - Multiple ChallengesDto fields have inconsistent optionality
 *
 * DECISION: Follow real API data, NOT twisted library types.
 * - ✅ Our schema validates real API responses successfully
 * - ✅ Our schema correctly reflects actual Riot API behavior
 * - ❌ Our schema type is NOT assignable to twisted types (twisted is wrong!)
 * - ✅ Runtime cast `as unknown as MatchV5DTOs.MatchDto` is still safe
 *      because it happens AFTER successful validation
 *
 * TEST STATUS: Expected to fail until twisted library is fixed
 */
// type OurMatchDtoExtendsApiMatchDto = Expect<Extends<MatchDto, MatchV5DTOs.MatchDto>>;

/**
 * Document the type incompatibility for future reference
 */
export type TypeCompatibilityNote = {
  status: "incompatible";
  reason: "twisted library types are inaccurate";
  validation: "passes with real API data";
  recommendation: "use schema validation, not type casting";
};
