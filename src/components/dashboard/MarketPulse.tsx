import { useQuery } from "@tanstack/react-query";
import { bursaApi, formatChange } from "@/lib/api/bursa";

export function MarketPulse() {
  const { data, isLoading } = useQuery({
    queryKey: ['market-overview'],
    queryFn: () => bursaApi.getMarketOverview(),
    refetchInterval: 60000, // refresh every minute
    staleTime: 30000,
  });

  const klci = data?.klci;
  const quotes = data?.quotes || [];

  // Calculate top gainers avg and top losers avg
  const gainers = quotes.filter(q => q.regularMarketChangePercent > 0).sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent);
  const losers = quotes.filter(q => q.regularMarketChangePercent < 0).sort((a, b) => a.regularMarketChangePercent - b.regularMarketChangePercent);
  const topGainerAvg = gainers.length > 0 ? gainers.slice(0, 5).reduce((sum, q) => sum + q.regularMarketChangePercent, 0) / Math.min(5, gainers.length) : 0;
  const topLoserAvg = losers.length > 0 ? Math.abs(losers.slice(0, 5).reduce((sum, q) => sum + q.regularMarketChangePercent, 0) / Math.min(5, losers.length)) : 0;

  const pulseCards = [
    {
      label: "KLCI Index",
      value: klci ? klci.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : isLoading ? "..." : "N/A",
      change: klci ? formatChange(klci.changePct) : "",
      positive: klci ? klci.changePct >= 0 : true,
    },
    {
      label: "Top Gainers",
      value: topGainerAvg > 0 ? `${topGainerAvg.toFixed(1)}%` : isLoading ? "..." : "0%",
      change: `${gainers.length} stocks`,
      positive: true,
    },
    {
      label: "Top Losers",
      value: topLoserAvg > 0 ? `${topLoserAvg.toFixed(1)}%` : isLoading ? "..." : "0%",
      change: `${losers.length} stocks`,
      positive: false,
    },
    {
      label: "Active Stocks",
      value: quotes.length > 0 ? String(quotes.length) : isLoading ? "..." : "0",
      change: "Tracked",
      positive: null as boolean | null,
    },
  ];

  return (
    <section className="mt-6">
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Market Pulse</h2>
        <span className="text-[10px] text-primary flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {isLoading ? "LOADING" : "DELAYED"}
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
