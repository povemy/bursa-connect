import { useQuery } from "@tanstack/react-query";
import { bursaApi } from "@/lib/api/bursa";
import { Link } from "react-router-dom";

const SECTOR_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Finance: { bg: "bg-info/20", border: "border-info/50", text: "text-info" },
  Technology: { bg: "bg-primary/20", border: "border-primary/50", text: "text-primary" },
  Energy: { bg: "bg-accent/20", border: "border-accent/50", text: "text-accent" },
  Healthcare: { bg: "bg-warning/20", border: "border-warning/50", text: "text-warning" },
  Plantation: { bg: "bg-success/20", border: "border-success/50", text: "text-primary" },
  Consumer: { bg: "bg-destructive/20", border: "border-destructive/40", text: "text-destructive" },
  Telecom: { bg: "bg-info/20", border: "border-info/40", text: "text-info" },
  Utilities: { bg: "bg-muted", border: "border-muted-foreground/30", text: "text-muted-foreground" },
};

export function NewsRelationshipCloud() {
  const { data } = useQuery({
    queryKey: ['market-overview'],
    queryFn: () => bursaApi.getMarketOverview(),
    staleTime: 30000,
  });

  const quotes = data?.quotes || [];
  const tickers = data?.tickers || [];

  // Group by sector and get sector momentum
  const sectorMap: Record<string, { totalPct: number; count: number; topStock: string; vol: number }> = {};
  quotes.forEach(q => {
    const ticker = tickers.find(t => t.symbol === q.symbol);
    const sector = ticker?.sector || "Unknown";
    if (!sectorMap[sector]) sectorMap[sector] = { totalPct: 0, count: 0, topStock: "", vol: 0 };
    sectorMap[sector].totalPct += q.regularMarketChangePercent;
    sectorMap[sector].count++;
    if (q.regularMarketVolume > sectorMap[sector].vol) {
      sectorMap[sector].vol = q.regularMarketVolume;
      sectorMap[sector].topStock = ticker?.name || q.shortName;
    }
  });

  const sectors = Object.entries(sectorMap)
    .filter(([k]) => k !== "Unknown")
    .map(([name, d]) => ({
      name,
      avgPct: d.totalPct / d.count,
      count: d.count,
      topStock: d.topStock,
    }))
    .sort((a, b) => Math.abs(b.avgPct) - Math.abs(a.avgPct));

  // Positions for nodes in a radial layout
  const positions = [
    { x: 22, y: 25 }, { x: 78, y: 28 }, { x: 15, y: 60 },
    { x: 82, y: 62 }, { x: 35, y: 80 }, { x: 65, y: 80 },
    { x: 50, y: 18 }, { x: 50, y: 75 },
  ];

  return (
    <section className="mt-6 px-4 pb-4">
      <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">Sector Network</h2>
      <div className="glass-panel aspect-[4/3] w-full rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 graph-background opacity-50" />

        {/* Central KLCI node */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full glass-panel border-primary/40 flex items-center justify-center glow-primary">
          <span className="text-[9px] font-bold text-primary">BURSA</span>
        </div>

        {/* SVG lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
          {sectors.slice(0, positions.length).map((s, i) => (
            <line key={s.name} x1="50%" y1="50%" x2={`${positions[i].x}%`} y2={`${positions[i].y}%`}
              stroke={s.avgPct >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
              strokeWidth="1.5"
            />
          ))}
        </svg>

        {/* Sector nodes */}
        {sectors.slice(0, positions.length).map((s, i) => {
          const pos = positions[i];
          const colors = SECTOR_COLORS[s.name] || SECTOR_COLORS.Utilities;
          const size = Math.max(10, Math.min(14, 10 + s.count));
          return (
            <div
              key={s.name}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className={`rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}
                style={{ width: `${size * 3}px`, height: `${size * 3}px` }}>
                <span className={`text-[7px] font-bold ${colors.text} uppercase`}>{s.name.slice(0, 4)}</span>
              </div>
              <span className={`text-[7px] font-bold ${s.avgPct >= 0 ? "text-primary" : "text-destructive"}`}>
                {s.avgPct >= 0 ? "+" : ""}{s.avgPct.toFixed(1)}%
              </span>
            </div>
          );
        })}

        <div className="absolute bottom-3 inset-x-3">
          <Link to="/network"
            className="w-full glass-panel bg-secondary/50 py-2 rounded-lg text-[10px] font-bold text-muted-foreground border border-glass-border uppercase tracking-widest hover:text-foreground transition-colors block text-center">
            Expand Network Map
          </Link>
        </div>
      </div>
    </section>
  );
}
