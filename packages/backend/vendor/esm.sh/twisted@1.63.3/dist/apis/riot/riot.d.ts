import { BaseApiRiot } from './base/base.api.riot.d.ts';
import { AccountV1Api } from './account/account.d.ts';
/**
 * Riot Api
 */
export declare class RiotApi extends BaseApiRiot {
    /**
     * AccountV1 methods
     */
    readonly Account: AccountV1Api;
}
