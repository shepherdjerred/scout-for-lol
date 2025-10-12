# Task 17: S3 Match Query - Date Range Filtering

## Overview
Implement functions to query match data from S3 within specific date ranges. This is needed to process matches that occurred during a competition period.

## Dependencies
- Existing S3 storage module

## Files to Create/Modify
- `packages/backend/src/storage/s3-query.ts` (new file)
- `packages/backend/src/storage/index.ts` - export query functions

## Acceptance Criteria
1. `queryMatchesByDateRange()` function implemented:
   - Input: startDate, endDate, puuids (array)
   - Output: array of MatchDto
2. Efficiently lists S3 objects in date range
3. Filters matches to only include specified participants (by PUUID)
4. Handles date boundaries correctly (inclusive)
5. Parses JSON match data from S3
6. Handles S3 errors gracefully (return empty array or throw)
7. Supports pagination for large result sets
8. Caches results per competition run (optional optimization)

## Implementation Notes
- S3 key structure: `matches/{year}/{month}/{day}/{matchId}.json`
- For date range 2025-01-15 to 2025-01-20, list all days in range
- Use `ListObjectsV2` with prefix for each day
- Filter matches client-side by participant PUUIDs
- Consider memory usage for large date ranges

## Test Cases

### Unit Tests
File: `packages/backend/src/storage/s3-query.test.ts`

1. **Date range path generation**
   - Start: 2025-01-15, End: 2025-01-15 → single day path
   - Start: 2025-01-15, End: 2025-01-17 → three day paths
   - Start: 2025-01-31, End: 2025-02-02 → crosses month boundary

2. **Match filtering by PUUID**
   - Match with participant PUUID in list → included
   - Match with no participants in list → excluded
   - Match with multiple participants in list → included once

### Integration Tests
File: `packages/backend/src/storage/s3-query.integration.test.ts`

3. **Query single day**
   - Upload 3 matches on 2025-01-15
   - Query 2025-01-15 to 2025-01-15 → returns 3 matches
   - All matches parsed correctly

4. **Query date range**
   - Upload matches on 2025-01-15, 2025-01-16, 2025-01-17
   - Query 2025-01-15 to 2025-01-17 → returns all matches
   - Matches from all days included

5. **Filter by participants**
   - Upload 5 matches with various participants
   - Query with specific PUUIDs → only matches with those PUUIDs returned
   - Correct filtering

6. **Empty results**
   - Query date range with no matches → returns empty array
   - No errors thrown

7. **S3 not configured**
   - S3_BUCKET_NAME not set
   - Query returns empty array with warning log
   - Doesn't crash

8. **Invalid JSON in S3**
   - Upload corrupted JSON file
   - Query skips invalid file with warning
   - Returns valid matches

## Example Implementation
```typescript
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

export async function queryMatchesByDateRange(
  startDate: Date,
  endDate: Date,
  puuids: string[]
): Promise<MatchV5DTOs.MatchDto[]> {
  const client = new S3Client();
  const bucket = configuration.s3BucketName;
  
  if (!bucket) {
    console.warn('[S3Query] S3 not configured, returning empty results');
    return [];
  }
  
  const dayPrefixes = generateDatePrefixes(startDate, endDate);
  const matches: MatchV5DTOs.MatchDto[] = [];
  
  for (const prefix of dayPrefixes) {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });
    
    const response = await client.send(listCommand);
    
    if (!response.Contents) continue;
    
    for (const object of response.Contents) {
      if (!object.Key) continue;
      
      const match = await getMatchFromS3(bucket, object.Key);
      
      if (match && matchIncludesParticipant(match, puuids)) {
        matches.push(match);
      }
    }
  }
  
  return matches;
}

function generateDatePrefixes(startDate: Date, endDate: Date): string[] {
  const prefixes: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, '0');
    const day = String(current.getUTCDate()).padStart(2, '0');
    
    prefixes.push(`matches/${year}/${month}/${day}/`);
    
    current.setUTCDate(current.getUTCDate() + 1);
  }
  
  return prefixes;
}

function matchIncludesParticipant(match: MatchV5DTOs.MatchDto, puuids: string[]): boolean {
  return match.metadata.participants.some(puuid => puuids.includes(puuid));
}
```

## Validation
- Run `bun run typecheck:all`
- Run `bun test packages/backend/src/storage/s3-query.test.ts`
- Test with real S3 data (staging environment)
- Monitor memory usage with large date ranges

