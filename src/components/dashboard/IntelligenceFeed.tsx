import { useQuery } from "@tanstack/react-query";
import { bursaApi } from "@/lib/api/bursa";

export function IntelligenceFeed() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bursa-news'],
    queryFn: () => bursaApi.getNews("Bursa Malaysia stock market latest news"),
    staleTime: 300000,
    retry: 2,
  });

  const newsItems = data?.data || [];

  const feedItems = (Array.isArray(newsItems) ? newsItems : []).slice(0, 8).map((item: any, i: number) => {
    const title = item.title || item.url || "News Update";
    const description = item.description || item.markdown?.substring(0, 120) || "";
    const url = item.url || "#";
    
    const bullishKeywords = ['surge', 'gain', 'rise', 'rally', 'up', 'high', 'growth', 'profit', 'positive', 'boost'];
    const bearishKeywords = ['fall', 'drop', 'decline', 'down', 'low', 'loss', 'negative', 'crash', 'slump', 'risk'];
    
    const titleLower = (title + " " + description).toLowerCase();
    const bullishScore = bullishKeywords.filter(k => titleLower.includes(k)).length;
    const bearishScore = bearishKeywords.filter(k => titleLower.includes(k)).length;
    
    let sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
    if (bullishScore > bearishScore) sentiment = "BULLISH";
    if (bearishScore > bullishScore) sentiment = "BEARISH";

    return { title, description, url, sentiment };
  });

  const sentimentColor = {
    BULLISH: "text-primary",
    BEARISH: "text-destructive",
    NEUTRAL: "text-muted-foreground",
  };

  const sentimentDot = {
    BULLISH: "bg-primary",
    BEARISH: "bg-destructive",
    NEUTRAL: "bg-muted-foreground",
  };

  return (
    <section className="mt-6 px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Intelligence Feed</h2>
        <span className="text-[10px] text-muted-foreground">
          {isLoading ? "Fetching..." : `${feedItems.length} articles`}
        </span>
      </div>

      {isLoading && (
        <div className="glass-panel p-4 rounded-xl text-center">
          <span className="material-symbols-outlined text-primary animate-spin text-xl">progress_activity</span>
          <p className="text-[10px] text-muted-foreground mt-1">Scanning sources...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="glass-panel p-3 rounded-xl border-l-4 border-destructive">
          <p className="text-[10px] text-muted-foreground">Failed to load feed. Retrying...</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {feedItems.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel p-2.5 rounded-lg block hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sentimentDot[item.sentiment]}`} />
              <span className={`text-[8px] font-bold uppercase tracking-wider ${sentimentColor[item.sentiment]}`}>
                {item.sentiment}
              </span>
            </div>
            <h3 className="text-[11px] font-semibold leading-tight line-clamp-2 mb-1">{item.title}</h3>
            {item.description && (
              <p className="text-[9px] text-muted-foreground leading-snug line-clamp-1">{item.description}</p>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
