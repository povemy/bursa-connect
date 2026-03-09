import { useSyncExternalStore, useCallback } from "react";
import { aiProviderStore } from "@/lib/ai/provider-store";
import { type AIProviderId, type AIProviderState, type AIRequestConfig, getProviderConfig } from "@/lib/ai/types";

export function useAIProvider() {
  const state: AIProviderState = useSyncExternalStore(
    aiProviderStore.subscribe.bind(aiProviderStore),
    aiProviderStore.getState.bind(aiProviderStore),
  );

  const config = getProviderConfig(state.providerId);

  const setProvider = useCallback((id: AIProviderId, model?: string) => {
    aiProviderStore.setProvider(id, model);
  }, []);

  const setModel = useCallback((modelId: string) => {
    aiProviderStore.setModel(modelId);
  }, []);

  const setApiKey = useCallback((key: string | undefined) => {
    aiProviderStore.setApiKey(key);
  }, []);

  const getRequestConfig = useCallback((): AIRequestConfig => {
    return aiProviderStore.getRequestConfig();
  }, []);

  return {
    state,
    config,
    setProvider,
    setModel,
    setApiKey,
    getRequestConfig,
    isReady: !config.requiresKey || !!state.apiKey,
  };
}
