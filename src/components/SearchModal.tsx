import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { bursaApi } from "@/lib/api/bursa";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['market-overview'],
    queryFn: () => bursaApi.getMarketOverview(),
    staleTime: 30000,
  });

  const tickers = data?.tickers || [];
  const quotes = data?.quotes || [];

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
    }
  }, [open]);

  // Filter stocks by query
  const filtered = query.trim().length > 0
    ? tickers.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.symbol.toLowerCase().includes(query.toLowerCase()) ||
        t.sector.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : tickers.slice(0, 8);

  const handleSelect = (symbol: string) => {
    navigate(`/analysis?stock=${encodeURIComponent(symbol)}`);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-16" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md mx-4 glass-panel rounded-2xl border border-glass-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-glass-border">
          <span className="material-symbols-outlined text-primary">search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-foreground text-sm font-medium placeholder:text-muted-foreground focus:outline-none"
            placeholder="Search stock name, code, or sector..."
          />
          <button onClick={onClose} className="text-muted-foreground text-xs font-bold">ESC</button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
          )}
          {filtered.map((t) => {
            const quote = quotes.find(q => q.symbol === t.symbol);
            const pct = quote?.regularMarketChangePercent || 0;
            const isPositive = pct >= 0;
            return (
              <button
                key={t.symbol}
                onClick={() => handleSelect(t.symbol)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{t.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{t.symbol.replace('.KL', '')}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{t.sector} • {t.cap}</span>
                </div>
                {quote && (
                  <span className={`text-xs font-bold ${isPositive ? "text-primary" : "text-destructive"}`}>
                    {isPositive ? "+" : ""}{pct.toFixed(2)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
