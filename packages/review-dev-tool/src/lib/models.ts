/**
 * OpenAI model configurations and capabilities
 */

export type ModelCapabilities = {
  supportsTemperature: boolean;
  supportsTopP: boolean;
  maxTokens: number;
  costPer1MInputTokens: number;
  costPer1MOutputTokens: number;
};

export type ModelInfo = {
  id: string;
  name: string;
  description: string;
  capabilities: ModelCapabilities;
  category: "gpt-4" | "gpt-3.5" | "o-series" | "other";
  deprecated?: boolean;
};

/**
 * Comprehensive list of OpenAI models with their capabilities
 * Updated as of November 2025
 */
const OPENAI_MODELS: Record<string, ModelInfo> = {
  // GPT-4o Series (Most capable, multimodal)
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "⚡ Fast & capable multimodal model • $2.50 input / $10 output per 1M tokens",
    capabilities: {
      supportsTemperature: true,
      supportsTopP: true,
      maxTokens: 16384,
      costPer1MInputTokens: 2.5,
      costPer1MOutputTokens: 10.0,
    },
    category: "gpt-4",
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "💰 Most affordable GPT-4 level model • $0.15 input / $0.60 output per 1M tokens",
    capabilities: {
      supportsTemperature: true,
      supportsTopP: true,
      maxTokens: 16384,
      costPer1MInputTokens: 0.15,
      costPer1MOutputTokens: 0.6,
    },
    category: "gpt-4",
  },
  "gpt-4o-2024-11-20": {
    id: "gpt-4o-2024-11-20",
    name: "GPT-4o (2024-11-20)",
    description: "📅 Latest snapshot • Same as gpt-4o",
    capabilities: {
      supportsTemperature: true,
      supportsTopP: true,
      maxTokens: 16384,
      costPer1MInputTokens: 2.5,
      costPer1MOutputTokens: 10.0,
    },
    category: "gpt-4",
  },
  "chatgpt-4o-latest": {
    id: "chatgpt-4o-latest",
    name: "ChatGPT-4o (Latest)",
    description: "🔄 Auto-updated to match ChatGPT • $5 input / $15 output per 1M tokens",
    capabilities: {
      supportsTemperature: true,
      supportsTopP: true,
      maxTokens: 16384,
      costPer1MInputTokens: 5.0,
      costPer1MOutputTokens: 15.0,
    },
    category: "gpt-4",
  },

  // O-Series (Reasoning models)
  o1: {
    id: "o1",
    name: "O1",
    description: "🧠 Advanced reasoning for complex problems • $15 input / $60 output per 1M tokens • No temp control",
    capabilities: {
      supportsTemperature: false, // O-series models don't support temperature
      supportsTopP: false,
      maxTokens: 100000,
      costPer1MInputTokens: 15.0,
      costPer1MOutputTokens: 60.0,
    },
    category: "o-series",
  },
  "o1-mini": {
    id: "o1-mini",
    name: "O1 Mini",
    description: "🚀 Fast reasoning for code/math • $3 input / $12 output per 1M tokens • No temp control",
    capabilities: {
      supportsTemperature: false,
      supportsTopP: false,
      maxTokens: 65536,
      costPer1MInputTokens: 3.0,
      costPer1MOutputTokens: 12.0,
    },
    category: "o-series",
  },
  "o1-preview": {
    id: "o1-preview",
    name: "O1 Preview",
    description: "🔬 Early O1 preview • $15 input / $60 output per 1M tokens • No temp control",
    capabilities: {
      supportsTemperature: false,
      supportsTopP: false,
      maxTokens: 32768,
      costPer1MInputTokens: 15.0,
      costPer1MOutputTokens: 60.0,
    },
    category: "o-series",
  },
  "o3-mini": {
    id: "o3-mini",
    name: "O3 Mini",
    description: "🎯 Budget reasoning model • $1.10 input / $4.40 output per 1M tokens • No temp control",
    capabilities: {
      supportsTemperature: false,
      supportsTopP: false,
      maxTokens: 100000,
      costPer1MInputTokens: 1.1,
      costPer1MOutputTokens: 4.4,
    },
    category: "o-series",
  },

  // GPT-4 Turbo Series
  "gpt-4-turbo": {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "📸 Vision + large context • $10 input / $30 output per 1M tokens",
    capabilities: {
      supportsTemperature: true,
      supportsTopP: true,
      maxTokens: 4096,
      costPer1MInputTokens: 10.0,
      costPer1MOutputTokens: 30.0,
    },
    category: "gpt-4",
  },
  "gpt-4-turbo-preview": {
    id: "gpt-4-turbo-preview",
    name: "GPT-4 Turbo Preview",
    description: "🔍 Preview version • Same pricing as gpt-4-turbo",
    capabilities: {
      supportsTemperature: true,
      supportsTopP: true,
      maxTokens: 4096,
      costPer1MInputTokens: 10.0,
      costPer1MOutputTokens: 30.0,
    },
    category: "gpt-4",
  },

  // Standard GPT-4
  "gpt-4": {
    id: "gpt-4",
    name: "GPT-4",
    description: "⚠️ Original GPT-4 (deprecated) • $30 input / $60 output per 1M tokens • Use gpt-4o instead",
    capabilities: {
      supportsTemperature: true,
      supportsTopP: true,
      maxTokens: 8192,
      costPer1MInputTokens: 30.0,
      costPer1MOutputTokens: 60.0,
    },
    category: "gpt-4",
    deprecated: true,
  },

  // GPT-3.5 Series
  "gpt-3.5-turbo": {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "⚡ Fast & cheap for simple tasks • $0.50 input / $1.50 output per 1M tokens",
    capabilities: {
      supportsTemperature: true,
      supportsTopP: true,
      maxTokens: 4096,
      costPer1MInputTokens: 0.5,
      costPer1MOutputTokens: 1.5,
    },
    category: "gpt-3.5",
  },
  "gpt-3.5-turbo-16k": {
    id: "gpt-3.5-turbo-16k",
    name: "GPT-3.5 Turbo (16k)",
    description: "📚 Large context window • Same pricing as gpt-3.5-turbo",
    capabilities: {
      supportsTemperature: true,
      supportsTopP: true,
      maxTokens: 16384,
      costPer1MInputTokens: 0.5,
      costPer1MOutputTokens: 1.5,
    },
    category: "gpt-3.5",
  },

  // Hypothetical/Future models (gpt-5)
  "gpt-5": {
    id: "gpt-5",
    name: "GPT-5",
    description: "Next-generation GPT model (when available) - Most capable, highest quality",
    capabilities: {
      supportsTemperature: false, // Unknown, assume restricted for preview models
      supportsTopP: false,
      maxTokens: 25000,
      costPer1MInputTokens: 5.0,
      costPer1MOutputTokens: 15.0,
    },
    category: "other",
  },
  "gpt-5-mini": {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    description: "Smaller GPT-5 variant (when available) - Balanced performance and cost",
    capabilities: {
      supportsTemperature: false,
      supportsTopP: false,
      maxTokens: 16384,
      costPer1MInputTokens: 1.0,
      costPer1MOutputTokens: 3.0,
    },
    category: "other",
  },
  "gpt-5-nano": {
    id: "gpt-5-nano",
    name: "GPT-5 Nano",
    description: "Lightweight GPT-5 variant (when available) - Fastest, most cost-effective",
    capabilities: {
      supportsTemperature: true,
      supportsTopP: true,
      maxTokens: 8192,
      costPer1MInputTokens: 0.3,
      costPer1MOutputTokens: 0.9,
    },
    category: "other",
  },
};

/**
 * Get model configuration by ID
 */
function getModelInfo(modelId: string): ModelInfo | undefined {
  // Direct lookup
  if (OPENAI_MODELS[modelId]) {
    return OPENAI_MODELS[modelId];
  }

  // Fuzzy match for versioned models (e.g., gpt-4-0613)
  for (const [key, model] of Object.entries(OPENAI_MODELS)) {
    if (modelId.startsWith(key) || key.startsWith(modelId)) {
      return model;
    }
  }

  return undefined;
}

/**
 * Get all models grouped by category
 */
function _getModelsByCategory(): Record<string, ModelInfo[]> {
  const grouped: Record<string, ModelInfo[]> = {
    "gpt-4": [],
    "gpt-3.5": [],
    "o-series": [],
    other: [],
  };

  for (const model of Object.values(OPENAI_MODELS)) {
    grouped[model.category]?.push(model);
  }

  return grouped;
}

/**
 * Get list of all model IDs
 */
function _getAllModelIds(): string[] {
  return Object.keys(OPENAI_MODELS);
}

/**
 * Check if a model supports a specific parameter
 */
export function modelSupportsParameter(modelId: string, parameter: "temperature" | "topP"): boolean {
  const model = getModelInfo(modelId);
  if (!model) {
    // Default to false for unknown models to be safe
    return false;
  }

  switch (parameter) {
    case "temperature":
      return model.capabilities.supportsTemperature;
    case "topP":
      return model.capabilities.supportsTopP;
    default:
      return false;
  }
}

/**
 * Get recommended max tokens for a model
 */
function _getModelMaxTokens(modelId: string): number {
  const model = getModelInfo(modelId);
  return model?.capabilities.maxTokens ?? 4096;
}
