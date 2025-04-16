import { RateLimitDto } from '../rate-limit/rate-limit.dto.d.ts';
export declare class ApiResponseDTO<T> {
    readonly rateLimits?: RateLimitDto;
    readonly response: T;
}
