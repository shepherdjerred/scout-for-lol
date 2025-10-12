/**
 * Type augmentation for the twisted package to add missing fields
 * that exist in the actual API responses but are not included in the library types.
 */

declare module "twisted/dist/models-dto/index.js" {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Module augmentation requires namespace syntax
  namespace MatchV5DTOs {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- I think this needs to be an interface rather than a type, since the original is an interface
    interface ParticipantDto {
      /**
       * Player subteam ID - Arena mode specific field
       * Represents which subteam (pair) the player belongs to in Arena matches
       */
      playerSubteamId: number;
    }
  }
}

// This empty export is required to make this file a module
export {};
