import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { bursaApi, formatChange, formatPrice } from "@/lib/api/bursa";

export default function AlertsPage() {
  const { data } = useQuery({
    queryKey: ['market-overview'],
    queryFn: () => bursaApi.getMarketOverview(),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const quotes = data?.quotes || [];
  const tickers = data?.tickers || [];

  // Generate alerts from real data
  const alerts: Array<{
    type: string; icon: string; title: string; stock: string;
    reason: string; time: string; confidence: string;
  }> = [];

  // Detect unusual volume spikes
  quotes.forEach(q => {
    const ticker = tickers.find(t => t.symbol === q.symbol);
    const name = ticker?.name || q.shortName || q.symbol;
    const volRatio = q.averageDailyVolume3Month ? q.regularMarketVolume / q.averageDailyVolume3Month : 0;

    if (volRatio > 2) {
      alerts.push({
        type: q.regularMarketChangePercent > 3 && volRatio > 3 ? "trap" : "hidden_radar",
        icon: volRatio > 3 ? "crisis_alert" : "radar",
        title: volRatio > 3 ? "Unusual Volume Spike Detected" : "Volume Activity Above Average",
        stock: `${name} (${q.symbol.replace('.KL', '')})`,
        reason: `Volume is ${volRatio.toFixed(1)}x average. Price ${formatChange(q.regularMarketChangePercent)}. Current: ${formatPrice(q.regularMarketPrice)}.`,
        time: "Today",
        confidence: volRatio > 3 ? "High" : "Medium",
      });
    }

    // Big movers
    if (Math.abs(q.regularMarketChangePercent) > 2.5) {
      alerts.push({
        type: q.regularMarketChangePercent > 0 ? "news" : "ownership",
        icon: q.regularMarketChangePercent > 0 ? "trending_up" : "trending_down",
        title: `Significant ${q.regularMarketChangePercent > 0 ? "Gain" : "Drop"} Detected`,
        stock: `${name} (${q.symbol.replace('.KL', '')})`,
        reason: `${formatChange(q.regularMarketChangePercent)} move. Price: ${formatPrice(q.regularMarketPrice)}. Sector: ${ticker?.sector || 'Unknown'}.`,
        time: "Today",
        confidence: Math.abs(q.regularMarketChangePercent) > 5 ? "High" : "Medium",
      });
    }
  });

  // Sort by confidence
  alerts.sort((a, b) => (a.confidence === "High" ? -1 : 1) - (b.confidence === "High" ? -1 : 1));

  const typeStyles: Record<string, { badge: string; label: string }> = {
    hidden_radar: { badge: "bg-primary/20 text-primary", label: "Volume Alert" },
    trap: { badge: "bg-destructive/20 text-destructive", label: "Spike Alert" },
    news: { badge: "bg-accent/20 text-accent", label: "Big Mover" },
    ownership: { badge: "bg-info/20 text-info", label: "Drop Alert" },
  };

  const trapCount = alerts.filter(a => a.type === "trap").length;
  const radarCount = alerts.filter(a => a.type === "hidden_radar").length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold">Alert Center</h1>
        <span className="text-[10px] text-muted-foreground">{alerts.length} alerts today</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-lg">radar</span>
            <span className="text-xs font-bold text-primary">Volume Alerts</span>
          </div>
          <p className="text-2xl font-bold">{radarCount}</p>
          <p className="text-[10px] text-muted-foreground">Above average volume</p>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-destructive text-lg">crisis_alert</span>
            <span className="text-xs font-bold text-destructive">Spike Alerts</span>
          </div>
          <p className="text-2xl font-bold">{trapCount}</p>
          <p className="text-[10px] text-muted-foreground">Unusual volume + price spikes</p>
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-3 pb-4">
        {alerts.length === 0 && (
          <div className="glass-panel p-6 rounded-xl text-center">
            <span className="material-symbols-outlined text-muted-foreground text-3xl">notifications_off</span>
            <p className="text-sm text-muted-foreground mt-2">No alerts detected. Market is calm.</p>
          </div>
        )}
        {alerts.slice(0, 15).map((alert, i) => {
          const style = typeStyles[alert.type] || typeStyles.news;
          return (
            <div key={i} className="glass-panel p-4 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-lg ${style.badge.split(" ")[1]}`}>{alert.icon}</span>
                  <span className={`${style.badge} text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest`}>{style.label}</span>
                </div>
                <span className="text-muted-foreground text-[10px]">{alert.time}</span>
              </div>
              <h3 className="text-sm font-semibold mb-1">{alert.title}</h3>
              <p className="text-primary text-xs font-mono mb-2">{alert.stock}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{alert.reason}</p>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-[10px] font-bold ${
                  alert.confidence === "High" ? "text-primary" : "text-accent"
                }`}>Signal: {alert.confidence}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
