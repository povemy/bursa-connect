import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { bursaApi, formatPrice, formatChange, type StockAnalysis, type AnalysisCard, type QFEAnalysis } from "@/lib/api/bursa";

const CHART_RANGES: Record<string, { interval: string; range: string }> = {
  "1D": { interval: "5m", range: "1d" },
  "5D": { interval: "15m", range: "5d" },
  "1M": { interval: "1d", range: "1mo" },
  "6M": { interval: "1d", range: "6mo" },
  "1Y": { interval: "1wk", range: "1y" },
};

const tabs = ["Overview", "AI Insight", "Risk Radar", "QFE", "Macro"];

function ScoreBar({ value, color = "primary" }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          color === "destructive" ? "bg-destructive" : color === "accent" ? "bg-accent" : "bg-primary"
        }`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function AnalysisCardComponent({ card }: { card: AnalysisCard }) {
  const iconName = card.icon === "positive" ? "check_circle" : card.icon === "negative" ? "cancel" : "warning";
  const iconColor = card.icon === "positive" ? "text-primary" : card.icon === "negative" ? "text-destructive" : "text-accent";
  const barColor = card.icon === "positive" ? "primary" : card.icon === "negative" ? "destructive" : "accent";

  return (
    <div className="glass-panel p-3 rounded-xl">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`material-symbols-outlined text-sm ${iconColor}`}>{iconName}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider">{card.category}</span>
        <span className={`ml-auto text-[10px] font-bold ${iconColor}`}>{card.probability}%</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{card.summary}</p>
      <ScoreBar value={card.probability} color={barColor} />
    </div>
  );
}

function QFESection({ qfe, isLoading, stockName }: { qfe: QFEAnalysis | null; isLoading: boolean; stockName: string }) {
  if (isLoading) {
    return (
      <div className="glass-panel p-6 rounded-xl text-center">
        <span className="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span>
        <p className="text-xs text-muted-foreground mt-2">Quant Fusion Engine analyzing {stockName}...</p>
        <p className="text-[9px] text-muted-foreground mt-1">Running multi-model consensus validation</p>
      </div>
    );
  }

  if (!qfe) {
    return (
      <div className="glass-panel p-6 rounded-xl text-center">
        <span className="material-symbols-outlined text-muted-foreground text-2xl">psychology</span>
        <p className="text-xs text-muted-foreground mt-2">Select a stock to run QFE analysis</p>
      </div>
    );
  }

  const convictionColor = qfe.convictionScore >= 70 ? "text-primary" : qfe.convictionScore >= 40 ? "text-accent" : "text-destructive";
  const classColor = qfe.setupClassification === "High Probability" ? "bg-primary/20 text-primary" :
    qfe.setupClassification === "Moderate" ? "bg-accent/20 text-accent" :
    "bg-destructive/20 text-destructive";

  return (
    <div className="space-y-3">
      {/* Final Conviction Card */}
      <div className="glass-panel p-3 rounded-xl border-l-4 border-primary">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider">🔥 Final Conviction</span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${classColor}`}>{qfe.setupClassification}</span>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div>
            <span className="text-[8px] text-muted-foreground">Score</span>
            <p className={`text-2xl font-bold ${convictionColor}`}>{qfe.convictionScore}%</p>
          </div>
          <div>
            <span className="text-[8px] text-muted-foreground">Weight Profile</span>
            <p className="text-xs font-bold">{qfe.weightProfile}</p>
          </div>
        </div>
        <ScoreBar value={qfe.convictionScore} color={qfe.convictionScore >= 70 ? "primary" : qfe.convictionScore >= 40 ? "accent" : "destructive"} />
      </div>

      {/* Trade Setup Card */}
      <div className="glass-panel p-3 rounded-xl">
        <span className="text-[10px] font-bold uppercase tracking-wider mb-2 block">📊 Trade Setup</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary p-2 rounded-lg">
            <p className="text-[8px] text-muted-foreground">Target Zone</p>
            <p className="text-xs font-bold text-primary">
              RM {qfe.targetZone?.low?.toFixed(2)} – {qfe.targetZone?.high?.toFixed(2)}
            </p>
            <p className="text-[8px] text-muted-foreground">Hit Prob: {qfe.targetZone?.probability}%</p>
          </div>
          <div className="bg-secondary p-2 rounded-lg">
            <p className="text-[8px] text-muted-foreground">Stop Loss Zone</p>
            <p className="text-xs font-bold text-destructive">
              RM {qfe.stopLossZone?.low?.toFixed(2)} – {qfe.stopLossZone?.high?.toFixed(2)}
            </p>
          </div>
          <div className="bg-secondary p-2 rounded-lg">
            <p className="text-[8px] text-muted-foreground">Est. Days</p>
            <p className="text-xs font-bold">{qfe.estimatedDays?.min}–{qfe.estimatedDays?.max} days</p>
          </div>
          <div className="bg-secondary p-2 rounded-lg">
            <p className="text-[8px] text-muted-foreground">Decay Half-Life</p>
            <p className="text-xs font-bold">{qfe.convictionDecay?.halfLifeDays} days</p>
          </div>
        </div>
      </div>

      {/* Signal Consensus Card */}
      <div className="glass-panel p-3 rounded-xl">
        <span className="text-[10px] font-bold uppercase tracking-wider mb-2 block">🧠 Signal Consensus</span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Trend", data: qfe.signalConsensus?.trendModel },
            { label: "Breakout", data: qfe.signalConsensus?.breakoutModel },
            { label: "Mean Rev", data: qfe.signalConsensus?.meanReversionModel },
          ].map(m => {
            const icon = m.data?.signal === "Bullish" ? "check_circle" : m.data?.signal === "Bearish" ? "cancel" : "warning";
            const color = m.data?.signal === "Bullish" ? "text-primary" : m.data?.signal === "Bearish" ? "text-destructive" : "text-accent";
            return (
              <div key={m.label} className="bg-secondary p-2 rounded-lg text-center">
                <span className={`material-symbols-outlined text-sm ${color}`}>{icon}</span>
                <p className="text-[9px] font-bold mt-0.5">{m.label}</p>
                <p className={`text-[8px] font-bold ${color}`}>{m.data?.score}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scenario Probability Card */}
      <div className="glass-panel p-3 rounded-xl">
        <span className="text-[10px] font-bold uppercase tracking-wider mb-2 block">📉 Scenario Probability</span>
        <div className="space-y-2">
          {[
            { label: "Bull Case", value: qfe.scenarioProbability?.bull, color: "primary" },
            { label: "Base Case", value: qfe.scenarioProbability?.base, color: "accent" },
            { label: "Bear Case", value: qfe.scenarioProbability?.bear, color: "destructive" },
          ].map(s => (
            <div key={s.label}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold">{s.label}</span>
                <span className={`text-[10px] font-bold text-${s.color}`}>{s.value}%</span>
              </div>
              <ScoreBar value={s.value || 0} color={s.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Conflict Signals */}
      {qfe.conflictSignals && qfe.conflictSignals.length > 0 && (
        <div className="glass-panel p-3 rounded-xl border-l-4 border-accent">
          <span className="text-[10px] font-bold uppercase tracking-wider mb-2 block">⚠ Conflict Signals</span>
          {qfe.conflictSignals.map((c, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <span className="text-[8px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">{c.intensity}%</span>
              <span className="text-[9px] text-muted-foreground">{c.pair}: {c.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Risk Factors + Retail */}
      <div className="glass-panel p-3 rounded-xl">
        <span className="text-[10px] font-bold uppercase tracking-wider mb-2 block">⚠ Risk & Retail</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary p-2 rounded-lg">
            <p className="text-[8px] text-muted-foreground">Trap Prob</p>
            <p className={`text-xs font-bold ${(qfe.riskFactors?.trapProbability || 0) > 30 ? "text-destructive" : "text-primary"}`}>
              {qfe.riskFactors?.trapProbability}%
            </p>
          </div>
          <div className="bg-secondary p-2 rounded-lg">
            <p className="text-[8px] text-muted-foreground">Liquidity</p>
            <p className="text-xs font-bold">{qfe.riskFactors?.liquidityRisk}</p>
          </div>
          <div className="bg-secondary p-2 rounded-lg">
            <p className="text-[8px] text-muted-foreground">Slippage Risk</p>
            <p className="text-xs font-bold">{qfe.retailAdaptation?.slippageRisk}%</p>
          </div>
          <div className="bg-secondary p-2 rounded-lg">
            <p className="text-[8px] text-muted-foreground">Volatility</p>
            <p className="text-xs font-bold">{qfe.riskFactors?.volatilityRegime}</p>
          </div>
        </div>
      </div>

      {/* Key Drivers */}
      {qfe.keyDrivers && qfe.keyDrivers.length > 0 && (
        <div className="glass-panel p-3 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider mb-2 block">Key Drivers</span>
          {qfe.keyDrivers.map((d, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span className="text-primary text-[10px]">•</span>
              <span className="text-[10px] text-muted-foreground">{d}</span>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-accent/10 p-2 rounded-lg">
        <p className="text-[8px] text-accent">{qfe.disclaimer || "Probabilistic analysis only. Not financial advice."}</p>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const [searchParams] = useSearchParams();
  const stockSymbol = searchParams.get("stock") || "1155.KL";
  const [activeTab, setActiveTab] = useState("Overview");
  const [chartPeriod, setChartPeriod] = useState("1D");

  const { data, isLoading } = useQuery({
    queryKey: ['stock-detail', stockSymbol, chartPeriod],
    queryFn: () => bursaApi.getStockDetail(stockSymbol),
    staleTime: 30000,
  });

  const quote = data?.quote;
  const chartData = data?.chart;
  const tickerInfo = data?.tickerInfo;

  // AI Analysis
  const { data: aiAnalysis, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-analysis', stockSymbol],
    queryFn: () => bursaApi.analyzeStock({
      symbol: stockSymbol,
      price: quote?.regularMarketPrice,
      change: quote?.regularMarketChangePercent,
      volume: quote?.regularMarketVolume,
      high52: quote?.fiftyTwoWeekHigh,
      low52: quote?.fiftyTwoWeekLow,
      sector: tickerInfo?.sector,
      name: tickerInfo?.name || quote?.shortName,
    }),
    enabled: !!quote,
    staleTime: 300000,
    retry: 1,
  });

  // QFE Analysis
  const { data: qfeAnalysis, isLoading: qfeLoading } = useQuery({
    queryKey: ['qfe-analysis', stockSymbol],
    queryFn: () => bursaApi.getQFEAnalysis({
      symbol: stockSymbol,
      price: quote?.regularMarketPrice,
      change: quote?.regularMarketChangePercent,
      volume: quote?.regularMarketVolume,
      high52: quote?.fiftyTwoWeekHigh,
      low52: quote?.fiftyTwoWeekLow,
      sector: tickerInfo?.sector,
      name: tickerInfo?.name || quote?.shortName,
      marketCap: quote?.marketCap,
    }),
    enabled: !!quote && activeTab === "QFE",
    staleTime: 300000,
    retry: 1,
  });

  // Macro analysis (with stock data for tags)
  const { data: macroData, isLoading: macroLoading } = useQuery({
    queryKey: ['macro-analysis'],
    queryFn: () => bursaApi.getMacroAnalysis(),
    staleTime: 600000,
    retry: 1,
  });

  // Chart SVG
  const chartPoints = chartData?.timestamps?.map((ts: number, i: number) => ({
    time: ts,
    close: chartData.quotes?.close?.[i],
    volume: chartData.quotes?.volume?.[i],
  })).filter((p: any) => p.close != null) || [];

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
            <p className="text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
              {tickerInfo?.name || quote?.shortName || stockSymbol} • {stockSymbol.replace('.KL', '')}
            </p>
            <h1 className="text-lg font-bold">{quote?.shortName || tickerInfo?.name || stockSymbol}</h1>
          </div>
          <div className="flex gap-2">
            {aiAnalysis && (
              <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                aiAnalysis.suggestedBias === "Conditional Buy" ? "bg-primary/20 text-primary" :
                aiAnalysis.suggestedBias === "Sell" ? "bg-destructive/20 text-destructive" :
                "bg-accent/20 text-accent"
              }`}>
                {aiAnalysis.suggestedBias}
              </span>
            )}
          </div>
        </div>
        {isLoading ? (
          <span className="text-2xl font-bold text-muted-foreground">Loading...</span>
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
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground text-[9px] font-medium uppercase tracking-widest">
                Delayed • {quote.currency || "MYR"} • Bursa
              </p>
              {aiAnalysis && (
                <span className="text-[9px] font-bold text-primary">
                  Score: {aiAnalysis.opportunityScore}% | Conf: {aiAnalysis.confidence}%
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">No data for {stockSymbol}</p>
        )}
      </section>

      {/* Tabs */}
      <nav className="flex border-b border-glass-border px-4 mt-2 overflow-x-auto hide-scrollbar">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`py-2.5 px-3 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === t ? "border-b-2 border-primary text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      {activeTab === "Overview" && (
        <>
          {/* Chart */}
          <section className="px-4 py-4">
            <div className="flex bg-secondary rounded-lg p-1 mb-3">
              {Object.keys(CHART_RANGES).map((p) => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                    chartPeriod === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}>{p}</button>
              ))}
            </div>
            <div className="relative h-44 w-full">
              {chartPoints.length > 1 ? (
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))"} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={isPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))"} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={generatePath()} fill="none" stroke={isPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))"} strokeWidth="2" strokeLinecap="round" />
                  <path d={generateAreaPath()} fill="url(#cg)" />
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                  {isLoading ? "Loading chart..." : "No chart data"}
                </div>
              )}
            </div>
          </section>

          {/* Fundamentals grid */}
          <section className="px-4 grid grid-cols-2 gap-2 pb-4">
            <div className="glass-panel rounded-xl p-3">
              <p className="text-muted-foreground text-[9px] font-bold uppercase mb-0.5">52W High</p>
              <p className="text-sm font-bold">{formatPrice(quote?.fiftyTwoWeekHigh)}</p>
            </div>
            <div className="glass-panel rounded-xl p-3">
              <p className="text-muted-foreground text-[9px] font-bold uppercase mb-0.5">52W Low</p>
              <p className="text-sm font-bold">{formatPrice(quote?.fiftyTwoWeekLow)}</p>
            </div>
            <div className="glass-panel rounded-xl p-3">
              <p className="text-muted-foreground text-[9px] font-bold uppercase mb-0.5">Volume</p>
              <p className="text-sm font-bold">{quote?.regularMarketVolume ? (quote.regularMarketVolume / 1_000_000).toFixed(1) + "M" : "N/A"}</p>
            </div>
            <div className="glass-panel rounded-xl p-3">
              <p className="text-muted-foreground text-[9px] font-bold uppercase mb-0.5">Sector</p>
              <p className="text-sm font-bold">{tickerInfo?.sector || "N/A"}</p>
            </div>
          </section>
        </>
      )}

      {activeTab === "AI Insight" && (
        <section className="px-4 py-4 space-y-3">
          {aiLoading && (
            <div className="glass-panel p-6 rounded-xl text-center">
              <span className="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span>
              <p className="text-xs text-muted-foreground mt-2">AI is analyzing {tickerInfo?.name || stockSymbol}...</p>
            </div>
          )}

          {aiAnalysis && !aiLoading && (
            <>
              <div className="glass-panel p-3 rounded-xl border-l-4 border-primary">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">AI Assessment</span>
                  <div className="flex items-center gap-2">
                    {aiAnalysis.hiddenRadar && (
                      <span className="text-[8px] font-bold bg-accent/20 text-accent px-1.5 py-0.5 rounded">HIDDEN RADAR</span>
                    )}
                    {aiAnalysis.trapFlag && (
                      <span className="text-[8px] font-bold bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">TRAP FLAG</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{aiAnalysis.keyReason}</p>
                <div className="flex gap-3 mt-2">
                  <div>
                    <span className="text-[8px] text-muted-foreground">Score</span>
                    <p className="text-sm font-bold text-primary">{aiAnalysis.opportunityScore}%</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-muted-foreground">Positive Prob</span>
                    <p className="text-sm font-bold">{aiAnalysis.probabilityPositive}%</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-muted-foreground">Risk</span>
                    <p className={`text-sm font-bold ${aiAnalysis.riskLevel === "High" ? "text-destructive" : aiAnalysis.riskLevel === "Medium" ? "text-accent" : "text-primary"}`}>
                      {aiAnalysis.riskLevel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {aiAnalysis.cards?.map((card, i) => (
                  <AnalysisCardComponent key={i} card={card} />
                ))}
              </div>
            </>
          )}

          {!aiAnalysis && !aiLoading && (
            <div className="glass-panel p-6 rounded-xl text-center">
              <span className="material-symbols-outlined text-muted-foreground text-2xl">psychology</span>
              <p className="text-xs text-muted-foreground mt-2">Select a stock to see AI analysis</p>
            </div>
          )}
        </section>
      )}

      {activeTab === "Risk Radar" && (
        <section className="px-4 py-4 space-y-3">
          {aiLoading && (
            <div className="glass-panel p-6 rounded-xl text-center">
              <span className="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span>
              <p className="text-xs text-muted-foreground mt-2">Calculating risk metrics...</p>
            </div>
          )}

          {aiAnalysis?.riskMetrics && (
            <>
              <div className="glass-panel p-3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Risk Trend</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    aiAnalysis.riskMetrics.riskTrend === "Improving" ? "bg-primary/20 text-primary" :
                    aiAnalysis.riskMetrics.riskTrend === "Deteriorating" ? "bg-destructive/20 text-destructive" :
                    "bg-accent/20 text-accent"
                  }`}>{aiAnalysis.riskMetrics.riskTrend}</span>
                </div>
              </div>

              {Object.entries(aiAnalysis.riskMetrics).filter(([k]) => k !== "riskTrend").map(([key, value]) => (
                <div key={key} className="glass-panel p-3 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className={`text-xs font-bold ${
                      (value as number) > 70 ? "text-destructive" : (value as number) > 40 ? "text-accent" : "text-primary"
                    }`}>{value as number}%</span>
                  </div>
                  <ScoreBar
                    value={value as number}
                    color={(value as number) > 70 ? "destructive" : (value as number) > 40 ? "accent" : "primary"}
                  />
                </div>
              ))}
            </>
          )}
        </section>
      )}

      {activeTab === "QFE" && (
        <section className="px-4 py-4">
          <QFESection qfe={qfeAnalysis || null} isLoading={qfeLoading} stockName={tickerInfo?.name || stockSymbol} />
        </section>
      )}

      {activeTab === "Macro" && (
        <section className="px-4 py-4 space-y-3">
          {macroLoading && (
            <div className="glass-panel p-6 rounded-xl text-center">
              <span className="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span>
              <p className="text-xs text-muted-foreground mt-2">Analyzing global macro factors...</p>
            </div>
          )}

          {macroData && !macroLoading && (
            <>
              <div className="glass-panel p-3 rounded-xl border-l-4 border-accent">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Macro Outlook</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    macroData.overallBias === "Bullish" ? "bg-primary/20 text-primary" :
                    macroData.overallBias === "Bearish" ? "bg-destructive/20 text-destructive" :
                    "bg-accent/20 text-accent"
                  }`}>{macroData.overallBias}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{macroData.overallSummary}</p>
              </div>

              {macroData.factors?.map((f: any, i: number) => (
                <div key={i} className="glass-panel p-3 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{f.factor}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        f.direction === "Bullish" ? "bg-primary/20 text-primary" :
                        f.direction === "Bearish" ? "bg-destructive/20 text-destructive" :
                        "bg-accent/20 text-accent"
                      }`}>{f.direction}</span>
                      <span className="text-[8px] font-bold">Impact: {f.impactStrength}%</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground mb-1.5">{f.summary}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] text-muted-foreground">
                      Sectors: {f.sectorExposure?.join(", ")}
                    </span>
                  </div>
                  <ScoreBar value={f.impactStrength} color={f.direction === "Bearish" ? "destructive" : "primary"} />

                  {/* Affected Stock Tags */}
                  {f.affectedStocks && f.affectedStocks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-glass-border">
                      {f.affectedStocks.slice(0, 8).map((s: any, j: number) => (
                        <Link
                          key={j}
                          to={`/analysis?stock=${encodeURIComponent(s.symbol)}`}
                          className={`text-[8px] font-bold px-2 py-0.5 rounded-full border transition-colors hover:opacity-80 ${
                            s.exposureDirection === "Bullish"
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-destructive/10 text-destructive border-destructive/30"
                          }`}
                        >
                          {s.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </section>
      )}

      {/* Disclaimer */}
      <section className="px-4 mt-4 pb-28">
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-accent text-sm">info</span>
            <h3 className="text-[10px] font-bold uppercase tracking-tight">Data Source</h3>
          </div>
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            Market data from Yahoo Finance (delayed ~15 min). AI analysis powered by Lovable AI. QFE is probabilistic only. Not financial advice.
          </p>
        </div>
      </section>
    </motion.div>
  );
}
