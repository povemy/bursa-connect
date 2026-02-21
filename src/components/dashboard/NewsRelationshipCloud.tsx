export function NewsRelationshipCloud() {
  return (
    <section className="mt-8 px-4 pb-4">
      <h2 className="text-sm font-bold tracking-tight mb-4">News Relationship Cloud</h2>
      <div className="glass-panel aspect-square w-full rounded-2xl relative flex items-center justify-center overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 graph-background opacity-50" />

        {/* Central node */}
        <div className="relative z-10 w-16 h-16 rounded-full glass-panel border-primary/40 flex items-center justify-center glow-primary">
          <span className="text-[10px] font-bold text-primary">MARKET</span>
        </div>

        {/* Floating nodes */}
        <div className="absolute top-[22%] left-[22%] w-10 h-10 rounded-full bg-info/20 border border-info/50 flex items-center justify-center">
          <span className="text-[8px] font-bold text-info">TECH</span>
        </div>
        <div className="absolute bottom-[30%] right-[22%] w-12 h-12 rounded-full bg-destructive/20 border border-destructive/50 flex items-center justify-center">
          <span className="text-[8px] font-bold text-destructive">RISK</span>
        </div>
        <div className="absolute top-[30%] right-[28%] w-14 h-14 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center glow-gold">
          <span className="text-[8px] font-bold text-accent uppercase">Gold</span>
        </div>
        <div className="absolute bottom-[25%] left-[30%] w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
          <span className="text-[8px] font-bold text-primary uppercase">Oil</span>
        </div>
        <div className="absolute top-[55%] left-[15%] w-9 h-9 rounded-full bg-warning/20 border border-warning/50 flex items-center justify-center">
          <span className="text-[7px] font-bold text-warning uppercase">Bank</span>
        </div>

        {/* Relationship Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
          <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="hsl(var(--primary))" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="75%" y2="66%" stroke="hsl(var(--primary))" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="66%" y2="33%" stroke="hsl(var(--accent))" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="33%" y2="75%" stroke="hsl(var(--primary))" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="18%" y2="55%" stroke="hsl(var(--warning))" strokeWidth="1" />
        </svg>

        <div className="absolute bottom-4 inset-x-4">
          <button className="w-full glass-panel bg-secondary/50 py-2.5 rounded-lg text-xs font-bold text-muted-foreground border border-glass-border uppercase tracking-widest hover:text-foreground transition-colors">
            Expand Network Map
          </button>
        </div>
      </div>
    </section>
  );
}
