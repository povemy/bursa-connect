const pulseCards = [
  { label: "KLCI Index", value: "1,623.45", change: "+0.42%", positive: true },
  { label: "Top Gainers", value: "12.5%", change: "Avg", positive: true },
  { label: "Top Losers", value: "8.2%", change: "Avg", positive: false },
  { label: "Alerts Today", value: "1,240", change: "High", positive: null },
];

export function MarketPulse() {
  return (
    <section className="mt-6">
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Market Pulse</h2>
        <span className="text-[10px] text-primary flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> LIVE
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar">
        {pulseCards.map((card) => (
          <div key={card.label} className="glass-panel min-w-[160px] p-4 rounded-xl flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-lg font-bold">{card.value}</span>
              <span className={`text-[10px] font-medium ${
                card.positive === true ? "text-primary" : card.positive === false ? "text-destructive" : "text-accent"
              }`}>
                {card.change}
              </span>
            </div>
            <div className="h-8 w-full bg-primary/10 rounded overflow-hidden relative mt-1">
              <svg className="w-full h-full" viewBox="0 0 100 40">
                {card.positive !== false ? (
                  <path d="M0 35 Q 20 15, 40 25 T 80 10 T 100 20" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                ) : (
                  <path d="M0 10 Q 30 35, 60 15 T 100 38" fill="none" stroke="hsl(var(--destructive))" strokeWidth="2" />
                )}
              </svg>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
