/**
 * Component showing available prompt variables for each pipeline stage
 *
 * This helps users understand what variables they can use when customizing prompts.
 */

type VariableInfo = {
  name: string;
  description: string;
};

type StageVariables = {
  system: VariableInfo[];
  user: VariableInfo[];
};

/**
 * Variable definitions for each pipeline stage
 */
export const STAGE_VARIABLES: Record<string, StageVariables> = {
  timelineSummary: {
    system: [{ name: "LANE_CONTEXT", description: "Lane-specific context (e.g., top lane plays, jungle pathing)" }],
    user: [{ name: "TIMELINE_DATA", description: "Minified JSON of enriched timeline with participant lookups" }],
  },
  matchSummary: {
    system: [],
    user: [
      { name: "PLAYER_NAME", description: "Player alias" },
      { name: "PLAYER_CHAMPION", description: "Champion name" },
      { name: "PLAYER_LANE", description: "Lane (or 'arena' for arena queue)" },
      { name: "MATCH_DATA", description: "Minified JSON containing both processedMatch and rawMatch" },
    ],
  },
  reviewText: {
    system: [
      { name: "PERSONALITY_INSTRUCTIONS", description: "Personality instructions text (how the reviewer talks)" },
      { name: "STYLE_CARD", description: "Minified JSON style card (AI analysis of writing style)" },
      { name: "LANE_CONTEXT", description: "Lane-specific context" },
    ],
    user: [
      { name: "REVIEWER NAME", description: "Personality name (e.g., 'Aaron')" },
      { name: "PLAYER NAME", description: "Player being reviewed" },
      { name: "PLAYER CHAMPION", description: "Their champion" },
      { name: "PLAYER LANE", description: "Their lane" },
      { name: "OPPONENT CHAMPION", description: "Enemy laner's champion" },
      { name: "FRIENDS CONTEXT", description: "Info about other tracked players in match" },
      { name: "RANDOM BEHAVIOR", description: "Random personality-specific behavior (from randomBehaviors)" },
      { name: "MATCH ANALYSIS", description: "Text output from Stage 1b (match summary)" },
      { name: "QUEUE CONTEXT", description: "Queue type and context (solo, flex, clash, etc.)" },
      { name: "REVIEWER PERSONALITY", description: "Personality instructions text (from style card)" },
    ],
  },
  imageDescription: {
    system: [],
    user: [
      { name: "REVIEW_TEXT", description: "Output from Stage 2 (the generated review)" },
      { name: "ART_STYLE", description: "Selected art style description" },
    ],
  },
  imageGeneration: {
    system: [],
    user: [
      { name: "IMAGE_DESCRIPTION", description: "Output from Stage 3 (the image description)" },
      { name: "ART_STYLE", description: "Selected art style description" },
    ],
  },
};

type PromptVariablesInfoProps = {
  stage: keyof typeof STAGE_VARIABLES;
  type: "system" | "user";
};

export function PromptVariablesInfo({ stage, type }: PromptVariablesInfoProps) {
  const stageVars = STAGE_VARIABLES[stage];
  if (!stageVars) {
    return null;
  }

  const variables = type === "system" ? stageVars.system : stageVars.user;

  if (variables.length === 0) {
    return <p className="text-xs text-gray-500 italic">No variables available for this prompt.</p>;
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-700">Available variables:</p>
      <div className="space-y-1 rounded-md bg-gray-50 p-2">
        {variables.map((v) => (
          <div key={v.name} className="flex items-start gap-2 text-xs">
            <code className="shrink-0 rounded bg-gray-200 px-1 py-0.5 font-mono text-gray-800">{`<${v.name}>`}</code>
            <span className="text-gray-600">{v.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
