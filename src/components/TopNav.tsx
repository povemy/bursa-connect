import { useState } from "react";
import { Link } from "react-router-dom";
import { SearchModal } from "./SearchModal";
import { AISettingsModal } from "./AISettingsModal";
import { useAIProvider } from "@/hooks/use-ai-provider";

export function TopNav() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const { config, isReady } = useAIProvider();

  return (
    <>
      <nav className="sticky top-0 z-50 glass-panel px-4 py-3 flex items-center justify-between border-b border-glass-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">hub</span>
          </div>
          <h1 className="text-lg font-bold tracking-tighter">
            INSIGHT<span className="text-primary">FORENSIC</span>
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
          <button
            onClick={() => setAiSettingsOpen(true)}
            className="flex items-center gap-1.5 bg-secondary rounded-full pl-2.5 pr-2 py-1 border border-glass-border hover:border-primary/30 transition-colors group"
          >
            <span className={`material-symbols-outlined text-sm ${isReady ? "text-primary" : "text-destructive"}`}>
              {config.icon}
            </span>
            <span className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">
              {config.name.split(" ")[0]}
            </span>
            <div className={`w-2 h-2 rounded-full ${isReady ? "bg-primary" : "bg-destructive"} animate-pulse`} />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 border border-glass-border flex items-center justify-center text-xs font-bold text-primary-foreground">
            IF
          </div>
        </div>
      </nav>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AISettingsModal open={aiSettingsOpen} onClose={() => setAiSettingsOpen(false)} />
    </>
  );
}
