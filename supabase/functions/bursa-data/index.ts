const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BURSA_TICKERS = [
  { symbol: "1155.KL", name: "MAYBANK", sector: "Finance", cap: "Large" },
  { symbol: "1295.KL", name: "PBBANK", sector: "Finance", cap: "Large" },
  { symbol: "5347.KL", name: "TENAGA", sector: "Utilities", cap: "Large" },
  { symbol: "4863.KL", name: "TM", sector: "Telecom", cap: "Large" },
  { symbol: "3182.KL", name: "GENTING", sector: "Consumer", cap: "Large" },
  { symbol: "1023.KL", name: "CIMB", sector: "Finance", cap: "Large" },
  { symbol: "5285.KL", name: "SIMEPLT", sector: "Plantation", cap: "Large" },
  { symbol: "1961.KL", name: "IOI", sector: "Plantation", cap: "Large" },
  { symbol: "5183.KL", name: "PETGAS", sector: "Energy", cap: "Large" },
  { symbol: "4707.KL", name: "NESTLE", sector: "Consumer", cap: "Large" },
  { symbol: "5225.KL", name: "IHH", sector: "Healthcare", cap: "Large" },
  { symbol: "0166.KL", name: "INARI", sector: "Technology", cap: "Mid" },
  { symbol: "7113.KL", name: "TOPGLOVE", sector: "Healthcare", cap: "Mid" },
  { symbol: "6012.KL", name: "MAXIS", sector: "Telecom", cap: "Mid" },
  { symbol: "5168.KL", name: "HARTALEGA", sector: "Healthcare", cap: "Mid" },
  { symbol: "4715.KL", name: "GENM", sector: "Consumer", cap: "Mid" },
  { symbol: "5218.KL", name: "SAPNRG", sector: "Energy", cap: "Mid" },
  { symbol: "0138.KL", name: "MYEG", sector: "Technology", cap: "Mid" },
  { symbol: "0128.KL", name: "FRONTKN", sector: "Technology", cap: "Small" },
  { symbol: "5243.KL", name: "VELESTO", sector: "Energy", cap: "Small" },
  { symbol: "0097.KL", name: "VITROX", sector: "Technology", cap: "Small" },
  { symbol: "5005.KL", name: "UNISEM", sector: "Technology", cap: "Small" },
  { symbol: "3867.KL", name: "MPI", sector: "Technology", cap: "Small" },
  { symbol: "5199.KL", name: "HIBISCUS", sector: "Energy", cap: "Small" },
  { symbol: "2445.KL", name: "KLK", sector: "Plantation", cap: "Mid" },
];

async function fetchYahooChart(symbol: string, interval = '5m', range = '1d') {
  // Use query2 + v8 which is still working
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`;
  const res = await fetch(url, {
    headers: { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chart fetch failed for ${symbol}: ${res.status} - ${text.substring(0, 200)}`);
  }
  return await res.json();
}

async function fetchMultipleCharts(symbols: string[]) {
  const results = [];
  // Batch in groups of 5 to avoid rate limiting
  for (let i = 0; i < symbols.length; i += 5) {
    const batch = symbols.slice(i, i + 5);
    const promises = batch.map(async (sym) => {
      try {
        const data = await fetchYahooChart(sym, '1d', '5d');
        const result = data?.chart?.result?.[0];
        if (!result) return null;

        const meta = result.meta;
        const quotes = result.indicators?.quote?.[0];
        const timestamps = result.timestamp || [];
        
        // Get latest values
        const lastIdx = timestamps.length - 1;
        const prevClose = meta.chartPreviousClose || meta.previousClose;
        const currentPrice = meta.regularMarketPrice;
        const change = currentPrice - prevClose;
        const changePct = prevClose ? (change / prevClose) * 100 : 0;

        // Calculate volume avg from last 5 days
        const volumes = quotes?.volume?.filter((v: number | null) => v != null) || [];
        const avgVolume = volumes.length > 0 ? volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length : 0;
        const latestVolume = meta.regularMarketVolume || (volumes.length > 0 ? volumes[volumes.length - 1] : 0);

        return {
          symbol: sym,
          shortName: meta.shortName || meta.symbol,
          regularMarketPrice: currentPrice,
          regularMarketChange: change,
          regularMarketChangePercent: changePct,
          regularMarketVolume: latestVolume,
          averageDailyVolume3Month: avgVolume,
          marketCap: (meta.regularMarketPrice || 0) * (meta.sharesOutstanding || 0),
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
          currency: meta.currency,
          exchangeName: meta.exchangeName,
        };
      } catch (e) {
        console.error(`Failed to fetch ${sym}:`, e.message);
        return null;
      }
    });
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults.filter(Boolean));
    
    // Small delay between batches
    if (i + 5 < symbols.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, symbol, interval, range } = body;

    if (action === 'market_overview') {
      // Fetch KLCI index
      let klciData = null;
      try {
        const klciChart = await fetchYahooChart('^KLSE', '1d', '5d');
        const klciResult = klciChart?.chart?.result?.[0];
        if (klciResult) {
          const meta = klciResult.meta;
          const prevClose = meta.chartPreviousClose || meta.previousClose;
          const currentPrice = meta.regularMarketPrice;
          klciData = {
            price: currentPrice,
            change: currentPrice - prevClose,
            changePct: prevClose ? ((currentPrice - prevClose) / prevClose) * 100 : 0,
          };
        }
      } catch (e) {
        console.error('Failed to fetch KLCI:', e.message);
      }

      // Fetch all stock quotes
      const allSymbols = BURSA_TICKERS.map(t => t.symbol);
      const quotes = await fetchMultipleCharts(allSymbols);

      return new Response(JSON.stringify({
        success: true,
        klci: klciData,
        quotes,
        tickers: BURSA_TICKERS,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'stock_detail') {
      if (!symbol) {
        return new Response(JSON.stringify({ success: false, error: 'Symbol required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Fetch 1-day chart for detail view
      const chartData = await fetchYahooChart(symbol, interval || '5m', range || '1d');
      const result = chartData?.chart?.result?.[0];
      const ticker = BURSA_TICKERS.find(t => t.symbol === symbol);

      if (!result) {
        return new Response(JSON.stringify({ success: false, error: 'No data found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const meta = result.meta;
      const prevClose = meta.chartPreviousClose || meta.previousClose;
      const currentPrice = meta.regularMarketPrice;

      return new Response(JSON.stringify({
        success: true,
        quote: {
          symbol,
          shortName: meta.shortName || meta.symbol,
          regularMarketPrice: currentPrice,
          regularMarketChange: currentPrice - prevClose,
          regularMarketChangePercent: prevClose ? ((currentPrice - prevClose) / prevClose) * 100 : 0,
          regularMarketVolume: meta.regularMarketVolume,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
          currency: meta.currency,
        },
        chart: {
          timestamps: result.timestamp,
          quotes: result.indicators?.quote?.[0],
        },
        tickerInfo: ticker,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'chart') {
      if (!symbol) {
        return new Response(JSON.stringify({ success: false, error: 'Symbol required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const chartData = await fetchYahooChart(symbol, interval || '5m', range || '1d');
      const result = chartData?.chart?.result?.[0];

      return new Response(JSON.stringify({
        success: true,
        chart: result ? {
          timestamps: result.timestamp,
          quotes: result.indicators?.quote?.[0],
          meta: result.meta,
        } : null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action. Use: market_overview, stock_detail, chart' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in bursa-data:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
