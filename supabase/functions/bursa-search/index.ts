const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || query.trim().length < 1) {
      return new Response(JSON.stringify({ success: true, results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Search Yahoo Finance for Bursa Malaysia stocks
    const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=25&newsCount=0&enableFuzzyQuery=true&quotesQueryId=tss_match_phrase_query&region=MY`;
    
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) {
      // Fallback: try v6 search
      const fallbackUrl = `https://query2.finance.yahoo.com/v6/finance/autocomplete?query=${encodeURIComponent(query)}&lang=en&region=MY`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      
      if (!fallbackRes.ok) {
        throw new Error(`Search failed: ${res.status}`);
      }
      
      const fallbackData = await fallbackRes.json();
      const results = (fallbackData?.ResultSet?.Result || [])
        .filter((r: any) => r.symbol?.endsWith('.KL'))
        .map((r: any) => ({
          symbol: r.symbol,
          name: r.name,
          exchange: r.exchDisp || 'Bursa Malaysia',
          type: r.typeDisp || 'Equity',
        }));

      return new Response(JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await res.json();
    
    // Filter for .KL (Bursa Malaysia) stocks
    const quotes = (data?.quotes || [])
      .filter((q: any) => q.symbol?.endsWith('.KL') || q.exchange === 'KLS' || q.exchDisp?.includes('Kuala Lumpur'))
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchDisp || 'Bursa Malaysia',
        type: q.quoteType || 'EQUITY',
        sector: q.sector || '',
        industry: q.industry || '',
      }));

    // If no .KL results, try appending .KL to query
    if (quotes.length === 0) {
      const klQuery = query.trim().toUpperCase();
      // Try direct symbol lookup
      try {
        const directUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(klQuery.includes('.KL') ? klQuery : klQuery + '.KL')}?interval=1d&range=1d`;
        const directRes = await fetch(directUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          const meta = directData?.chart?.result?.[0]?.meta;
          if (meta) {
            quotes.push({
              symbol: meta.symbol,
              name: meta.shortName || meta.symbol,
              exchange: meta.exchangeName || 'Bursa Malaysia',
              type: 'EQUITY',
              sector: '',
              industry: '',
            });
          }
        }
      } catch (_) { /* ignore */ }
    }

    return new Response(JSON.stringify({ success: true, results: quotes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message, results: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
