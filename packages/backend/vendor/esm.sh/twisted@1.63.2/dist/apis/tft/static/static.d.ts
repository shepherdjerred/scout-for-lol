import { TFTChampionsDTO } from '../../../models-dto/index.d.ts';
import { TFTHexesDto } from '../../../models-dto/statics/tft-hexes.dto.d.ts';
import { TFTItemsDTO } from '../../../models-dto/statics/tft-items.d.ts';
import { TFTTraitsDTO } from '../../../models-dto/statics/tft-trait.d.ts';
export declare class TFTStaticFiles {
    Champions(): TFTChampionsDTO[];
    Hexes(): TFTHexesDto[];
    Items(): TFTItemsDTO[];
    Traits(): TFTTraitsDTO[];
}
