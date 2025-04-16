import { Regions } from '../../../constants/index.d.ts';
import { Levels } from '../../../constants/levels.d.ts';
import { BaseApiLol } from '../base/base.api.lol.d.ts';
import { ConfigDTO } from '../../../models-dto/challenges/config.dto.d.ts';
import { LeaderboardDTO } from '../../../models-dto/challenges/leaderboard.dto.d.ts';
import { PercentilesDTO } from '../../../models-dto/challenges/percentiles.dto.d.ts';
import { ChallengePercentilesDTO } from '../../../models-dto/challenges/challenge-percentiles.dto.d.ts';
import { PlayerDTO } from '../../../models-dto/challenges/player.dto.d.ts';
export declare class ChallengesV1Api extends BaseApiLol {
    /**
     * Get all challenge configurations.
     */
    Configs(region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<ConfigDTO.Config[]>>;
    /**
     * Get all challenge percentile distributions.
     */
    Percentiles(region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<PercentilesDTO.Percentiles>>;
    /**
     * Get a challenge configuration.
     */
    ChallengeConfig(challengeId: number, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<ConfigDTO.Config>>;
    /**
     * Get Leaderboards for a challenge (Chall, GM, Masters).
     */
    Leaderboards(challengeId: number, level: Levels, region: Regions, query?: {
        limit: number;
    }): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LeaderboardDTO.Leaderboard[]>>;
    /**
     * Get a challenge percentile distribution.
     */
    ChallengePercentiles(challengeId: number, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<ChallengePercentilesDTO.ChallengePercentile>>;
    /**
     * Get player challenge information.
     */
    PlayerChallenges(puuid: string, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<PlayerDTO.Player>>;
}
