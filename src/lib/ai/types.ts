// AI Provider abstraction types

export type AIProviderId = "lovable" | "gemini" | "openai" | "openrouter";

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  description: string;
  icon: string;
  requiresKey: boolean;
  keyPlaceholder?: string;
  keyHelpUrl?: string;
  keyPrefix?: string;
  capabilities: AICapabilities;
  models: AIModel[];
  defaultModel: string;
}

export interface AICapabilities {
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  supportsLongContext: boolean;
  supportsStreaming: boolean;
  maxContextTokens: number;
}

export interface AIModel {
  id: string;
  name: string;
  tier: "fast" | "balanced" | "premium";
  description: string;
}

export interface AIProviderState {
  providerId: AIProviderId;
  modelId: string;
  apiKey?: string; // stored in localStorage, sent per-request over HTTPS
}

export interface AIRequestConfig {
  provider: AIProviderId;
  model?: string;
  apiKey?: string;
}

// Provider registry
export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: "lovable",
    name: "Lovable AI",
    description: "Built-in AI engine — no API key required",
    icon: "auto_awesome",
    requiresKey: false,
    capabilities: {
      supportsVision: true,
      supportsFunctionCalling: true,
      supportsLongContext: true,
      supportsStreaming: true,
      maxContextTokens: 1000000,
    },
    models: [
      { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", tier: "balanced", description: "Fast & efficient" },
      { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", tier: "premium", description: "Highest accuracy" },
      { id: "google/gemini-2.5-flash-lite", name: "Gemini Flash Lite", tier: "fast", description: "Fastest, lowest cost" },
      { id: "openai/gpt-5-mini", name: "GPT-5 Mini", tier: "balanced", description: "OpenAI balanced" },
      { id: "openai/gpt-5", name: "GPT-5", tier: "premium", description: "OpenAI premium" },
    ],
    defaultModel: "google/gemini-2.5-flash",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Use your own Google Gemini API key",
    icon: "smart_toy",
    requiresKey: true,
    keyPlaceholder: "AIza...",
    keyHelpUrl: "https://ai.google.dev",
    keyPrefix: "AIza",
    capabilities: {
      supportsVision: true,
      supportsFunctionCalling: true,
      supportsLongContext: true,
      supportsStreaming: true,
      maxContextTokens: 1000000,
    },
    models: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tier: "balanced", description: "Fast & balanced" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tier: "premium", description: "Most capable" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", tier: "fast", description: "Fastest" },
    ],
    defaultModel: "gemini-2.5-flash",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "Use your own OpenAI API key",
    icon: "psychology",
    requiresKey: true,
    keyPlaceholder: "sk-...",
    keyHelpUrl: "https://platform.openai.com/api-keys",
    keyPrefix: "sk-",
    capabilities: {
      supportsVision: true,
      supportsFunctionCalling: true,
      supportsLongContext: true,
      supportsStreaming: true,
      maxContextTokens: 128000,
    },
    models: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini", tier: "fast", description: "Fast & affordable" },
      { id: "gpt-4o", name: "GPT-4o", tier: "balanced", description: "Balanced performance" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", tier: "premium", description: "Most capable" },
    ],
    defaultModel: "gpt-4o-mini",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access 100+ models via OpenRouter",
    icon: "hub",
    requiresKey: true,
    keyPlaceholder: "sk-or-...",
    keyHelpUrl: "https://openrouter.ai/keys",
    keyPrefix: "sk-or-",
    capabilities: {
      supportsVision: true,
      supportsFunctionCalling: true,
      supportsLongContext: true,
      supportsStreaming: true,
      maxContextTokens: 200000,
    },
    models: [
      { id: "google/gemini-2.5-flash-preview", name: "Gemini 2.5 Flash", tier: "fast", description: "Via OpenRouter" },
      { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", tier: "balanced", description: "Anthropic balanced" },
      { id: "anthropic/claude-opus-4", name: "Claude Opus 4", tier: "premium", description: "Anthropic premium" },
      { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick", tier: "balanced", description: "Meta open-source" },
    ],
    defaultModel: "google/gemini-2.5-flash-preview",
  },
];

export function getProviderConfig(id: AIProviderId): AIProviderConfig {
  return AI_PROVIDERS.find(p => p.id === id) || AI_PROVIDERS[0];
}
