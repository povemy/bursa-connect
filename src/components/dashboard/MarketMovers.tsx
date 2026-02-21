import { useState } from "react";
import { Link } from "react-router-dom";

const moversData = {
  gainers: [
    { name: "INARI", code: "0166", sector: "Technology", change: "+8.52%", volume: "4.2x", cap: "Large", tag: "News Driven" },
    { name: "FRONTKN", code: "0128", sector: "Technology", change: "+6.12%", volume: "3.1x", cap: "Mid", tag: "News Driven" },
    { name: "HIBISCUS", code: "5199", sector: "Energy", change: "+5.44%", volume: "2.8x", cap: "Mid", tag: "Speculative" },
    { name: "SCIB", code: "9237", sector: "Construction", change: "+14.3%", volume: "7.2x", cap: "Penny", tag: "Speculative" },
  ],
  losers: [
    { name: "GENM", code: "4715", sector: "Consumer", change: "-4.21%", volume: "1.8x", cap: "Large", tag: "News Driven" },
    { name: "SAPNRG", code: "5218", sector: "Energy", change: "-3.87%", volume: "2.1x", cap: "Mid", tag: "News Driven" },
    { name: "MYEG", code: "0138", sector: "Technology", change: "-2.95%", volume: "1.5x", cap: "Mid", tag: "Technical" },
  ],
  volume: [
    { name: "TOPGLOVE", code: "7113", sector: "Healthcare", change: "+1.22%", volume: "5.6x", cap: "Large", tag: "News Driven" },
    { name: "GENTING", code: "3182", sector: "Consumer", change: "-0.45%", volume: "4.8x", cap: "Large", tag: "Technical" },
    { name: "VELESTO", code: "5243", sector: "Energy", change: "+3.21%", volume: "6.1x", cap: "Small", tag: "Speculative" },
  ],
};

type Tab = "gainers" | "losers" | "volume";

export function MarketMovers() {
  const [tab, setTab] = useState<Tab>("gainers");
  const data = moversData[tab];

  return (
    <section className="mt-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold tracking-tight">Market Movers Intelligence</h2>
      </div>

      <div className="flex gap-1 mb-4 bg-secondary rounded-lg p-1">
        {(["gainers", "losers", "volume"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "gainers" ? "Gainers" : t === "losers" ? "Losers" : "Volume"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {data.map((stock) => (
          <Link
            key={stock.code}
            to={`/analysis?stock=${stock.code}`}
            className="glass-panel p-3 rounded-xl flex items-center justify-between hover:border-primary/30 transition-colors block"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold">{stock.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{stock.code}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                  stock.cap === "Penny" ? "bg-destructive/20 text-destructive" :
                  stock.cap === "Small" ? "bg-warning/20 text-warning" :
                  stock.cap === "Mid" ? "bg-info/20 text-info" :
                  "bg-primary/20 text-primary"
                }`}>{stock.cap}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{stock.sector}</span>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                  stock.tag === "News Driven" ? "bg-primary/10 text-primary" :
                  stock.tag === "Speculative" ? "bg-destructive/10 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>{stock.tag}</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${stock.change.startsWith("+") ? "text-primary" : "text-destructive"}`}>
                {stock.change}
              </div>
              <div className="text-[10px] text-muted-foreground">Vol: {stock.volume}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
