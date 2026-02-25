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

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  sector?: string;
  industry?: string;
}

export interface AnalysisCard {
  category: string;
  icon: "positive" | "neutral" | "negative";
  summary: string;
  probability: number;
}

export interface StockAnalysis {
  opportunityScore: number;
  probabilityPositive: number;
  confidence: number;
  riskLevel: string;
  suggestedBias: string;
  hiddenRadar: boolean;
  trapFlag: boolean;
  trapProbability: number;
  cards: AnalysisCard[];
  riskMetrics: {
    volatility: number;
    liquidityRisk: number;
    governanceRisk: number;
    structuralExposure: number;
    macroSensitivity: number;
    maxDrawdown: number;
    riskTrend: string;
  };
  keyReason: string;
}

export interface ForensicEntity {
  name: string;
  stockCode: string | null;
  marketCap: string | null;
  isListed: boolean;
  country: string;
}

export interface ForensicData {
  entity: ForensicEntity;
  shareholders: Array<{
    name: string;
    percentage: number;
    type: string;
    isListed: boolean;
    stockCode?: string;
  }>;
  subsidiaries: Array<{
    name: string;
    percentage: number;
    isListed: boolean;
    stockCode?: string;
  }>;
  directors: Array<{
    name: string;
    position: string;
    otherDirectorships: string[];
  }>;
  riskFlags: string[];
  sources: string[];
}

export interface MacroFactor {
  factor: string;
  direction: string;
  impactStrength: number;
  sectorExposure: string[];
  timeHorizon: string;
  summary: string;
}

export interface DailySuggestion {
  symbol: string;
  name: string;
  confidence: number;
  riskLevel: string;
  bias: string;
  keyReason: string;
  riskTriggers: string;
  opportunityScore: number;
  hiddenRadar: boolean;
  trapFlag: boolean;
}

export interface TrapStock {
  symbol: string;
  name: string;
  trapProbability: number;
  manipulationRisk: string;
  reason: string;
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

  async searchStocks(query: string): Promise<SearchResult[]> {
    const { data, error } = await supabase.functions.invoke('bursa-search', {
      body: { query },
    });

    if (error) throw new Error(error.message);
    return data?.results || [];
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

  async analyzeStock(stockData: any, newsContext?: string): Promise<StockAnalysis | null> {
    const { data, error } = await supabase.functions.invoke('bursa-intelligence', {
      body: { action: 'analyze_stock', stockData, newsContext },
    });

    if (error) throw new Error(error.message);
    return data?.analysis || null;
  },

  async getDailySuggestions(stockData: any) {
    const { data, error } = await supabase.functions.invoke('bursa-intelligence', {
      body: { action: 'daily_suggestions', stockData },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async getMacroAnalysis(context?: string) {
    const { data, error } = await supabase.functions.invoke('bursa-intelligence', {
      body: { action: 'macro_analysis', macroContext: context },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async getForensicData(entity: string): Promise<ForensicData | null> {
    const { data, error } = await supabase.functions.invoke('bursa-intelligence', {
      body: { action: 'forensic_search', stockData: { entity } },
    });

    if (error) throw new Error(error.message);
    return data?.forensic || null;
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
