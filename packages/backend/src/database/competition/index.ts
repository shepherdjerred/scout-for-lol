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

// Re-export query functions and types
export {
  type CreateCompetitionInput,
  cancelCompetition,
  createCompetition,
  getActiveCompetitions,
  getCompetitionById,
  getCompetitionsByServer,
} from "./queries.js";
