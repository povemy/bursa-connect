import { useState, useEffect } from "react";
import { useAIProvider } from "@/hooks/use-ai-provider";
import { AI_PROVIDERS, type AIProviderId } from "@/lib/ai/types";
import { motion, AnimatePresence } from "framer-motion";

interface AISettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function AISettingsModal({ open, onClose }: AISettingsModalProps) {
  const { state, config, setProvider, setModel, setApiKey, isReady } = useAIProvider();
  const [localKey, setLocalKey] = useState(state.apiKey || "");
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalKey(state.apiKey || "");
      setSaved(false);
      setTestStatus("idle");
    }
  }, [open, state.apiKey]);

  const handleSave = () => {
    if (config.requiresKey && localKey.trim()) {
      setApiKey(localKey.trim());
    } else if (!config.requiresKey) {
      setApiKey(undefined);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  const handleTestConnection = async () => {
    setTestStatus("testing");
    try {
      // Quick validation: check key format
      const provider = AI_PROVIDERS.find(p => p.id === state.providerId);
      if (provider?.requiresKey) {
        if (!localKey.trim()) {
          setTestStatus("error");
          return;
        }
        if (provider.keyPrefix && !localKey.startsWith(provider.keyPrefix)) {
          setTestStatus("error");
          return;
        }
      }
      // Simulate test (real test would hit the AI endpoint)
      await new Promise(r => setTimeout(r, 1000));
      setTestStatus("success");
    } catch {
      setTestStatus("error");
    }
  };

  const tierColors: Record<string, string> = {
    fast: "bg-primary/20 text-primary",
    balanced: "bg-accent/20 text-accent",
    premium: "bg-info/20 text-info",
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md mx-4 glass-panel rounded-2xl border border-glass-border max-h-[85vh] overflow-y-auto hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl px-5 py-4 border-b border-glass-border rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">settings</span>
              <h2 className="text-sm font-bold">AI Provider Settings</h2>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          {/* Current status bar */}
          <div className="flex items-center gap-2 mt-2 bg-secondary rounded-lg px-3 py-1.5">
            <div className={`w-2 h-2 rounded-full ${isReady ? "bg-primary animate-pulse" : "bg-destructive"}`} />
            <span className="text-[10px] text-muted-foreground">Active:</span>
            <span className="text-[10px] font-bold">{config.name}</span>
            <span className="text-[9px] text-muted-foreground ml-auto">
              {config.models.find(m => m.id === state.modelId)?.name || state.modelId}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Select AI Provider
            </label>
            <div className="space-y-2">
              {AI_PROVIDERS.map((p) => {
                const isSelected = state.providerId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id as AIProviderId)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 glow-primary"
                        : "border-glass-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? "bg-primary/20" : "bg-secondary"
                        }`}>
                          <span className={`material-symbols-outlined text-sm ${
                            isSelected ? "text-primary" : "text-muted-foreground"
                          }`}>{p.icon}</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold block">{p.name}</span>
                          <span className="text-[9px] text-muted-foreground">{p.description}</span>
                        </div>
                      </div>
                      {!p.requiresKey && (
                        <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">FREE</span>
                      )}
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                      )}
                    </div>
                    {/* Capability badges */}
                    {isSelected && (
                      <div className="flex gap-1 mt-2 ml-10 flex-wrap">
                        {p.capabilities.supportsVision && (
                          <span className="text-[7px] font-bold bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">Vision</span>
                        )}
                        {p.capabilities.supportsFunctionCalling && (
                          <span className="text-[7px] font-bold bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">Functions</span>
                        )}
                        {p.capabilities.supportsLongContext && (
                          <span className="text-[7px] font-bold bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
                            {(p.capabilities.maxContextTokens / 1000).toFixed(0)}K ctx
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Model
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {config.models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                    state.modelId === m.id
                      ? "border-primary bg-primary/5"
                      : "border-glass-border hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${tierColors[m.tier] || "bg-secondary text-muted-foreground"}`}>
                      {m.tier.toUpperCase()}
                    </span>
                    <span className="text-[11px] font-bold">{m.name}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{m.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input (for providers that need it) */}
          {config.requiresKey && (
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={localKey}
                  onChange={(e) => { setLocalKey(e.target.value); setTestStatus("idle"); }}
                  placeholder={config.keyPlaceholder || "Enter API key..."}
                  className="flex-1 bg-secondary border border-glass-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === "testing" || !localKey.trim()}
                  className="px-3 py-2 rounded-lg bg-secondary border border-glass-border text-xs font-bold hover:border-primary/30 transition-colors disabled:opacity-50"
                >
                  {testStatus === "testing" ? (
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  ) : testStatus === "success" ? (
                    <span className="material-symbols-outlined text-sm text-primary">check</span>
                  ) : testStatus === "error" ? (
                    <span className="material-symbols-outlined text-sm text-destructive">close</span>
                  ) : "Test"}
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[9px] text-muted-foreground">
                  Get your key at{" "}
                  <a href={config.keyHelpUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {config.keyHelpUrl?.replace("https://", "")}
                  </a>
                </p>
                {testStatus === "success" && (
                  <span className="text-[9px] text-primary font-bold">✓ Key format valid</span>
                )}
                {testStatus === "error" && (
                  <span className="text-[9px] text-destructive font-bold">Invalid key format</span>
                )}
              </div>
            </div>
          )}

          {/* Advanced / Debug Panel */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-xs">{showAdvanced ? "expand_less" : "expand_more"}</span>
            Debug Info
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-secondary rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Provider</span>
                    <span className="text-[9px] font-mono font-bold">{state.providerId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Model</span>
                    <span className="text-[9px] font-mono font-bold">{state.modelId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Key Configured</span>
                    <span className={`text-[9px] font-bold ${state.apiKey ? "text-primary" : "text-muted-foreground"}`}>
                      {state.apiKey ? `${state.apiKey.substring(0, 6)}...` : "None"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Status</span>
                    <span className={`text-[9px] font-bold ${isReady ? "text-primary" : "text-destructive"}`}>
                      {isReady ? "Ready" : "Key Required"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Routing</span>
                    <span className="text-[9px] font-mono font-bold">
                      {state.providerId === "lovable" ? "Gateway" : "Direct"}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fallback notice */}
          {config.requiresKey && !localKey.trim() && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-sm">info</span>
                <p className="text-[9px] text-accent">
                  Without an API key, the app will automatically fall back to Lovable AI.
                </p>
              </div>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-all"
          >
            {saved ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-sm">check</span> Saved
              </span>
            ) : "Save & Apply Globally"}
          </button>

          <p className="text-[8px] text-muted-foreground text-center">
            All AI-powered features will use the selected provider immediately.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
