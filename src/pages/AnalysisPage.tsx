import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { bursaApi, formatPrice, formatChange } from "@/lib/api/bursa";

const CHART_RANGES: Record<string, { interval: string; range: string }> = {
  "1D": { interval: "5m", range: "1d" },
  "5D": { interval: "15m", range: "5d" },
  "1M": { interval: "1d", range: "1mo" },
  "6M": { interval: "1d", range: "6mo" },
  "1Y": { interval: "1wk", range: "1y" },
  "ALL": { interval: "1mo", range: "max" },
};

const tabs = ["Overview", "Financials", "Ownership", "AI Insight"];

export default function AnalysisPage() {
  const [searchParams] = useSearchParams();
  const stockSymbol = searchParams.get("stock") || "1155.KL";
  const [activeTab, setActiveTab] = useState("Overview");
  const [chartPeriod, setChartPeriod] = useState("1D");

  const { data, isLoading, error } = useQuery({
    queryKey: ['stock-detail', stockSymbol, chartPeriod],
    queryFn: () => bursaApi.getStockDetail(stockSymbol),
    staleTime: 30000,
  });

  const quote = data?.quote;
  const chartData = data?.chart;
  const tickerInfo = data?.tickerInfo;

  // Process chart data for SVG
  const chartPoints = chartData?.timestamps?.map((ts: number, i: number) => ({
    time: ts,
    close: chartData.quotes?.close?.[i],
    volume: chartData.quotes?.volume?.[i],
  })).filter((p: any) => p.close != null) || [];

  // Generate SVG path from chart points
  const generatePath = () => {
    if (chartPoints.length < 2) return "";
    const minY = Math.min(...chartPoints.map((p: any) => p.close));
    const maxY = Math.max(...chartPoints.map((p: any) => p.close));
    const yRange = maxY - minY || 1;
    
    return chartPoints.map((p: any, i: number) => {
      const x = (i / (chartPoints.length - 1)) * 400;
      const y = 180 - ((p.close - minY) / yRange) * 160;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const generateAreaPath = () => {
    const linePath = generatePath();
    if (!linePath) return "";
    return `${linePath} V 200 H 0 Z`;
  };

  const isPositive = (quote?.regularMarketChangePercent || 0) >= 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Stock header */}
      <section className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-bold tracking-tight text-muted-foreground uppercase">
              {tickerInfo?.name || quote?.shortName || stockSymbol} • {stockSymbol.replace('.KL', '')}
            </p>
            <h1 className="text-lg font-bold">{quote?.shortName || tickerInfo?.name || stockSymbol}</h1>
          </div>
          <div className="flex gap-2">
            <button className="text-primary"><span className="material-symbols-outlined">star</span></button>
            <button className="text-muted-foreground"><span className="material-symbols-outlined">ios_share</span></button>
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-muted-foreground">Loading...</span>
          </div>
        ) : quote ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tighter">{formatPrice(quote.regularMarketPrice)}</span>
              <span className={`font-semibold text-lg flex items-center ${isPositive ? "text-primary" : "text-destructive"}`}>
                <span className="material-symbols-outlined text-sm mr-0.5">
                  {isPositive ? "trending_up" : "trending_down"}
                </span>
                {formatChange(quote.regularMarketChangePercent)}
              </span>
            </div>
            <p className="text-muted-foreground text-[10px] mt-1 font-medium uppercase tracking-widest">
              Delayed • {quote.currency || "MYR"} • Bursa Malaysia
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">No data available for {stockSymbol}</p>
        )}
      </section>

      {/* Tabs */}
      <nav className="flex border-b border-glass-border px-4 mt-2 overflow-x-auto hide-scrollbar">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`py-3 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t ? "border-b-2 border-primary text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* Chart */}
      <section className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-secondary rounded-lg p-1">
            {Object.keys(CHART_RANGES).map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  chartPeriod === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="relative h-52 w-full mb-4">
          {chartPoints.length > 1 ? (
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))"} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={isPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))"} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={generatePath()} fill="none" stroke={isPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))"} strokeLinecap="round" strokeWidth="2" />
              <path d={generateAreaPath()} fill="url(#chartGrad)" />
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {isLoading ? "Loading chart..." : "No chart data"}
            </div>
          )}
          {quote?.regularMarketVolume && (
            <div className="absolute top-0 right-0 p-2 bg-background/80 rounded border border-glass-border">
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Volume</p>
              <p className="text-xs font-bold">{(quote.regularMarketVolume / 1_000_000).toFixed(1)}M</p>
            </div>
          )}
        </div>
      </section>

      {/* Fundamentals grid */}
      <section className="px-4 grid grid-cols-2 gap-3">
        <div className="glass-panel rounded-xl p-4">
          <p className="text-muted-foreground text-xs font-bold uppercase mb-1">52W High</p>
          <p className="text-lg font-bold">{formatPrice(quote?.fiftyTwoWeekHigh)}</p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <p className="text-muted-foreground text-xs font-bold uppercase mb-1">52W Low</p>
          <p className="text-lg font-bold">{formatPrice(quote?.fiftyTwoWeekLow)}</p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <p className="text-muted-foreground text-xs font-bold uppercase mb-1">Volume</p>
          <p className="text-lg font-bold">{quote?.regularMarketVolume ? (quote.regularMarketVolume / 1_000_000).toFixed(1) + "M" : "N/A"}</p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <p className="text-muted-foreground text-xs font-bold uppercase mb-1">Sector</p>
          <p className="text-lg font-bold">{tickerInfo?.sector || "N/A"}</p>
        </div>
      </section>

      {/* AI Disclaimer */}
      <section className="px-4 mt-8 pb-28">
        <div className="glass-panel rounded-xl p-5 border border-glass-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-accent">info</span>
            <h3 className="text-sm font-bold tracking-tight uppercase">Data Source</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Stock data sourced from Yahoo Finance (delayed ~15 minutes). All prices in {quote?.currency || "MYR"}.
            This is not financial advice. Always do your own research before making investment decisions.
          </p>
        </div>
      </section>
    </motion.div>
  );
}
