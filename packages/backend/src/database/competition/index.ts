// Re-export validation functions and schemas
export {
  type CompetitionCreationInput,
  type CompetitionDates,
  CompetitionCreationSchema,
  CompetitionDatesSchema,
  isCompetitionActive,
  validateCompetitionCreation,
  validateOwnerLimit,
  validateServerLimit,
} from "./validation.js";
