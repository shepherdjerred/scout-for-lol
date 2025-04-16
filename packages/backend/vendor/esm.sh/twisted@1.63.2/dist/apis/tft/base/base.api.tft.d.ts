import { BaseApi } from '../../../base/base.d.ts';
import { RegionGroups, Regions } from '../../../constants/index.d.ts';
import { BaseApiGames } from '../../../base/base.const.d.ts';
export declare class BaseApiTft extends BaseApi<RegionGroups | Regions> {
    protected readonly game: BaseApiGames;
}
