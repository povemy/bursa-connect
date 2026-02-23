import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { bursaApi, formatChange, formatPrice } from "@/lib/api/bursa";
import { Link } from "react-router-dom";

export default function VaultPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['market-overview'],
    queryFn: () => bursaApi.getMarketOverview(),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const quotes = data?.quotes || [];
  const tickers = data?.tickers || [];

  // Show top stocks sorted by absolute change
  const watchlist = quotes
    .map(q => {
      const ticker = tickers.find(t => t.symbol === q.symbol);
      return { ...q, name: ticker?.name || q.shortName, sector: ticker?.sector || "Unknown" };
    })
    .sort((a, b) => Math.abs(b.regularMarketChangePercent) - Math.abs(a.regularMarketChangePercent))
    .slice(0, 10);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4">
      <h1 className="text-lg font-bold mb-2">Vault — Watchlist</h1>
      <p className="text-xs text-muted-foreground mb-6">Top movers from tracked Bursa stocks (delayed data)</p>

      {isLoading && (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-primary animate-spin text-2xl">progress_activity</span>
          <p className="text-sm text-muted-foreground mt-2">Loading market data...</p>
        </div>
      )}

      <div className="space-y-3 pb-4">
        {watchlist.map((stock) => {
          const isPositive = stock.regularMarketChangePercent >= 0;
          return (
            <Link
              key={stock.symbol}
              to={`/analysis?stock=${encodeURIComponent(stock.symbol)}`}
              className="glass-panel p-4 rounded-xl block hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{stock.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{stock.symbol.replace('.KL', '')}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-bold">{formatPrice(stock.regularMarketPrice)}</span>
                    <span className={`text-sm font-semibold ${isPositive ? "text-primary" : "text-destructive"}`}>
                      {formatChange(stock.regularMarketChangePercent)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">{stock.sector}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Vol: {(stock.regularMarketVolume / 1_000_000).toFixed(1)}M
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="flex-1 bg-secondary border border-glass-border py-2 rounded-lg text-xs font-bold text-muted-foreground text-center">
                  View Analysis
                </span>
                <span className="flex-1 bg-primary/10 border border-primary/20 py-2 rounded-lg text-xs font-bold text-primary text-center">
                  Network Map
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
