import { supabase } from "@/integrations/supabase/client";

export interface StockQuote {
  symbol: string;
  shortName: string;
  longName?: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  regularMarketChange: number;
  regularMarketVolume: number;
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  returnOnEquity?: number;
  bookValue?: number;
  priceToBook?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  averageDailyVolume3Month?: number;
  sharesOutstanding?: number;
}

export interface TickerInfo {
  symbol: string;
  name: string;
  sector: string;
  cap: string;
}

export interface KlciData {
  price: number;
  change: number;
  changePct: number;
}

export interface MarketOverview {
  klci: KlciData | null;
  quotes: StockQuote[];
  tickers: TickerInfo[];
}

export interface ChartPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const bursaApi = {
  async getMarketOverview(): Promise<MarketOverview> {
    const { data, error } = await supabase.functions.invoke('bursa-data', {
      body: { action: 'market_overview' },
    });

    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Failed to fetch market data');
    return { klci: data.klci, quotes: data.quotes, tickers: data.tickers };
  },

  async getStockDetail(symbol: string) {
    const { data, error } = await supabase.functions.invoke('bursa-data', {
      body: { action: 'stock_detail', symbol },
    });

    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Failed to fetch stock detail');
    return data;
  },

  async getNews(query?: string) {
    const { data, error } = await supabase.functions.invoke('bursa-news', {
      body: { action: 'bursa_news', query },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async getAnnouncements() {
    const { data, error } = await supabase.functions.invoke('bursa-news', {
      body: { action: 'bursa_announcements' },
    });

    if (error) throw new Error(error.message);
    return data;
  },
};

// Helper to classify market cap
export function classifyCap(marketCap?: number): string {
  if (!marketCap) return "Unknown";
  if (marketCap >= 10_000_000_000) return "Large";
  if (marketCap >= 2_000_000_000) return "Mid";
  if (marketCap >= 300_000_000) return "Small";
  return "Penny";
}

// Helper to get volume ratio
export function volumeRatio(currentVol: number, avgVol?: number): string {
  if (!avgVol || avgVol === 0) return "N/A";
  return (currentVol / avgVol).toFixed(1) + "x";
}

// Helper to format price
export function formatPrice(price?: number): string {
  if (price == null) return "N/A";
  return `RM ${price.toFixed(2)}`;
}

// Helper to format market cap
export function formatMarketCap(cap?: number): string {
  if (!cap) return "N/A";
  if (cap >= 1_000_000_000) return `RM ${(cap / 1_000_000_000).toFixed(1)}B`;
  if (cap >= 1_000_000) return `RM ${(cap / 1_000_000).toFixed(0)}M`;
  return `RM ${cap.toLocaleString()}`;
}

// Helper to format change percent
export function formatChange(pct?: number): string {
  if (pct == null) return "N/A";
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

// Helper to detect if move is news-driven or speculative
export function detectMoveType(volRatio: number, hasNews: boolean): string {
  if (hasNews) return "News Driven";
  if (volRatio > 3) return "Speculative";
  return "Technical";
}
