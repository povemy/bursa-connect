import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { bursaApi, formatChange, formatPrice, classifyCap } from "@/lib/api/bursa";

type ViewTab = "scanner" | "suggestions" | "traplist";
type SuggestionCategory = "all" | "Strong Setup" | "Undervalued Growth" | "Penny Focus";

export default function VaultPage() {
  const [viewTab, setViewTab] = useState<ViewTab>("scanner");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [suggestionCategory, setSuggestionCategory] = useState<SuggestionCategory>("all");

  const { data, isLoading } = useQuery({
    queryKey: ['market-overview'],
    queryFn: () => bursaApi.getMarketOverview(),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const quotes = data?.quotes || [];
  const tickers = data?.tickers || [];

  const enriched = quotes.map(q => {
    const ticker = tickers.find(t => t.symbol === q.symbol);
    const volRatio = q.averageDailyVolume3Month ? q.regularMarketVolume / q.averageDailyVolume3Month : 0;
    const changePct = q.regularMarketChangePercent;
    const volumeScore = Math.min(30, volRatio * 10);
    const momentumScore = changePct > 0 ? Math.min(25, changePct * 5) : Math.max(0, 15 + changePct * 3);
    const stabilityScore = Math.abs(changePct) < 5 ? 20 : Math.abs(changePct) < 10 ? 10 : 5;
    const baseScore = volumeScore + momentumScore + stabilityScore;
    const opportunityScore = Math.min(95, Math.max(5, Math.round(baseScore + Math.random() * 15)));
    const trapFlag = volRatio > 4 && Math.abs(changePct) > 5;
    const hiddenRadar = !trapFlag && volRatio < 1.5 && changePct > 0 && changePct < 3 && momentumScore > 10;
    const riskLevel = Math.abs(changePct) > 5 || volRatio > 3 ? "High" : Math.abs(changePct) > 2 || volRatio > 1.5 ? "Medium" : "Low";

    return {
      ...q,
      name: ticker?.name || q.shortName || q.symbol,
      sector: ticker?.sector || "Unknown",
      capLabel: ticker?.cap || classifyCap(q.marketCap),
      volRatio,
      opportunityScore,
      trapFlag,
      hiddenRadar,
      riskLevel,
      bias: trapFlag ? "Sell" : opportunityScore > 65 ? "Conditional Buy" : opportunityScore > 40 ? "Hold" : "Sell",
    };
  });

  const sectors = ["All", ...Array.from(new Set(enriched.map(e => e.sector))).sort()];
  const filtered = sectorFilter === "All" ? enriched : enriched.filter(e => e.sector === sectorFilter);

  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['daily-suggestions'],
    queryFn: () => bursaApi.getDailySuggestions(
      enriched.map(e => ({ symbol: e.symbol, name: e.name, sector: e.sector, change: e.regularMarketChangePercent, volume: e.regularMarketVolume, volRatio: e.volRatio, price: e.regularMarketPrice, cap: e.capLabel }))
    ),
    enabled: enriched.length > 0,
    staleTime: 600000,
    retry: 1,
  });

  const allSuggestions = suggestionsData?.suggestions || [];
  const filteredSuggestions = suggestionCategory === "all" ? allSuggestions : allSuggestions.filter((s: any) => s.category === suggestionCategory);

  const categoryColors: Record<string, string> = {
    "Strong Setup": "bg-primary/20 text-primary",
    "Undervalued Growth": "bg-accent/20 text-accent",
    "Penny Focus": "bg-info/20 text-info",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4">
      <h1 className="text-lg font-bold mb-1">Intelligence Vault</h1>
      <p className="text-[10px] text-muted-foreground mb-4">AI-powered stock scanner, retail suggestions & trap detection</p>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 bg-secondary rounded-lg p-1">
        {([
          { key: "scanner", label: "Scanner" },
          { key: "suggestions", label: "Daily Picks" },
          { key: "traplist", label: "Trap List" },
        ] as { key: ViewTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setViewTab(t.key)}
            className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              viewTab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}>{t.label}</button>
        ))}
      </div>

      {viewTab === "scanner" && (
        <>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar mb-3 pb-1">
            {sectors.map(s => (
              <button key={s} onClick={() => setSectorFilter(s)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold transition-colors ${
                  sectorFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>{s}</button>
            ))}
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-primary animate-spin text-2xl">progress_activity</span>
              <p className="text-xs text-muted-foreground mt-2">Loading market data...</p>
            </div>
          )}

          <div className="space-y-2 pb-4">
            {[...filtered].sort((a, b) => b.opportunityScore - a.opportunityScore).map(stock => (
              <Link key={stock.symbol} to={`/analysis?stock=${encodeURIComponent(stock.symbol)}`}
                className="glass-panel p-3 rounded-xl block hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{stock.name}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">{stock.symbol.replace('.KL', '')}</span>
                    <span className={`text-[7px] font-bold px-1 py-0.5 rounded ${
                      stock.capLabel === "Penny" ? "bg-info/20 text-info" :
                      stock.capLabel === "Small" ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
                    }`}>{stock.capLabel}</span>
                    {stock.hiddenRadar && (
                      <span className="text-[7px] font-bold bg-accent/20 text-accent px-1 py-0.5 rounded">RADAR</span>
                    )}
                    {stock.trapFlag && (
                      <span className="text-[7px] font-bold bg-destructive/20 text-destructive px-1 py-0.5 rounded">TRAP</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    stock.riskLevel === "High" ? "bg-destructive/20 text-destructive" :
                    stock.riskLevel === "Medium" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                  }`}>{stock.riskLevel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[8px] text-muted-foreground">Score</p>
                      <p className="text-sm font-bold text-primary">{stock.opportunityScore}%</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-muted-foreground">Price</p>
                      <p className="text-xs font-bold">{formatPrice(stock.regularMarketPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-muted-foreground">Change</p>
                      <p className={`text-xs font-bold ${stock.regularMarketChangePercent >= 0 ? "text-primary" : "text-destructive"}`}>
                        {formatChange(stock.regularMarketChangePercent)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-muted-foreground">{stock.sector}</p>
                    <p className={`text-[9px] font-bold ${
                      stock.bias === "Conditional Buy" ? "text-primary" :
                      stock.bias === "Sell" ? "text-destructive" : "text-accent"
                    }`}>{stock.bias}</p>
                  </div>
                </div>
                <div className="w-full h-1 bg-secondary rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${stock.opportunityScore}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {viewTab === "suggestions" && (
        <div className="space-y-2 pb-4">
          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar mb-2 pb-1">
            {(["all", "Strong Setup", "Undervalued Growth", "Penny Focus"] as SuggestionCategory[]).map(cat => (
              <button key={cat} onClick={() => setSuggestionCategory(cat)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold transition-colors ${
                  suggestionCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>{cat === "all" ? "All" : cat}</button>
            ))}
          </div>

          {suggestionsLoading && (
            <div className="glass-panel p-6 rounded-xl text-center">
              <span className="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span>
              <p className="text-xs text-muted-foreground mt-2">AI generating daily suggestions...</p>
              <p className="text-[9px] text-muted-foreground mt-1">Analyzing fundamentals, volume, structure & sentiment</p>
            </div>
          )}

          {suggestionsData?.marketSummary && (
            <div className="glass-panel p-3 rounded-xl border-l-4 border-primary mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Market Summary</p>
              <p className="text-[10px] text-muted-foreground">{suggestionsData.marketSummary}</p>
            </div>
          )}

          {filteredSuggestions.map((s: any, i: number) => (
            <Link key={i} to={`/analysis?stock=${encodeURIComponent(s.symbol)}`}
              className="glass-panel p-3 rounded-xl block hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{s.name}</span>
                  <span className="text-[9px] text-muted-foreground font-mono">{s.symbol?.replace('.KL', '')}</span>
                  {s.category && (
                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded ${categoryColors[s.category] || "bg-secondary text-muted-foreground"}`}>
                      {s.category}
                    </span>
                  )}
                  {s.hiddenRadar && (
                    <span className="text-[7px] font-bold bg-accent/20 text-accent px-1 py-0.5 rounded">RADAR</span>
                  )}
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  s.bias === "Conditional Buy" ? "bg-primary/20 text-primary" :
                  s.bias === "Watch" ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
                }`}>{s.bias}</span>
              </div>
              <p className="text-[9px] text-muted-foreground mb-2">{s.keyReason}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[8px]">Conf: <strong className="text-primary">{s.confidence}%</strong></span>
                <span className="text-[8px]">Score: <strong>{s.opportunityScore}%</strong></span>
                <span className={`text-[8px] ${s.riskLevel === "High" ? "text-destructive" : "text-muted-foreground"}`}>
                  Risk: {s.riskLevel}
                </span>
                {s.trapProbability != null && (
                  <span className={`text-[8px] ${s.trapProbability > 30 ? "text-destructive" : "text-muted-foreground"}`}>
                    Trap: {s.trapProbability}%
                  </span>
                )}
                {s.macroAlignment && (
                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded ${
                    s.macroAlignment === "Positive" ? "bg-primary/10 text-primary" :
                    s.macroAlignment === "Negative" ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"
                  }`}>Macro: {s.macroAlignment}</span>
                )}
                {s.sectorTag && (
                  <span className="text-[7px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{s.sectorTag}</span>
                )}
              </div>
              {s.riskTriggers && (
                <p className="text-[8px] text-muted-foreground mt-1">⚠ {s.riskTriggers}</p>
              )}
            </Link>
          ))}

          {!suggestionsLoading && filteredSuggestions.length === 0 && (
            <div className="glass-panel p-6 rounded-xl text-center">
              <span className="material-symbols-outlined text-muted-foreground text-2xl">psychology</span>
              <p className="text-xs text-muted-foreground mt-2">No suggestions in this category</p>
            </div>
          )}
        </div>
      )}

      {viewTab === "traplist" && (
        <div className="space-y-2 pb-4">
          {suggestionsLoading && (
            <div className="glass-panel p-6 rounded-xl text-center">
              <span className="material-symbols-outlined text-destructive text-2xl animate-spin">progress_activity</span>
              <p className="text-xs text-muted-foreground mt-2">Scanning for manipulation patterns...</p>
            </div>
          )}

          {enriched.filter(e => e.trapFlag).map(stock => (
            <div key={stock.symbol} className="glass-panel p-3 rounded-xl border-l-4 border-destructive">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-destructive text-sm">crisis_alert</span>
                  <span className="text-xs font-bold">{stock.name}</span>
                  <span className="text-[9px] text-muted-foreground font-mono">{stock.symbol.replace('.KL', '')}</span>
                </div>
                <span className="text-[9px] font-bold text-destructive">TRAP</span>
              </div>
              <p className="text-[9px] text-muted-foreground">
                Abnormal volume ({stock.volRatio.toFixed(1)}x avg) with {formatChange(stock.regularMarketChangePercent)} move. High manipulation probability.
              </p>
            </div>
          ))}

          {suggestionsData?.trapList?.map((t: any, i: number) => (
            <div key={i} className="glass-panel p-3 rounded-xl border-l-4 border-destructive">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-destructive text-sm">warning</span>
                  <span className="text-xs font-bold">{t.name}</span>
                </div>
                <span className="text-[9px] font-bold text-destructive">{t.trapProbability}%</span>
              </div>
              <p className="text-[9px] text-muted-foreground">{t.reason}</p>
              <span className={`text-[8px] font-bold mt-1 inline-block ${
                t.manipulationRisk === "High" ? "text-destructive" : "text-accent"
              }`}>Manipulation Risk: {t.manipulationRisk}</span>
            </div>
          ))}

          {!suggestionsLoading && enriched.filter(e => e.trapFlag).length === 0 && (!suggestionsData?.trapList || suggestionsData.trapList.length === 0) && (
            <div className="glass-panel p-6 rounded-xl text-center">
              <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
              <p className="text-xs text-muted-foreground mt-2">No trap stocks detected currently</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
