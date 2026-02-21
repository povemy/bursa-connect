import { useState } from "react";
import { motion } from "framer-motion";

const stockData = {
  name: "INARI AMERTRON",
  code: "INARI • 0166",
  price: "RM 3.42",
  change: "+2.41%",
  time: "Real-time • 04:00 PM MYT",
  volume: "42.8M",
  fundamentals: [
    { label: "P/E Ratio", value: "18.45", note: "+5.2% vs Sector", color: "primary" },
    { label: "ROE", value: "22.6%", note: "High Outperformer", color: "primary" },
    { label: "Market Cap", value: "RM 10.2B", note: "Large Cap", color: "muted-foreground" },
    { label: "Inst. Holding", value: "64.2%", note: null, color: "primary", bar: 64 },
  ],
  ai: {
    confidence: 85,
    summary: "Institutional accumulation phase identified. High signal-to-noise ratio in volume patterns suggests sustained upward momentum post-semiconductor news.",
    outlook: [
      { term: "SHORT-TERM", signal: "BULLISH", positive: true },
      { term: "MID-TERM", signal: "NEUTRAL", positive: null },
      { term: "LONG-TERM", signal: "STRONG BUY", positive: true },
    ],
  },
  holders: [
    { name: "EPF", initials: "E", pct: "12.4%", value: "RM 1.26B", color: "bg-info" },
    { name: "PNB", initials: "P", pct: "8.1%", value: "RM 826M", color: "bg-primary/60" },
    { name: "KWAP", initials: "K", pct: "5.6%", value: "RM 571M", color: "bg-accent/60" },
  ],
};

const tabs = ["Overview", "Financials", "Ownership", "AI Insight"];

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [chartPeriod, setChartPeriod] = useState("1D");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Stock header */}
      <section className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-bold tracking-tight text-muted-foreground uppercase">{stockData.code}</p>
            <h1 className="text-lg font-bold">{stockData.name}</h1>
          </div>
          <div className="flex gap-2">
            <button className="text-primary"><span className="material-symbols-outlined">star</span></button>
            <button className="text-muted-foreground"><span className="material-symbols-outlined">ios_share</span></button>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tighter">{stockData.price}</span>
          <span className="text-primary font-semibold text-lg flex items-center">
            <span className="material-symbols-outlined text-sm mr-0.5">trending_up</span>
            {stockData.change}
          </span>
        </div>
        <p className="text-muted-foreground text-[10px] mt-1 font-medium uppercase tracking-widest">{stockData.time}</p>
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
            {["1D", "5D", "1M", "6M", "1Y", "ALL"].map((p) => (
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
          <svg className="w-full h-full" viewBox="0 0 400 200">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 160 Q 40 140, 80 150 T 160 110 T 240 120 T 320 60 T 400 40" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeWidth="3" />
            <path d="M0 160 Q 40 140, 80 150 T 160 110 T 240 120 T 320 60 T 400 40 V 200 H 0 Z" fill="url(#chartGrad)" />
            {/* Volume bars */}
            {[10,30,50,70,90,110,130,150,170,190].map((x, i) => (
              <rect key={i} x={x} y={170 - (i % 3 + 1) * 8} width="8" height={(i % 3 + 1) * 8 + 10} fill="hsl(var(--primary))" opacity="0.3" rx="1" />
            ))}
          </svg>
          <div className="absolute top-0 right-0 p-2 bg-background/80 rounded border border-glass-border">
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Volume</p>
            <p className="text-xs font-bold">{stockData.volume}</p>
          </div>
        </div>
      </section>

      {/* Fundamentals grid */}
      <section className="px-4 grid grid-cols-2 gap-3">
        {stockData.fundamentals.map((f) => (
          <div key={f.label} className="glass-panel rounded-xl p-4">
            <p className="text-muted-foreground text-xs font-bold uppercase mb-1">{f.label}</p>
            <p className="text-lg font-bold">{f.value}</p>
            {f.note && <p className={`text-[10px] text-${f.color} mt-1`}>{f.note}</p>}
            {f.bar && (
              <div className="w-full bg-secondary h-1 mt-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${f.bar}%` }} />
              </div>
            )}
          </div>
        ))}
      </section>

      {/* AI Insight Panel */}
      <section className="px-4 mt-8">
        <div className="gold-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-accent">cognition</span>
              <h3 className="text-sm font-bold tracking-tight uppercase">AI Forensic Intelligence</h3>
            </div>
            <div className="bg-accent/20 px-2 py-0.5 rounded">
              <span className="text-[10px] font-bold text-accent">PRO VIEW</span>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <div className="relative size-20 flex items-center justify-center shrink-0">
              <svg className="size-full" viewBox="0 0 36 36">
                <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="text-accent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${stockData.ai.confidence}, 100`} strokeLinecap="round" strokeWidth="3" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-bold leading-none">{stockData.ai.confidence}</span>
                <span className="text-[8px] font-medium text-muted-foreground uppercase">Conf.</span>
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground italic leading-relaxed">"{stockData.ai.summary}"</p>
          </div>

          <div className="space-y-2">
            {stockData.ai.outlook.map((o) => (
              <div key={o.term} className="flex items-center justify-between bg-secondary p-3 rounded-lg border border-glass-border">
                <span className="text-xs font-bold text-muted-foreground">{o.term}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  o.positive === true ? "bg-primary/10 text-primary" :
                  o.positive === false ? "bg-destructive/10 text-destructive" :
                  "bg-secondary text-muted-foreground"
                }`}>{o.signal}</span>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-muted-foreground mt-4 italic text-center">AI-generated analysis. Not financial advice.</p>
        </div>
      </section>

      {/* Institutional holders */}
      <section className="px-4 mt-8 pb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Top Institutional Holders</h3>
        <div className="space-y-2">
          {stockData.holders.map((h) => (
            <div key={h.name} className="glass-panel flex items-center justify-between p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`size-8 rounded-full ${h.color} flex items-center justify-center font-bold text-xs text-foreground`}>{h.initials}</div>
                <div>
                  <p className="text-sm font-bold">{h.name}</p>
                  <p className="text-[10px] text-muted-foreground">{h.pct} of Float</p>
                </div>
              </div>
              <p className="text-sm font-bold">{h.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Action bar */}
      <div className="fixed bottom-20 inset-x-0 glass-panel border-t border-glass-border py-3 px-6 z-30">
        <div className="flex items-center gap-3">
          <button className="flex-1 bg-secondary border border-glass-border hover:bg-muted transition-colors py-3 rounded-xl font-bold text-sm tracking-tight">
            ADD TO WATCHLIST
          </button>
          <button className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm tracking-tight shadow-lg glow-primary">
            VIEW FULL REPORT
          </button>
        </div>
      </div>
    </motion.div>
  );
}
