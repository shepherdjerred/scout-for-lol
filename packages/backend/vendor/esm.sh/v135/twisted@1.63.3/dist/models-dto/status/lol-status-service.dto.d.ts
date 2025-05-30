import { LolStatusServiceStatusIncident } from './lol-status-service-indicents.dto.d.ts';
/**
 * Lol Service dto
 */
export declare class LolStatusServiceDTO {
    /**
     * Service name
     */
    name: string;
    /**
     * Service status
     */
    status: string;
    /**
     * Service slug
     */
    slug: string;
    /**
     * Service incidents
     */
    indicents: LolStatusServiceStatusIncident;
}
