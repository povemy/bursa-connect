import { useState } from "react";

interface AISettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const AI_PROVIDERS = [
  { id: "lovable", name: "Lovable AI (Default)", description: "Built-in AI — no key needed", requiresKey: false },
  { id: "gemini", name: "Google Gemini", description: "Use your own Gemini API key", requiresKey: true },
];

export function AISettingsModal({ open, onClose }: AISettingsModalProps) {
  const [selectedProvider, setSelectedProvider] = useState("lovable");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (selectedProvider === "gemini" && apiKey.trim()) {
      localStorage.setItem("ai_provider", "gemini");
      localStorage.setItem("ai_gemini_key", apiKey.trim());
    } else {
      localStorage.setItem("ai_provider", "lovable");
      localStorage.removeItem("ai_gemini_key");
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm mx-4 glass-panel rounded-2xl border border-glass-border p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">AI Provider Settings</h2>
          <button onClick={onClose} className="text-muted-foreground">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {AI_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                selectedProvider === p.id
                  ? "border-primary bg-primary/10"
                  : "border-glass-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-sm ${
                  selectedProvider === p.id ? "text-primary" : "text-muted-foreground"
                }`}>
                  {p.id === "lovable" ? "auto_awesome" : "smart_toy"}
                </span>
                <span className="text-xs font-bold">{p.name}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 ml-6">{p.description}</p>
            </button>
          ))}
        </div>

        {selectedProvider === "gemini" && (
          <div className="mb-4">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full bg-secondary border border-glass-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <p className="text-[9px] text-muted-foreground mt-1">
              Get your key at <span className="text-primary">ai.google.dev</span>
            </p>
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-all"
        >
          {saved ? "✓ Saved" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
