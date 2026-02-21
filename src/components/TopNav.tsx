import { Link } from "react-router-dom";

export function TopNav() {
  return (
    <nav className="sticky top-0 z-50 glass-panel px-4 py-3 flex items-center justify-between border-b border-glass-border">
      <Link to="/" className="flex items-center gap-2">
        <div className="text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl">hub</span>
        </div>
        <h1 className="text-lg font-bold tracking-tighter">
          INSIGHT<span className="text-primary">FORENSIC</span>
        </h1>
      </Link>
      <div className="flex items-center gap-4">
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <span className="material-symbols-outlined">search</span>
        </button>
        <div className="flex items-center gap-2 bg-secondary rounded-full pl-2 pr-1 py-1 border border-glass-border">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">AI</span>
          <div className="relative flex h-5 w-9 items-center rounded-full bg-primary p-0.5">
            <div className="h-full w-4 rounded-full bg-primary-foreground shadow-sm ml-auto" />
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 border border-glass-border flex items-center justify-center text-xs font-bold text-primary-foreground">
          IF
        </div>
      </div>
    </nav>
  );
}
