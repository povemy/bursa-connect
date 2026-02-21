const feedItems = [
  {
    impact: "high" as const,
    time: "2m ago",
    title: "Semiconductor supply chain disruption in Southeast Asia predicted for Q4.",
    tags: ["BULLISH", "TECH"],
    aiSummary: "Logistics bottleneck detected in Port Klang. Suggests immediate exposure hedge in electronic manufacturers.",
    stocks: ["INARI", "UNISEM", "MPI"],
  },
  {
    impact: "gold" as const,
    time: "15m ago",
    title: "Major institutional whale movement detected in Palm Oil futures.",
    tags: ["COMMODITIES", "WHALE-ALERT"],
    aiSummary: "Accumulation pattern matches historic Q1 rallies. Confidence interval: 89%.",
    stocks: ["SIMEPLT", "IOI", "KLK"],
  },
  {
    impact: "medium" as const,
    time: "42m ago",
    title: "Regional banking policy shift expected to favor retail lending.",
    tags: ["FINANCE", "NEUTRAL"],
    aiSummary: null,
    stocks: ["MAYBANK", "CIMB", "PBBANK"],
  },
  {
    impact: "low" as const,
    time: "1h ago",
    title: "Bursa Malaysia announces new ESG reporting framework for 2026.",
    tags: ["REGULATORY", "ESG"],
    aiSummary: null,
    stocks: ["TENAGA", "PETGAS"],
  },
];

const impactStyles = {
  high: { className: "impact-high", badge: "bg-primary/20 text-primary", label: "High Impact" },
  gold: { className: "impact-gold", badge: "bg-accent/20 text-accent", label: "Institutional Alert" },
  medium: { className: "impact-medium", badge: "bg-muted text-muted-foreground", label: "Medium Impact" },
  low: { className: "impact-low", badge: "bg-muted text-muted-foreground", label: "Low Impact" },
};

export function IntelligenceFeed() {
  return (
    <section className="mt-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold tracking-tight">Live Intelligence Feed</h2>
        <button className="text-[10px] text-muted-foreground flex items-center gap-1 border border-glass-border px-2 py-1 rounded hover:text-foreground transition-colors">
          FILTER <span className="material-symbols-outlined text-[14px]">tune</span>
        </button>
      </div>
      <div className="space-y-4">
        {feedItems.map((item, i) => {
          const style = impactStyles[item.impact];
          return (
            <div key={i} className={`glass-panel p-4 rounded-xl relative overflow-hidden ${style.className}`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`${style.badge} text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest`}>
                  {style.label}
                </span>
                <span className="text-muted-foreground text-[10px]">{item.time}</span>
              </div>
              <h3 className="text-sm font-semibold mb-2 leading-snug">{item.title}</h3>
              <div className="flex gap-2 mb-3 flex-wrap">
                {item.tags.map((tag) => (
                  <span key={tag} className="bg-secondary text-secondary-foreground text-[9px] px-2 py-0.5 rounded border border-glass-border font-medium">
                    {tag}
                  </span>
                ))}
                {item.stocks.map((s) => (
                  <span key={s} className="bg-primary/10 text-primary text-[9px] px-2 py-0.5 rounded font-mono font-bold">
                    {s}
                  </span>
                ))}
              </div>
              {item.aiSummary && (
                <div className={`rounded-lg p-3 border ${
                  item.impact === "gold" ? "bg-accent/5 border-accent/10" : "bg-primary/5 border-primary/10"
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`material-symbols-outlined text-[14px] ${item.impact === "gold" ? "text-accent" : "text-primary"}`}>psychology</span>
                    <span className={`text-[10px] font-bold uppercase ${item.impact === "gold" ? "text-accent" : "text-primary"}`}>AI Summary</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">{item.aiSummary}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
