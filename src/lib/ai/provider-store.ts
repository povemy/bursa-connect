// Persistent AI provider state management
import { type AIProviderId, type AIProviderState, type AIRequestConfig, getProviderConfig } from "./types";

const STORAGE_KEY = "ai_provider_state";

function loadState(): AIProviderState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        providerId: parsed.providerId || "lovable",
        modelId: parsed.modelId || getProviderConfig(parsed.providerId || "lovable").defaultModel,
        apiKey: parsed.apiKey || undefined,
      };
    }
  } catch { /* ignore */ }
  return { providerId: "lovable", modelId: "google/gemini-2.5-flash" };
}

let currentState: AIProviderState = loadState();
const listeners = new Set<() => void>();

export const aiProviderStore = {
  getState(): AIProviderState {
    return currentState;
  },

  /** Get the config to send with every AI API call */
  getRequestConfig(): AIRequestConfig {
    const cfg: AIRequestConfig = { provider: currentState.providerId, model: currentState.modelId };
    if (currentState.apiKey) cfg.apiKey = currentState.apiKey;
    return cfg;
  },

  setProvider(providerId: AIProviderId, modelId?: string) {
    const config = getProviderConfig(providerId);
    currentState = {
      ...currentState,
      providerId,
      modelId: modelId || config.defaultModel,
      // Clear API key when switching provider unless it's the same
      apiKey: currentState.providerId === providerId ? currentState.apiKey : undefined,
    };
    this.persist();
  },

  setModel(modelId: string) {
    currentState = { ...currentState, modelId };
    this.persist();
  },

  setApiKey(key: string | undefined) {
    currentState = { ...currentState, apiKey: key };
    this.persist();
  },

  persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    listeners.forEach(fn => fn());
  },

  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
