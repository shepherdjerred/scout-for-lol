import { IEndpoint } from '../endpoints/index.d.ts';
import { ApiResponseDTO } from '../models-dto/api-response/api-response.d.ts';
import { IBaseApiParams, IParams } from './base.utils.d.ts';
import { BaseApiGames } from './base.const.d.ts';
import { RegionGroups } from '../constants/index.d.ts';
export declare class BaseApi<Region extends string> {
    protected readonly game: BaseApiGames;
    private baseUrl;
    private key;
    private concurrency;
    private rateLimitRetry;
    private rateLimitRetryAttempts;
    private debug;
    constructor();
    constructor(params: IBaseApiParams);
    /**
     * Base api
     * @param key Riot games api key
     */
    constructor(key: string);
    private setParams;
    private getRateLimits;
    private getBaseUrl;
    private getApiUrl;
    private isRateLimitError;
    private isServiceUnavailableError;
    private getError;
    private internalRequest;
    private retryRateLimit;
    protected getParam(): IBaseApiParams;
    protected request<T>(region: Region | RegionGroups, endpoint: IEndpoint, params?: IParams, forceError?: boolean, queryParams?: any): Promise<ApiResponseDTO<T>>;
}
