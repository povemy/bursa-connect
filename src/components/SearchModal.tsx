import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { bursaApi, type SearchResult } from "@/lib/api/bursa";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search all Bursa stocks via Yahoo Finance
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['bursa-search', debouncedQuery],
    queryFn: () => bursaApi.searchStocks(debouncedQuery),
    enabled: open && debouncedQuery.trim().length >= 1,
    staleTime: 60000,
    retry: 1,
  });

  // Fallback: also search local cached data
  const { data: marketData } = useQuery({
    queryKey: ['market-overview'],
    queryFn: () => bursaApi.getMarketOverview(),
    staleTime: 30000,
  });

  const tickers = marketData?.tickers || [];
  const quotes = marketData?.quotes || [];

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  // Combine remote search results with local data
  const results: Array<{ symbol: string; name: string; sector?: string; pct?: number; source: string }> = [];

  // Add remote search results first
  if (searchResults && searchResults.length > 0) {
    searchResults.forEach((r: SearchResult) => {
      const localQuote = quotes.find(q => q.symbol === r.symbol);
      results.push({
        symbol: r.symbol,
        name: r.name,
        sector: r.sector || r.industry || '',
        pct: localQuote?.regularMarketChangePercent,
        source: 'search',
      });
    });
  }

  // Add local filtered results that aren't already in remote results
  if (query.trim().length > 0) {
    tickers.forEach(t => {
      if (results.find(r => r.symbol === t.symbol)) return;
      const q = query.toLowerCase();
      if (
        t.name.toLowerCase().includes(q) ||
        t.symbol.toLowerCase().includes(q) ||
        t.sector.toLowerCase().includes(q)
      ) {
        const quote = quotes.find(qo => qo.symbol === t.symbol);
        results.push({
          symbol: t.symbol,
          name: t.name,
          sector: t.sector,
          pct: quote?.regularMarketChangePercent,
          source: 'local',
        });
      }
    });
  } else if (!searching && searchResults === undefined) {
    // Show popular stocks when no query
    tickers.slice(0, 8).forEach(t => {
      const quote = quotes.find(q => q.symbol === t.symbol);
      results.push({
        symbol: t.symbol,
        name: t.name,
        sector: t.sector,
        pct: quote?.regularMarketChangePercent,
        source: 'local',
      });
    });
  }

  const handleSelect = (symbol: string) => {
    navigate(`/analysis?stock=${encodeURIComponent(symbol)}`);
    onClose();
  };

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

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
            placeholder="Search any Bursa stock (name, code, sector)..."
          />
          {searching && (
            <span className="material-symbols-outlined text-primary text-sm animate-spin">progress_activity</span>
          )}
          <button onClick={onClose} className="text-muted-foreground text-xs font-bold">ESC</button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {query.trim().length > 0 && results.length === 0 && !searching && (
            <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
          )}
          {results.slice(0, 15).map((r) => {
            const isPositive = (r.pct || 0) >= 0;
            return (
              <button
                key={r.symbol}
                onClick={() => handleSelect(r.symbol)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{r.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{r.symbol.replace('.KL', '')}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {r.sector || 'Bursa Malaysia'}
                    {r.source === 'search' && ' • Yahoo Finance'}
                  </span>
                </div>
                {r.pct != null && (
                  <span className={`text-xs font-bold ${isPositive ? "text-primary" : "text-destructive"}`}>
                    {isPositive ? "+" : ""}{r.pct.toFixed(2)}%
                  </span>
                )}
              </button>
            );
          })}
          {query.trim().length === 0 && (
            <div className="px-4 py-2 border-t border-glass-border">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">
                Search all 900+ Bursa Malaysia stocks
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
