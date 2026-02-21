import { motion } from "framer-motion";

const alerts = [
  {
    type: "hidden_radar",
    icon: "radar",
    title: "Hidden Structural Beneficiary Detected",
    stock: "FRONTKN (0128)",
    reason: "Effective exposure 18.4% to semiconductor news via INARI ownership chain. Price reaction: +0.8% vs direct impact +8.5%.",
    time: "5m ago",
    confidence: "High",
  },
  {
    type: "trap",
    icon: "crisis_alert",
    title: "Pump Pattern Detected",
    stock: "SCIB (9237)",
    reason: "Volume spike 7.2x average. No supporting news. Penny classification. Repeated pattern detected 3x in 30 days.",
    time: "12m ago",
    confidence: "High",
  },
  {
    type: "news",
    icon: "newspaper",
    title: "High Impact News — Semiconductor",
    stock: "INARI (0166), UNISEM (5005), MPI (3867)",
    reason: "Supply chain disruption affecting SE Asia semiconductor sector. Direct impact classification.",
    time: "15m ago",
    confidence: "Medium",
  },
  {
    type: "ownership",
    icon: "swap_horiz",
    title: "Substantial Shareholder Change",
    stock: "IOI CORP (1961)",
    reason: "EPF increased stake from 8.2% to 9.1%. Institutional accumulation signal.",
    time: "1h ago",
    confidence: "Medium",
  },
  {
    type: "hidden_radar",
    icon: "radar",
    title: "Hidden Structural Beneficiary Detected",
    stock: "VITROX (0097)",
    reason: "Effective exposure 12.1% to semiconductor supply chain via testing equipment supply relationship. Weak price reaction.",
    time: "2h ago",
    confidence: "Medium",
  },
];

const typeStyles: Record<string, { badge: string; label: string }> = {
  hidden_radar: { badge: "bg-primary/20 text-primary", label: "Hidden Radar" },
  trap: { badge: "bg-destructive/20 text-destructive", label: "Trap Alert" },
  news: { badge: "bg-accent/20 text-accent", label: "News Impact" },
  ownership: { badge: "bg-info/20 text-info", label: "Ownership" },
};

export default function AlertsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold">Alert Center</h1>
        <div className="flex gap-2">
          <button className="glass-panel px-3 py-1.5 rounded-lg text-[10px] font-bold text-muted-foreground uppercase">
            Mark All Read
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-lg">radar</span>
            <span className="text-xs font-bold text-primary">Hidden Radar</span>
          </div>
          <p className="text-2xl font-bold">3</p>
          <p className="text-[10px] text-muted-foreground">Beneficiaries not priced in</p>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-destructive text-lg">crisis_alert</span>
            <span className="text-xs font-bold text-destructive">Trap Detector</span>
          </div>
          <p className="text-2xl font-bold">1</p>
          <p className="text-[10px] text-muted-foreground">Suspicious patterns today</p>
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-3 pb-4">
        {alerts.map((alert, i) => {
          const style = typeStyles[alert.type];
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
                }`}>Confidence: {alert.confidence}</span>
                <button className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                  View Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
