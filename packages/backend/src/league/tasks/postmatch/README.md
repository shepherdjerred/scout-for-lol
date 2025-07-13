# Arena and Classic Match Type Implementation

This directory implements robust handling for both Arena and Classic League of Legends match types using Zod schemas for parsing and validation.

## Core Approach

Instead of complex conditional logic, we use **Zod schemas** for:

- ✅ **Type Safety**: Full TypeScript types derived from schemas
- ✅ **Runtime Validation**: Automatic validation of unknown data
- ✅ **Simple Testing**: Just check that `parse()` succeeds
- ✅ **Clear Error Messages**: Zod provides detailed validation errors
- ✅ **Type Discrimination**: Arena vs Classic handled by parsing, not conditionals

## Files

### `arena-types.ts`

- **Arena & Classic Schemas**: Complete Zod schemas for both match types
- **Result Types**: Arena-specific and Classic-specific result structures
- **Parsing Functions**: Type-safe parsing with proper error handling
- **Team Organization**: Utilities for organizing Arena (8 teams) vs Classic (2 teams)

### `arena-specific.test.ts`

- **Arena Result Structure**: Tests Arena-specific data (arenaTeam, placement, 8 teams)
- **Classic Result Structure**: Tests Classic-specific data (team, lane, blue/red)
- **Parsing Validation**: Tests that both match types parse correctly
- **Type Discrimination**: Demonstrates Arena vs Classic behavior differences

## Key Concepts

### Arena Matches

```typescript
{
  matchType: "arena",
  arenaTeams: [/* 8 teams of 2 players each */],
  players: [{
    arenaTeam: 1-8,      // Which subteam (1-8)
    placement: 1-8,      // Final Arena placement
    // ... other fields
  }]
}
```

### Classic Matches

```typescript
{
  matchType: "classic",
  teams: { blue: [...], red: [...] },
  players: [{
    team: "blue" | "red",  // Team assignment
    lane: "top" | "jungle" | ..., // Lane/role
    // ... other fields
  }]
}
```

## Usage

### Parse Match Data

```typescript
import { parseMatch, isArenaMatch, isClassicMatch } from "./arena-types";

const match = parseMatch(unknownMatchData); // Throws if invalid

if (isArenaMatch(match)) {
  // TypeScript knows this is ArenaMatch
  console.log(`Arena match with ${match.info.participants.length} participants`);
} else if (isClassicMatch(match)) {
  // TypeScript knows this is ClassicMatch
  console.log(`Classic match: ${match.info.gameMode}`);
}
```

### createMatchObj Implementation

```typescript
// createMatchObj should return arena-specific or classic-specific types
function createMatchObj(match: unknown): ArenaMatchResult | ClassicMatchResult {
  const parsedMatch = parseMatch(match);

  if (isArenaMatch(parsedMatch)) {
    return {
      matchType: "arena",
      arenaTeams: organizeArenaTeams(parsedMatch),
      players: [/* arena-specific player data */]
    };
  } else {
    return {
      matchType: "classic",
      teams: organizeClassicTeams(parsedMatch),
      players: [/* classic-specific player data */]
    };
  }
}
```

## Benefits

1. **No Complex Conditionals**: Schema validation replaces manual checks
2. **Type Safety**: Full TypeScript support with proper type discrimination
3. **Runtime Safety**: Zod ensures data structure correctness at runtime
4. **Easy Testing**: Just test that `parse()` succeeds for valid data
5. **Maintainable**: Clear separation between Arena and Classic logic
6. **Future-Proof**: Easy to add new match types or modify existing ones

## Integration

The Arena-specific types and parsing are ready to be integrated into the main `createMatchObj` function. The approach scales cleanly and maintains type safety throughout the application.
