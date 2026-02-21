import { motion } from "framer-motion";

const watchlist = [
  { name: "INARI", code: "0166", price: "RM 3.42", change: "+2.41%", positive: true, score: 85 },
  { name: "SIMEPLT", code: "5285", price: "RM 4.86", change: "+1.12%", positive: true, score: 72 },
  { name: "MAYBANK", code: "1155", price: "RM 9.45", change: "-0.32%", positive: false, score: 78 },
  { name: "TOPGLOVE", code: "7113", price: "RM 1.05", change: "+1.22%", positive: true, score: 55 },
  { name: "TENAGA", code: "5347", price: "RM 13.80", change: "+0.58%", positive: true, score: 68 },
];

export default function VaultPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4">
      <h1 className="text-lg font-bold mb-6">Vault — Watchlist</h1>

      <div className="space-y-3">
        {watchlist.map((stock) => (
          <div key={stock.code} className="glass-panel p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{stock.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{stock.code}</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold">{stock.price}</span>
                  <span className={`text-sm font-semibold ${stock.positive ? "text-primary" : "text-destructive"}`}>
                    {stock.change}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative size-12 flex items-center justify-center">
                  <svg className="size-full" viewBox="0 0 36 36">
                    <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className={stock.score >= 70 ? "text-primary" : stock.score >= 50 ? "text-accent" : "text-destructive"} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${stock.score}, 100`} strokeLinecap="round" strokeWidth="3" />
                  </svg>
                  <span className="absolute text-xs font-bold">{stock.score}</span>
                </div>
                <span className="text-[8px] text-muted-foreground uppercase mt-1">AI Score</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-secondary border border-glass-border py-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                View Analysis
              </button>
              <button className="flex-1 bg-primary/10 border border-primary/20 py-2 rounded-lg text-xs font-bold text-primary hover:bg-primary/20 transition-colors">
                Network Map
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
