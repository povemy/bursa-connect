import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { bursaApi, type ForensicData } from "@/lib/api/bursa";

type NodeType = "listed" | "private" | "shareholder" | "risk" | "person" | "subsidiary";

interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  percentage?: number;
  stockCode?: string;
  isListed?: boolean;
  layer: "parent" | "center" | "subsidiary" | "side";
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
  percentage?: number;
}

const NODE_COLORS: Record<NodeType, { bg: string; border: string }> = {
  listed: { bg: "bg-info/30", border: "border-info" },
  private: { bg: "bg-muted", border: "border-muted-foreground/30" },
  shareholder: { bg: "bg-accent/30", border: "border-accent" },
  risk: { bg: "bg-destructive/30", border: "border-destructive" },
  person: { bg: "bg-primary/30", border: "border-primary" },
  subsidiary: { bg: "bg-primary/20", border: "border-primary/50" },
};

type FilterType = "all" | "listed" | "risk" | "shareholders" | "subsidiaries";

function buildGraph(forensic: ForensicData): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  nodes.push({
    id: "center",
    label: forensic.entity.name,
    type: forensic.entity.isListed ? "listed" : "private",
    x: 50,
    y: 50,
    stockCode: forensic.entity.stockCode || undefined,
    isListed: forensic.entity.isListed,
    layer: "center",
  });

  const shareholders = forensic.shareholders || [];
  shareholders.forEach((sh, i) => {
    const count = shareholders.length;
    const spacing = 80 / Math.max(count, 1);
    const x = 10 + spacing * i + spacing / 2;
    const y = 15 + (i % 2 === 0 ? 0 : 8);
    const isMajor = sh.percentage > 20;
    const nodeType: NodeType = isMajor ? "shareholder" : sh.isListed ? "listed" : "private";

    nodes.push({
      id: `sh_${i}`, label: sh.name, type: nodeType, x, y,
      percentage: sh.percentage, stockCode: sh.stockCode, isListed: sh.isListed, layer: "parent",
    });
    edges.push({ from: `sh_${i}`, to: "center", label: `${sh.percentage}% ${sh.type || "Shareholder"}`, percentage: sh.percentage });
  });

  const subsidiaries = forensic.subsidiaries || [];
  subsidiaries.forEach((sub, i) => {
    const count = subsidiaries.length;
    const spacing = 80 / Math.max(count, 1);
    const x = 10 + spacing * i + spacing / 2;
    const y = 80 + (i % 2 === 0 ? 0 : 8);

    nodes.push({
      id: `sub_${i}`, label: sub.name, type: sub.isListed ? "listed" : "subsidiary", x, y,
      percentage: sub.percentage, stockCode: sub.stockCode, isListed: sub.isListed, layer: "subsidiary",
    });
    edges.push({ from: "center", to: `sub_${i}`, label: `${sub.percentage}% Subsidiary`, percentage: sub.percentage });
  });

  const directors = forensic.directors || [];
  directors.slice(0, 4).forEach((dir, i) => {
    const x = i < 2 ? 8 : 92;
    const y = 35 + (i % 2) * 25;
    nodes.push({ id: `dir_${i}`, label: dir.name, type: "person", x, y, layer: "side" });
    edges.push({ from: `dir_${i}`, to: "center", label: dir.position || "Director" });
  });

  return { nodes, edges };
}

export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchEntity, setSearchEntity] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [zoom, setZoom] = useState(1);

  const { data: forensicData, isLoading, error, isFetching } = useQuery({
    queryKey: ['forensic', searchEntity],
    queryFn: () => bursaApi.getForensicData(searchEntity!),
    enabled: !!searchEntity,
    staleTime: 300000,
    retry: 1,
    // 30s timeout via gcTime
  });

  const handleSearch = useCallback(() => {
    if (searchQuery.trim().length > 0) {
      setSearchEntity(searchQuery.trim());
      setSelectedNode(null);
      setDrawerOpen(false);
      setFilter("all");
      setZoom(1);
    }
  }, [searchQuery]);

  // Quick suggestions
  const quickSearches = ["MAYBANK", "CIMB", "TENAGA", "PETRONAS", "IHH", "GENTING"];

  const graph = forensicData ? buildGraph(forensicData) : null;

  const filteredNodes = graph?.nodes.filter(n => {
    if (filter === "all") return true;
    if (filter === "listed") return n.isListed || n.id === "center";
    if (filter === "risk") return n.type === "risk" || n.id === "center";
    if (filter === "shareholders") return n.layer === "parent" || n.id === "center";
    if (filter === "subsidiaries") return n.layer === "subsidiary" || n.id === "center";
    return true;
  }) || [];

  const filteredEdges = graph?.edges.filter(e => {
    const nodeIds = filteredNodes.map(n => n.id);
    return nodeIds.includes(e.from) && nodeIds.includes(e.to);
  }) || [];

  const selectedNodeData = filteredNodes.find(n => n.id === selectedNode);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-120px)]">
      {/* Search bar */}
      <div className="px-4 pt-4 flex gap-2">
        <label className="flex flex-1 items-center glass-panel rounded-xl h-12 px-4 gap-3">
          <span className="material-symbols-outlined text-primary">search</span>
          <input
            className="bg-transparent border-none text-foreground focus:outline-none placeholder:text-muted-foreground w-full text-sm font-medium"
            placeholder="Search entity (e.g. MAYBANK, CIMB)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </label>
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="glass-panel w-12 h-12 rounded-xl flex items-center justify-center text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined">{isLoading ? "hourglass_empty" : "send"}</span>
        </button>
      </div>

      {/* Quick searches */}
      {!searchEntity && (
        <div className="flex gap-1.5 px-4 mt-2 overflow-x-auto hide-scrollbar pb-1">
          {quickSearches.map(q => (
            <button key={q} onClick={() => { setSearchQuery(q); setSearchEntity(q); }}
              className="shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Filter chips */}
      {forensicData && (
        <div className="flex gap-2 px-4 mt-3 overflow-x-auto hide-scrollbar pb-2">
          {([
            { key: "all", icon: "layers", label: "All" },
            { key: "listed", icon: "verified", label: "Listed" },
            { key: "shareholders", icon: "people", label: "Shareholders" },
            { key: "subsidiaries", icon: "account_tree", label: "Subsidiaries" },
            { key: "risk", icon: "shield", label: "Risk" },
          ] as { key: FilterType; icon: string; label: string }[]).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex h-8 shrink-0 items-center gap-2 rounded-full px-3 transition-colors ${
                filter === f.key ? "bg-primary/20 border border-primary/40" : "glass-panel"
              }`}>
              <span className={`material-symbols-outlined text-sm ${filter === f.key ? "text-primary" : "text-muted-foreground"}`}>{f.icon}</span>
              <span className={`text-xs font-medium ${filter === f.key ? "text-primary" : "text-foreground"}`}>{f.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Graph area */}
      <div className="flex-1 relative graph-background mx-4 mt-3 rounded-2xl overflow-hidden glass-panel">
        {/* Empty state */}
        {!searchEntity && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <span className="material-symbols-outlined text-primary text-5xl mb-4">hub</span>
            <h3 className="text-sm font-bold mb-2">Corporate Forensic Network</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              Search any Bursa Malaysia entity to visualize ownership structures, shareholders, subsidiaries, and director networks.
            </p>
            <p className="text-[9px] text-muted-foreground mt-2">Try: MAYBANK, CIMB, TENAGA, PETRONAS</p>
          </div>
        )}

        {/* Loading */}
        {(isLoading || isFetching) && searchEntity && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-background/50">
            <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
            <p className="text-xs text-muted-foreground mt-3">Analyzing {searchEntity}...</p>
            <p className="text-[9px] text-muted-foreground mt-1">Scraping ownership data & AI processing</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <span className="material-symbols-outlined text-destructive text-3xl mb-3">error</span>
            <p className="text-xs text-muted-foreground text-center">Failed to load forensic data.</p>
            <button onClick={() => setSearchEntity(searchQuery.trim() || null)}
              className="mt-3 text-xs text-primary font-bold">Retry</button>
          </div>
        )}

        {/* Graph */}
        {forensicData && !isLoading && (
          <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {filteredEdges.map((e, i) => {
                const fromNode = filteredNodes.find(n => n.id === e.from);
                const toNode = filteredNodes.find(n => n.id === e.to);
                if (!fromNode || !toNode) return null;
                const isRisk = fromNode.type === "risk" || toNode.type === "risk";
                const midX = (fromNode.x + toNode.x) / 2;
                const midY = (fromNode.y + toNode.y) / 2;
                return (
                  <g key={i}>
                    <line x1={`${fromNode.x}%`} y1={`${fromNode.y}%`} x2={`${toNode.x}%`} y2={`${toNode.y}%`}
                      stroke={isRisk ? "hsl(var(--destructive))" : "hsl(var(--primary))"} strokeWidth={isRisk ? 2.5 : 1.5}
                      strokeOpacity={0.5} strokeDasharray={fromNode.type === "person" ? "4,4" : "none"} />
                    <text x={`${midX}%`} y={`${midY}%`} textAnchor="middle" dominantBaseline="middle"
                      fill="hsl(var(--muted-foreground))" fontSize="7" fontWeight="600">{e.label}</text>
                  </g>
                );
              })}
            </svg>

            {filteredNodes.map((node) => {
              const colors = NODE_COLORS[node.type];
              const isCenter = node.id === "center";
              const hasRiskFlag = forensicData.riskFlags && forensicData.riskFlags.length > 0 && isCenter;
              return (
                <button key={node.id} onClick={() => { setSelectedNode(node.id); setDrawerOpen(true); }}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 group"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}>
                  <div className={`${isCenter ? "h-16 w-16" : "h-10 w-10"} rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center transition-transform group-hover:scale-110 ${
                    hasRiskFlag ? "ring-2 ring-destructive ring-offset-2 ring-offset-background" : isCenter ? "glow-primary" : ""
                  }`}>
                    <span className={`material-symbols-outlined ${isCenter ? "text-lg" : "text-xs"}`}>
                      {node.type === "person" ? "person" : node.type === "shareholder" ? "account_balance" :
                       node.type === "listed" ? "verified" : node.type === "risk" ? "warning" :
                       node.type === "subsidiary" ? "business" : "corporate_fare"}
                    </span>
                  </div>
                  <span className="text-[7px] font-bold text-muted-foreground whitespace-nowrap bg-background/80 px-1.5 py-0.5 rounded max-w-[80px] truncate">
                    {node.label}
                  </span>
                  {node.percentage != null && (
                    <span className="text-[6px] text-primary font-mono bg-primary/10 px-1 rounded">{node.percentage}%</span>
                  )}
                  {node.isListed && !isCenter && (
                    <span className="text-[5px] font-bold text-info bg-info/10 px-1 rounded uppercase">Listed</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute right-3 bottom-4 z-20 flex flex-col gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.2, 2))} className="flex size-8 items-center justify-center rounded-lg glass-panel text-foreground text-sm">
            <span className="material-symbols-outlined text-lg">add</span>
          </button>
          <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="flex size-8 items-center justify-center rounded-lg glass-panel text-foreground text-sm">
            <span className="material-symbols-outlined text-lg">remove</span>
          </button>
          <button onClick={() => setZoom(1)} className="flex size-8 items-center justify-center rounded-lg glass-panel text-foreground text-sm">
            <span className="material-symbols-outlined text-lg">center_focus_strong</span>
          </button>
        </div>

        {/* Legend */}
        {forensicData && (
          <div className="absolute left-3 bottom-4 z-20 glass-panel rounded-lg p-2 space-y-1">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-info" /><span className="text-[7px] text-muted-foreground">Listed</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-muted-foreground" /><span className="text-[7px] text-muted-foreground">Private</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent" /><span className="text-[7px] text-muted-foreground">Major (&gt;20%)</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-destructive" /><span className="text-[7px] text-muted-foreground">Risk</span></div>
          </div>
        )}

        {/* Data source stamp */}
        {forensicData?.sources && forensicData.sources.length > 0 && (
          <div className="absolute right-3 top-3 z-20">
            <span className="text-[7px] text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
              Sources: {forensicData.sources.length}
            </span>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {drawerOpen && selectedNodeData && forensicData && (
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="fixed bottom-20 left-0 right-0 z-40 glass-panel rounded-t-2xl border-t border-glass-border p-5 max-h-[55vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-bold">{selectedNodeData.label}</h3>
                {selectedNodeData.stockCode && (
                  <p className="text-primary text-[10px] font-mono">BURSA: {selectedNodeData.stockCode}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedNodeData.isListed && (
                  <span className="bg-info/20 text-info text-[9px] font-bold px-2 py-0.5 rounded">LISTED</span>
                )}
                <button onClick={() => setDrawerOpen(false)} className="text-muted-foreground">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {selectedNodeData.id === "center" ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-secondary p-2.5 rounded-lg">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold mb-0.5">Country</p>
                    <p className="text-xs font-bold">{forensicData.entity.country}</p>
                  </div>
                  <div className="bg-secondary p-2.5 rounded-lg">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold mb-0.5">Market Cap</p>
                    <p className="text-xs font-bold">{forensicData.entity.marketCap || "N/A"}</p>
                  </div>
                </div>

                {forensicData.riskFlags && forensicData.riskFlags.length > 0 && (
                  <>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-destructive">Risk Flags</h4>
                    <div className="space-y-1.5 mb-4">
                      {forensicData.riskFlags.map((flag, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                          <span className="material-symbols-outlined text-destructive text-xs">warning</span>
                          <p className="text-[9px] text-destructive">{flag}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {forensicData.directors && forensicData.directors.length > 0 && (
                  <>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2">Directors</h4>
                    <div className="space-y-1.5 mb-4">
                      {forensicData.directors.map((d, i) => (
                        <div key={i} className="bg-secondary p-2 rounded-lg">
                          <p className="text-[10px] font-bold">{d.name}</p>
                          <p className="text-[9px] text-muted-foreground">{d.position}</p>
                          {d.otherDirectorships?.length > 0 && (
                            <p className="text-[8px] text-primary mt-0.5">Also: {d.otherDirectorships.join(", ")}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {forensicData.sources && forensicData.sources.length > 0 && (
                  <>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2">Sources</h4>
                    {forensicData.sources.map((s, i) => (
                      <p key={i} className="text-[8px] text-primary truncate mb-0.5">{s}</p>
                    ))}
                  </>
                )}
              </>
            ) : (
              <div className="space-y-2">
                {selectedNodeData.percentage != null && (
                  <div className="bg-secondary p-2.5 rounded-lg">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold mb-0.5">Ownership</p>
                    <p className="text-lg font-bold text-primary">{selectedNodeData.percentage}%</p>
                  </div>
                )}
                <div className="bg-secondary p-2.5 rounded-lg">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold mb-0.5">Type</p>
                  <p className="text-xs font-bold capitalize">{selectedNodeData.type}</p>
                </div>
                {selectedNodeData.layer && (
                  <div className="bg-secondary p-2.5 rounded-lg">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold mb-0.5">Relationship</p>
                    <p className="text-xs font-bold capitalize">{selectedNodeData.layer}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
