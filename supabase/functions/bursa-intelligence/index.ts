const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

async function callAI(apiKey: string, prompt: string, model = 'google/gemini-2.5-flash') {
  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI call failed: ${res.status} - ${text.substring(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, stockData, newsContext, macroContext } = await req.json();

    if (action === 'analyze_stock') {
      const prompt = `You are a Bursa Malaysia stock analyst AI. Analyze this stock data and return ONLY valid JSON (no markdown, no code blocks).

Stock Data:
${JSON.stringify(stockData, null, 2)}

Recent News Context:
${newsContext || 'No recent news available'}

Return this exact JSON structure:
{
  "opportunityScore": <0-100>,
  "probabilityPositive": <0-100>,
  "confidence": <0-100>,
  "riskLevel": "<Low|Medium|High>",
  "suggestedBias": "<Conditional Buy|Hold|Sell>",
  "hiddenRadar": <true|false>,
  "trapFlag": <true|false>,
  "trapProbability": <0-100>,
  "cards": [
    {
      "category": "Catalyst Strength",
      "icon": "<positive|neutral|negative>",
      "summary": "<2-3 line summary>",
      "probability": <0-100>
    },
    {
      "category": "Sentiment Momentum",
      "icon": "<positive|neutral|negative>",
      "summary": "<2-3 line summary>",
      "probability": <0-100>
    },
    {
      "category": "Structural Positioning",
      "icon": "<positive|neutral|negative>",
      "summary": "<2-3 line summary>",
      "probability": <0-100>
    },
    {
      "category": "Risk Exposure",
      "icon": "<positive|neutral|negative>",
      "summary": "<2-3 line summary>",
      "probability": <0-100>
    },
    {
      "category": "Macro Alignment",
      "icon": "<positive|neutral|negative>",
      "summary": "<2-3 line summary>",
      "probability": <0-100>
    },
    {
      "category": "Trap Risk",
      "icon": "<positive|neutral|negative>",
      "summary": "<2-3 line summary>",
      "probability": <0-100>
    }
  ],
  "riskMetrics": {
    "volatility": <0-100>,
    "liquidityRisk": <0-100>,
    "governanceRisk": <0-100>,
    "structuralExposure": <0-100>,
    "macroSensitivity": <0-100>,
    "maxDrawdown": <0-100>,
    "riskTrend": "<Improving|Stable|Deteriorating>"
  },
  "keyReason": "<One line key reason for suggestion>"
}

Base analysis on: price action, volume patterns, sector context, and any available news. Avoid look-ahead bias. Be time-sensitive using only provided data.`;

      const result = await callAI(apiKey, prompt);
      
      // Parse JSON from AI response
      let parsed;
      try {
        // Try to extract JSON from potential markdown code blocks
        const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result];
        parsed = JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        // Try direct parse
        try {
          parsed = JSON.parse(result.trim());
        } catch (e2) {
          parsed = { error: 'Failed to parse AI response', raw: result.substring(0, 500) };
        }
      }

      return new Response(JSON.stringify({ success: true, analysis: parsed }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'daily_suggestions') {
      const prompt = `You are a Bursa Malaysia trading intelligence AI. Based on this market data, generate daily stock suggestions.

Market Data (all stocks):
${JSON.stringify(stockData, null, 2)}

Rules:
- Select 5-10 stocks to watch today
- Prioritize underrated stocks with high confluence to move up, not just top gainers
- Look for: strong volume patterns, sector tailwinds, structural positioning, sentiment acceleration
- EXCLUDE stocks showing manipulation patterns (abnormal volume without fundamentals)
- Avoid look-ahead bias
- Be time-sensitive

Return ONLY valid JSON (no markdown):
{
  "suggestions": [
    {
      "symbol": "<stock symbol>",
      "name": "<stock name>",
      "confidence": <0-100>,
      "riskLevel": "<Low|Medium|High>",
      "bias": "<Conditional Buy|Hold|Watch>",
      "keyReason": "<1 line reason>",
      "riskTriggers": "<monitoring triggers>",
      "opportunityScore": <0-100>,
      "hiddenRadar": <true|false>,
      "trapFlag": <true|false>
    }
  ],
  "trapList": [
    {
      "symbol": "<stock symbol>",
      "name": "<stock name>",
      "trapProbability": <0-100>,
      "manipulationRisk": "<Low|Medium|High>",
      "reason": "<why flagged>"
    }
  ],
  "marketSummary": "<2-3 lines overall market assessment>"
}`;

      const result = await callAI(apiKey, prompt);
      
      let parsed;
      try {
        const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result];
        parsed = JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        try { parsed = JSON.parse(result.trim()); } catch (e2) {
          parsed = { suggestions: [], trapList: [], marketSummary: 'Analysis unavailable' };
        }
      }

      return new Response(JSON.stringify({ success: true, ...parsed }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'macro_analysis') {
      const prompt = `You are a global macro analyst focused on Bursa Malaysia impact. Analyze current macro factors.

Context: ${macroContext || 'Analyze key global macro factors affecting Bursa Malaysia today.'}

Return ONLY valid JSON:
{
  "factors": [
    {
      "factor": "<e.g. Crude Oil, Gold, Palm Oil, USD/MYR, US Markets, Geopolitics>",
      "direction": "<Bullish|Bearish|Neutral>",
      "impactStrength": <0-100>,
      "sectorExposure": ["<affected sectors>"],
      "timeHorizon": "<Short|Medium>",
      "summary": "<2 line impact summary>"
    }
  ],
  "overallBias": "<Bullish|Bearish|Neutral>",
  "overallSummary": "<3 line market macro outlook>"
}`;

      const result = await callAI(apiKey, prompt);
      let parsed;
      try {
        const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result];
        parsed = JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        try { parsed = JSON.parse(result.trim()); } catch (e2) {
          parsed = { factors: [], overallBias: 'Neutral', overallSummary: 'Analysis unavailable' };
        }
      }

      return new Response(JSON.stringify({ success: true, ...parsed }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'forensic_search') {
      // Use Firecrawl to search for corporate ownership data
      const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (!firecrawlKey) {
        return new Response(JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { entity } = stockData;
      
      // Search for ownership data
      const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `${entity} Malaysia corporate ownership shareholders subsidiaries directors Bursa`,
          limit: 8,
          tbs: 'qdr:m',
          scrapeOptions: { formats: ['markdown'] },
        }),
      });

      const searchData = await searchRes.json();
      const sources = searchData?.data || [];
      
      // Use AI to extract structured ownership data from search results
      const sourceTexts = sources.slice(0, 5).map((s: any) => 
        `Source: ${s.url}\n${(s.markdown || s.description || '').substring(0, 800)}`
      ).join('\n---\n');

      const forensicPrompt = `Extract corporate ownership structure for "${entity}" from these sources. Return ONLY valid JSON:

Sources:
${sourceTexts}

Return:
{
  "entity": {
    "name": "<full legal name>",
    "stockCode": "<Bursa code if listed, or null>",
    "marketCap": "<if known, or null>",
    "isListed": <true|false>,
    "country": "Malaysia"
  },
  "shareholders": [
    {
      "name": "<shareholder name>",
      "percentage": <ownership %>,
      "type": "<Individual|Corporate|Fund|Government>",
      "isListed": <true|false>,
      "stockCode": "<if listed>"
    }
  ],
  "subsidiaries": [
    {
      "name": "<subsidiary name>",
      "percentage": <ownership %>,
      "isListed": <true|false>,
      "stockCode": "<if listed>"
    }
  ],
  "directors": [
    {
      "name": "<director name>",
      "position": "<designation>",
      "otherDirectorships": ["<other companies>"]
    }
  ],
  "riskFlags": [
    "<any circular ownership, layering, or concentration risk noted>"
  ],
  "sources": ["<source URLs used>"]
}

Only include data you can verify from the sources. Mark as null if unknown.`;

      const aiResult = await callAI(apiKey, forensicPrompt);
      let forensicData;
      try {
        const jsonMatch = aiResult.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiResult];
        forensicData = JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        try { forensicData = JSON.parse(aiResult.trim()); } catch (e2) {
          forensicData = { entity: { name: entity }, shareholders: [], subsidiaries: [], directors: [], riskFlags: [], sources: [] };
        }
      }

      return new Response(JSON.stringify({ success: true, forensic: forensicData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Intelligence error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
