import { useQuery } from "@tanstack/react-query";
import { bursaApi } from "@/lib/api/bursa";

export function IntelligenceFeed() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bursa-news'],
    queryFn: () => bursaApi.getNews("Bursa Malaysia stock market latest news"),
    staleTime: 300000, // 5 min
    retry: 2,
  });

  const newsItems = data?.data || [];

  // Parse search results into feed items
  const feedItems = (Array.isArray(newsItems) ? newsItems : []).slice(0, 6).map((item: any, i: number) => {
    const title = item.title || item.url || "News Update";
    const description = item.description || item.markdown?.substring(0, 200) || "";
    const url = item.url || "#";
    
    // Simple sentiment detection from title
    const bullishKeywords = ['surge', 'gain', 'rise', 'rally', 'up', 'high', 'growth', 'profit', 'positive', 'boost'];
    const bearishKeywords = ['fall', 'drop', 'decline', 'down', 'low', 'loss', 'negative', 'crash', 'slump', 'risk'];
    
    const titleLower = (title + " " + description).toLowerCase();
    const bullishScore = bullishKeywords.filter(k => titleLower.includes(k)).length;
    const bearishScore = bearishKeywords.filter(k => titleLower.includes(k)).length;
    
    let sentiment = "NEUTRAL";
    if (bullishScore > bearishScore) sentiment = "BULLISH";
    if (bearishScore > bullishScore) sentiment = "BEARISH";

    const impact = i === 0 ? "high" : i === 1 ? "gold" : i < 4 ? "medium" : "low";

    return { title, description, url, sentiment, impact };
  });

  const impactStyles = {
    high: { className: "impact-high", badge: "bg-primary/20 text-primary", label: "High Impact" },
    gold: { className: "impact-gold", badge: "bg-accent/20 text-accent", label: "Market Intel" },
    medium: { className: "impact-medium", badge: "bg-muted text-muted-foreground", label: "Medium Impact" },
    low: { className: "impact-low", badge: "bg-muted text-muted-foreground", label: "Low Impact" },
  };

  return (
    <section className="mt-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold tracking-tight">Live Intelligence Feed</h2>
        <span className="text-[10px] text-muted-foreground">
          {isLoading ? "Fetching..." : `${feedItems.length} articles`}
        </span>
      </div>
      <div className="space-y-4">
        {isLoading && (
          <div className="glass-panel p-6 rounded-xl text-center">
            <span className="material-symbols-outlined text-primary animate-spin text-2xl">progress_activity</span>
            <p className="text-sm text-muted-foreground mt-2">Scanning news sources...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="glass-panel p-4 rounded-xl border-l-4 border-destructive">
            <p className="text-sm text-muted-foreground">Failed to load news feed. Will retry automatically.</p>
          </div>
        )}
        {feedItems.map((item, i) => {
          const style = impactStyles[item.impact as keyof typeof impactStyles];
          return (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`glass-panel p-4 rounded-xl relative overflow-hidden block hover:border-primary/20 transition-colors ${style.className}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`${style.badge} text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest`}>
                  {style.label}
                </span>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                  item.sentiment === "BULLISH" ? "bg-primary/10 text-primary" :
                  item.sentiment === "BEARISH" ? "bg-destructive/10 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>{item.sentiment}</span>
              </div>
              <h3 className="text-sm font-semibold mb-2 leading-snug">{item.title}</h3>
              {item.description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
