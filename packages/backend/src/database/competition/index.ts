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

// Re-export participant functions
export {
  acceptInvitation,
  addParticipant,
  canJoinCompetition,
  getParticipantStatus,
  getParticipants,
  removeParticipant,
} from "./participants.js";

// Re-export permission functions and types
export {
  type PermissionCheckResult,
  canCreateCompetition,
  grantPermission,
  hasPermission,
  revokePermission,
} from "./permissions.js";

// Re-export rate limit functions
export {
  checkRateLimit,
  clearAllRateLimits,
  clearRateLimit,
  getTimeRemaining,
  recordCreation,
} from "./rate-limit.js";
