import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { bursaApi, formatChange, formatPrice, volumeRatio, classifyCap } from "@/lib/api/bursa";

type Tab = "gainers" | "losers" | "volume";

export function MarketMovers() {
  const [tab, setTab] = useState<Tab>("gainers");

  const { data, isLoading } = useQuery({
    queryKey: ['market-overview'],
    queryFn: () => bursaApi.getMarketOverview(),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const quotes = data?.quotes || [];
  const tickers = data?.tickers || [];

  const enrichedQuotes = quotes.map(q => {
    const ticker = tickers.find(t => t.symbol === q.symbol);
    const volRat = q.averageDailyVolume3Month ? q.regularMarketVolume / q.averageDailyVolume3Month : 0;
    return {
      ...q,
      name: ticker?.name || q.shortName || q.symbol,
      sector: ticker?.sector || "Unknown",
      capLabel: ticker?.cap || classifyCap(q.marketCap),
      volumeRatio: volRat,
      tag: volRat > 3 ? "Speculative" : volRat > 1.5 ? "Active" : "Normal",
    };
  });

  const sorted = {
    gainers: [...enrichedQuotes].filter(q => q.regularMarketChangePercent > 0).sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent),
    losers: [...enrichedQuotes].filter(q => q.regularMarketChangePercent < 0).sort((a, b) => a.regularMarketChangePercent - b.regularMarketChangePercent),
    volume: [...enrichedQuotes].sort((a, b) => b.regularMarketVolume - a.regularMarketVolume),
  };

  const displayData = sorted[tab];

  return (
    <section className="mt-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold tracking-tight">Market Movers Intelligence</h2>
        {isLoading && <span className="text-[10px] text-muted-foreground">Loading...</span>}
      </div>

      <div className="flex gap-1 mb-4 bg-secondary rounded-lg p-1">
        {(["gainers", "losers", "volume"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "gainers" ? `Gainers (${sorted.gainers.length})` : t === "losers" ? `Losers (${sorted.losers.length})` : "Volume"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {displayData.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
        )}
        {displayData.slice(0, 10).map((stock) => (
          <Link
            key={stock.symbol}
            to={`/analysis?stock=${encodeURIComponent(stock.symbol)}`}
            className="glass-panel p-3 rounded-xl flex items-center justify-between hover:border-primary/30 transition-colors block"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold">{stock.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{stock.symbol.replace('.KL', '')}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                  stock.capLabel === "Penny" ? "bg-destructive/20 text-destructive" :
                  stock.capLabel === "Small" ? "bg-warning/20 text-warning" :
                  stock.capLabel === "Mid" ? "bg-info/20 text-info" :
                  "bg-primary/20 text-primary"
                }`}>{stock.capLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{stock.sector}</span>
                <span className="text-[10px] text-muted-foreground">{formatPrice(stock.regularMarketPrice)}</span>
                {stock.tag !== "Normal" && (
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                    stock.tag === "Speculative" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                  }`}>{stock.tag}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${stock.regularMarketChangePercent >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatChange(stock.regularMarketChangePercent)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Vol: {stock.volumeRatio > 0 ? `${stock.volumeRatio.toFixed(1)}x` : "N/A"}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
