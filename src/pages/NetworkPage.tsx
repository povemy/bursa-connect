import { useState } from "react";
import { motion } from "framer-motion";

const nodes = [
  { id: "main", label: "MAIN CORP BHD", type: "listed", x: 50, y: 50, icon: "corporate_fare", code: "1022" },
  { id: "sub1", label: "Sub-Holdings", type: "listed", x: 22, y: 32, icon: "business", pct: "60%" },
  { id: "dir1", label: "Director X", type: "person", x: 78, y: 30, icon: "person", pct: "15%" },
  { id: "shell", label: "Shell Entity 09", type: "risk", x: 50, y: 78, icon: "warning", pct: "40%" },
  { id: "sub2", label: "Tech Ventures", type: "private", x: 15, y: 60, icon: "devices", pct: "25%" },
  { id: "fund", label: "Amanah Trust", type: "shareholder", x: 80, y: 65, icon: "account_balance", pct: "32%" },
  { id: "jv", label: "JV Partners Sdn", type: "private", x: 35, y: 20, icon: "handshake", pct: "50%" },
];

const edges = [
  { from: "main", to: "sub1" }, { from: "main", to: "dir1" },
  { from: "main", to: "shell" }, { from: "main", to: "sub2" },
  { from: "main", to: "fund" }, { from: "sub1", to: "jv" },
];

const nodeColors: Record<string, string> = {
  listed: "bg-info/30 border-info",
  private: "bg-muted border-muted-foreground/30",
  shareholder: "bg-accent/30 border-accent",
  risk: "bg-destructive/30 border-destructive",
  person: "bg-primary/30 border-primary",
};

const detailData = {
  name: "Main Corp Bhd",
  code: "BURSA: MAIN / 1022",
  ownership: "54.2%",
  risk: "Low",
  riskFlags: [
    { text: "Circular Ownership Detected in Level 3", level: "warning" },
    { text: "Sanction Check: Clear", level: "clear" },
  ],
  beneficiaries: [
    { name: "Tan Sri Dr. Ibrahim", pct: "32.1%" },
    { name: "Amanah Trust Fund", pct: "12.5%" },
  ],
};

export default function NetworkPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-120px)]">
      {/* Search bar */}
      <div className="px-4 pt-4 flex gap-2">
        <label className="flex flex-1 items-center glass-panel rounded-xl h-12 px-4 gap-3">
          <span className="material-symbols-outlined text-primary">search</span>
          <input
            className="bg-transparent border-none text-foreground focus:outline-none placeholder:text-muted-foreground w-full text-sm font-medium"
            placeholder="Search corporate entity..."
            defaultValue="Main Corp Bhd"
          />
        </label>
        <button className="glass-panel w-12 h-12 rounded-xl flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">tune</span>
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 mt-3 overflow-x-auto hide-scrollbar pb-2">
        <div className="flex h-8 shrink-0 items-center gap-2 rounded-full glass-panel px-3">
          <span className="material-symbols-outlined text-primary text-sm">layers</span>
          <span className="text-xs font-medium">Depth: 3</span>
        </div>
        <div className="flex h-8 shrink-0 items-center gap-2 rounded-full bg-primary/20 border border-primary/40 px-3">
          <span className="material-symbols-outlined text-primary text-sm">shield</span>
          <span className="text-primary text-xs font-medium">Risk: On</span>
        </div>
        <div className="flex h-8 shrink-0 items-center gap-2 rounded-full glass-panel px-3">
          <span className="material-symbols-outlined text-primary text-sm">filter_alt</span>
          <span className="text-xs font-medium">Bursa Listed</span>
        </div>
      </div>

      {/* Graph area */}
      <div className="flex-1 relative graph-background mx-4 mt-3 rounded-2xl overflow-hidden glass-panel">
        {/* SVG edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
          {edges.map((e, i) => {
            const from = nodes.find((n) => n.id === e.from)!;
            const to = nodes.find((n) => n.id === e.to)!;
            return (
              <line
                key={i}
                x1={`${from.x}%`} y1={`${from.y}%`}
                x2={`${to.x}%`} y2={`${to.y}%`}
                stroke={to.type === "risk" ? "hsl(var(--warning))" : "hsl(var(--primary))"}
                strokeWidth={to.type === "risk" ? 3 : 1.5}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <button
            key={node.id}
            onClick={() => { setSelectedNode(node.id); setDrawerOpen(true); }}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className={`${node.id === "main" ? "h-14 w-14" : "h-10 w-10"} rounded-full ${nodeColors[node.type]} border-2 flex items-center justify-center transition-transform group-hover:scale-110 ${
              node.type === "risk" ? "glow-danger" : node.id === "main" ? "glow-primary" : ""
            }`}>
              <span className={`material-symbols-outlined ${node.id === "main" ? "text-xl" : "text-sm"}`}>{node.icon}</span>
            </div>
            <span className="text-[8px] font-bold text-muted-foreground whitespace-nowrap bg-background/80 px-1.5 py-0.5 rounded">
              {node.label}
            </span>
            {node.pct && (
              <span className="text-[7px] text-primary font-mono">{node.pct}</span>
            )}
          </button>
        ))}

        {/* Mode toggle */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 glass-panel p-1 rounded-full flex gap-1">
          <button className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">Influence Map</button>
          <button className="px-4 py-1.5 rounded-full text-muted-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-secondary">Risk Heatmap</button>
        </div>

        {/* Zoom controls */}
        <div className="absolute right-3 bottom-20 z-20 flex flex-col gap-2">
          <button className="flex size-8 items-center justify-center rounded-lg glass-panel text-foreground text-sm">
            <span className="material-symbols-outlined text-lg">add</span>
          </button>
          <button className="flex size-8 items-center justify-center rounded-lg glass-panel text-foreground text-sm">
            <span className="material-symbols-outlined text-lg">remove</span>
          </button>
        </div>
      </div>

      {/* Detail drawer */}
      {drawerOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="fixed bottom-20 left-0 right-0 z-40 glass-panel rounded-t-2xl border-t border-glass-border p-6 max-h-[60vh] overflow-y-auto"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold">{detailData.name}</h3>
              <p className="text-primary text-xs font-mono">{detailData.code}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded">HEALTHY</span>
              <button onClick={() => setDrawerOpen(false)} className="text-muted-foreground">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-secondary p-3 rounded-lg border border-glass-border">
              <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Direct Ownership</p>
              <p className="text-xl font-bold">{detailData.ownership}</p>
            </div>
            <div className="bg-secondary p-3 rounded-lg border border-glass-border">
              <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Risk Rating</p>
              <p className="text-warning text-xl font-bold">{detailData.risk}</p>
            </div>
          </div>

          <h4 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-glass-border pb-2">Risk Flags</h4>
          <div className="space-y-2 mb-6">
            {detailData.riskFlags.map((flag, i) => (
              <div key={i} className={`flex items-center gap-3 p-2 rounded border ${
                flag.level === "warning" ? "bg-warning/10 border-warning/30" : "bg-secondary border-glass-border opacity-60"
              }`}>
                <span className={`material-symbols-outlined text-sm ${flag.level === "warning" ? "text-warning" : "text-muted-foreground"}`}>
                  {flag.level === "warning" ? "circle_notifications" : "cancel"}
                </span>
                <p className={`text-[10px] font-medium ${flag.level === "warning" ? "text-warning" : "text-muted-foreground"}`}>{flag.text}</p>
              </div>
            ))}
          </div>

          <h4 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-glass-border pb-2">Ultimate Beneficiaries</h4>
          <div className="space-y-2">
            {detailData.beneficiaries.map((b, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-secondary flex items-center justify-center text-[10px]">{i + 1}</div>
                  <span className="text-xs">{b.name}</span>
                </div>
                <span className="text-primary text-xs font-bold">{b.pct}</span>
              </div>
            ))}
          </div>

          <button className="mt-6 w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-all">
            Generate Audit Report
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
