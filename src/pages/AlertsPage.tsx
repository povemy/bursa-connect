import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { bursaApi, formatChange, formatPrice, classifyCap } from "@/lib/api/bursa";

type AlertTab = "all" | "risk" | "volume" | "macro";

export default function AlertsPage() {
  const [tab, setTab] = useState<AlertTab>("all");

  const { data } = useQuery({
    queryKey: ['market-overview'],
    queryFn: () => bursaApi.getMarketOverview(),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: macroData } = useQuery({
    queryKey: ['macro-analysis'],
    queryFn: () => bursaApi.getMacroAnalysis(),
    staleTime: 600000,
    retry: 1,
  });

  const quotes = data?.quotes || [];
  const tickers = data?.tickers || [];

  // Generate alerts from real data - look at ALL stocks holistically
  type Alert = {
    type: "volume" | "risk" | "mover" | "macro";
    icon: string;
    title: string;
    stock: string;
    symbol: string;
    reason: string;
    confidence: string;
    riskLevel: string;
  };

  const alerts: Alert[] = [];

  quotes.forEach(q => {
    const ticker = tickers.find(t => t.symbol === q.symbol);
    const name = ticker?.name || q.shortName || q.symbol;
    const volRatio = q.averageDailyVolume3Month ? q.regularMarketVolume / q.averageDailyVolume3Month : 0;
    const changePct = q.regularMarketChangePercent;

    // Volume anomaly detection
    if (volRatio > 2) {
      const isManipulationRisk = volRatio > 4 && Math.abs(changePct) > 5;
      alerts.push({
        type: "volume",
        icon: volRatio > 3 ? "crisis_alert" : "radar",
        title: volRatio > 3 ? "Unusual Volume Spike" : "Above Average Volume",
        stock: `${name} (${q.symbol.replace('.KL', '')})`,
        symbol: q.symbol,
        reason: `Volume ${volRatio.toFixed(1)}x average. ${formatChange(changePct)} at ${formatPrice(q.regularMarketPrice)}.${
          isManipulationRisk ? " ⚠ Possible manipulation pattern." : ""
        }`,
        confidence: volRatio > 3 ? "High" : "Medium",
        riskLevel: isManipulationRisk ? "High" : volRatio > 3 ? "Medium" : "Low",
      });
    }

    // Risk alerts: significant price moves
    if (Math.abs(changePct) > 2.5) {
      alerts.push({
        type: "risk",
        icon: changePct > 0 ? "trending_up" : "trending_down",
        title: `${Math.abs(changePct) > 5 ? "Major" : "Significant"} ${changePct > 0 ? "Gain" : "Drop"}`,
        stock: `${name} (${q.symbol.replace('.KL', '')})`,
        symbol: q.symbol,
        reason: `${formatChange(changePct)} movement. Sector: ${ticker?.sector || "Unknown"}. Cap: ${ticker?.cap || classifyCap(q.marketCap)}.`,
        confidence: Math.abs(changePct) > 5 ? "High" : "Medium",
        riskLevel: Math.abs(changePct) > 5 ? "High" : "Medium",
      });
    }

    // Broad market movers: detect underrated structural signals
    if (volRatio > 1.2 && volRatio < 2 && changePct > 0 && changePct < 3) {
      alerts.push({
        type: "mover",
        icon: "visibility",
        title: "Quiet Accumulation Signal",
        stock: `${name} (${q.symbol.replace('.KL', '')})`,
        symbol: q.symbol,
        reason: `Modest ${formatChange(changePct)} gain with ${volRatio.toFixed(1)}x volume. Could indicate institutional interest.`,
        confidence: "Low",
        riskLevel: "Low",
      });
    }
  });

  // Add macro alerts
  if (macroData?.factors) {
    macroData.factors.forEach((f: any) => {
      if (f.impactStrength > 50) {
        alerts.push({
          type: "macro",
          icon: f.direction === "Bullish" ? "trending_up" : f.direction === "Bearish" ? "trending_down" : "swap_horiz",
          title: `Macro: ${f.factor}`,
          stock: f.sectorExposure?.join(", ") || "All sectors",
          symbol: "",
          reason: f.summary,
          confidence: f.impactStrength > 70 ? "High" : "Medium",
          riskLevel: f.direction === "Bearish" ? "High" : "Medium",
        });
      }
    });
  }

  // Sort: High confidence first
  alerts.sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 };
    return (order[a.confidence as keyof typeof order] || 2) - (order[b.confidence as keyof typeof order] || 2);
  });

  const filteredAlerts = tab === "all" ? alerts : alerts.filter(a => a.type === tab);

  const typeStyles: Record<string, { badge: string; label: string }> = {
    volume: { badge: "bg-primary/20 text-primary", label: "Volume" },
    risk: { badge: "bg-destructive/20 text-destructive", label: "Risk" },
    mover: { badge: "bg-accent/20 text-accent", label: "Signal" },
    macro: { badge: "bg-info/20 text-info", label: "Macro" },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">Risk Radar & Alerts</h1>
        <span className="text-[10px] text-muted-foreground">{alerts.length} signals</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { count: alerts.filter(a => a.type === "volume").length, label: "Volume", color: "text-primary", icon: "radar" },
          { count: alerts.filter(a => a.type === "risk").length, label: "Risk", color: "text-destructive", icon: "shield" },
          { count: alerts.filter(a => a.type === "mover").length, label: "Signals", color: "text-accent", icon: "visibility" },
          { count: alerts.filter(a => a.type === "macro").length, label: "Macro", color: "text-info", icon: "public" },
        ].map(s => (
          <div key={s.label} className="glass-panel p-2.5 rounded-xl text-center">
            <span className={`material-symbols-outlined ${s.color} text-lg`}>{s.icon}</span>
            <p className="text-lg font-bold">{s.count}</p>
            <p className="text-[8px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab filter */}
      <div className="flex gap-1 mb-4 bg-secondary rounded-lg p-1">
        {([
          { key: "all", label: `All (${alerts.length})` },
          { key: "volume", label: "Volume" },
          { key: "risk", label: "Risk" },
          { key: "macro", label: "Macro" },
        ] as { key: AlertTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-2 pb-4">
        {filteredAlerts.length === 0 && (
          <div className="glass-panel p-6 rounded-xl text-center">
            <span className="material-symbols-outlined text-muted-foreground text-3xl">notifications_off</span>
            <p className="text-sm text-muted-foreground mt-2">No alerts in this category</p>
          </div>
        )}
        {filteredAlerts.slice(0, 20).map((alert, i) => {
          const style = typeStyles[alert.type] || typeStyles.risk;
          const content = (
            <div className="glass-panel p-3 rounded-xl">
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm ${style.badge.split(" ")[1]}`}>{alert.icon}</span>
                  <span className={`${style.badge} text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest`}>{style.label}</span>
                  <span className={`text-[8px] font-bold ${
                    alert.riskLevel === "High" ? "text-destructive" : alert.riskLevel === "Medium" ? "text-accent" : "text-muted-foreground"
                  }`}>{alert.riskLevel}</span>
                </div>
                <span className={`text-[9px] font-bold ${alert.confidence === "High" ? "text-primary" : "text-muted-foreground"}`}>
                  {alert.confidence}
                </span>
              </div>
              <h3 className="text-xs font-semibold mb-0.5">{alert.title}</h3>
              <p className="text-primary text-[10px] font-mono mb-1">{alert.stock}</p>
              <p className="text-[9px] text-muted-foreground leading-relaxed">{alert.reason}</p>
            </div>
          );

          return alert.symbol ? (
            <Link key={i} to={`/analysis?stock=${encodeURIComponent(alert.symbol)}`} className="block">{content}</Link>
          ) : (
            <div key={i}>{content}</div>
          );
        })}
      </div>
    </motion.div>
  );
}
