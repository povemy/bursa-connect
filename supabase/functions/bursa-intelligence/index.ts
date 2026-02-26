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

function parseJSON(result: string, fallback: any) {
  try {
    const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result];
    return JSON.parse(jsonMatch[1].trim());
  } catch {
    try { return JSON.parse(result.trim()); } catch { return fallback; }
  }
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return jsonResponse({ success: false, error: 'AI not configured' }, 500);
    }

    const { action, stockData, newsContext, macroContext } = await req.json();

    // ===================== ANALYZE STOCK =====================
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
    {"category": "Fundamental Strength", "icon": "<positive|neutral|negative>", "summary": "<2-3 line summary>", "probability": <0-100>},
    {"category": "Earnings Quality", "icon": "<positive|neutral|negative>", "summary": "<2-3 line summary>", "probability": <0-100>},
    {"category": "Revenue Growth", "icon": "<positive|neutral|negative>", "summary": "<2-3 line summary>", "probability": <0-100>},
    {"category": "Balance Sheet Health", "icon": "<positive|neutral|negative>", "summary": "<2-3 line summary>", "probability": <0-100>},
    {"category": "Catalyst Strength", "icon": "<positive|neutral|negative>", "summary": "<2-3 line summary>", "probability": <0-100>},
    {"category": "Sentiment Momentum", "icon": "<positive|neutral|negative>", "summary": "<2-3 line summary>", "probability": <0-100>},
    {"category": "Structural Positioning", "icon": "<positive|neutral|negative>", "summary": "<2-3 line summary>", "probability": <0-100>},
    {"category": "Risk Exposure", "icon": "<positive|neutral|negative>", "summary": "<2-3 line summary>", "probability": <0-100>},
    {"category": "Macro Sensitivity", "icon": "<positive|neutral|negative>", "summary": "<2-3 line summary>", "probability": <0-100>},
    {"category": "Trap Risk", "icon": "<positive|neutral|negative>", "summary": "<2-3 line summary>", "probability": <0-100>}
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
      const parsed = parseJSON(result, { error: 'Failed to parse AI response', raw: result.substring(0, 500) });

      return jsonResponse({ success: true, analysis: parsed });
    }

    // ===================== DAILY SUGGESTIONS (RETAIL MODE) =====================
    if (action === 'daily_suggestions') {
      const prompt = `You are a Bursa Malaysia trading intelligence AI for RETAIL TRADERS with small capital.

Market Data (all stocks):
${JSON.stringify(stockData, null, 2)}

CRITICAL RULES:
- Prioritize UNDERRATED stocks with high confluence to move up, not just top gainers
- Look for: strong volume patterns, sector tailwinds, structural positioning, sentiment acceleration
- EXCLUDE stocks showing manipulation patterns (abnormal volume without fundamentals)
- Avoid look-ahead bias. Be time-sensitive.
- Generate suggestions in 3 CATEGORIES:

Category 1: Strong Setup (Mid/Large cap stocks with solid fundamentals)
Category 2: Undervalued Growth (stocks with undervalued metrics but growth potential)
Category 3: Penny / Cheap Stocks (price under RM2, sufficient liquidity, NOT trapped)

For penny stocks: EXCLUDE if trap probability > 50% or extreme manipulation detected.

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "symbol": "<stock symbol>",
      "name": "<stock name>",
      "category": "<Strong Setup|Undervalued Growth|Penny Focus>",
      "confidence": <0-100>,
      "riskLevel": "<Low|Medium|High>",
      "bias": "<Conditional Buy|Hold|Watch>",
      "keyReason": "<1 line reason>",
      "riskTriggers": "<monitoring triggers>",
      "opportunityScore": <0-100>,
      "hiddenRadar": <true|false>,
      "trapFlag": <true|false>,
      "trapProbability": <0-100>,
      "volatilityScore": <0-100>,
      "liquidityScore": <0-100>,
      "macroAlignment": "<Positive|Neutral|Negative>",
      "sectorTag": "<sector name>"
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
      const parsed = parseJSON(result, { suggestions: [], trapList: [], marketSummary: 'Analysis unavailable' });

      return jsonResponse({ success: true, ...parsed });
    }

    // ===================== MACRO ANALYSIS (WITH STOCK TAGS) =====================
    if (action === 'macro_analysis') {
      const prompt = `You are a global macro analyst focused on Bursa Malaysia impact. Analyze current macro factors and MAP them to specific Bursa stocks.

Context: ${macroContext || 'Analyze key global macro factors affecting Bursa Malaysia today.'}

${stockData ? `Available Bursa Stocks:\n${JSON.stringify(stockData, null, 2)}` : ''}

For EACH macro factor, identify the top 5-8 most sensitive Bursa Malaysia stocks and their exposure direction.

Return ONLY valid JSON:
{
  "factors": [
    {
      "factor": "<e.g. Crude Oil, Gold, Palm Oil, USD/MYR, US Markets, Geopolitics>",
      "direction": "<Bullish|Bearish|Neutral>",
      "impactStrength": <0-100>,
      "sectorExposure": ["<affected sectors>"],
      "timeHorizon": "<Short|Medium>",
      "summary": "<2-3 line impact summary>",
      "affectedStocks": [
        {
          "symbol": "<stock symbol e.g. 5183.KL>",
          "name": "<short name e.g. PETGAS>",
          "exposureDirection": "<Bullish|Bearish>",
          "sensitivityScore": <0-100>
        }
      ]
    }
  ],
  "overallBias": "<Bullish|Bearish|Neutral>",
  "overallSummary": "<3 line market macro outlook>"
}`;

      const result = await callAI(apiKey, prompt);
      const parsed = parseJSON(result, { factors: [], overallBias: 'Neutral', overallSummary: 'Analysis unavailable' });

      return jsonResponse({ success: true, ...parsed });
    }

    // ===================== QFE (QUANT FUSION ENGINE) =====================
    if (action === 'qfe_analysis') {
      const prompt = `You are the Quant Fusion Engine (QFE) — the FINAL probabilistic decision engine for a Bursa Malaysia stock.

This is NOT a summary. This is a structured quantitative synthesis.

Stock Data:
${JSON.stringify(stockData, null, 2)}

News Context: ${newsContext || 'None'}
Macro Context: ${macroContext || 'None'}

MATHEMATICAL FRAMEWORK:
1. Normalize all signals to 0-1 scale
2. Apply weighted fusion: Opportunity(25%), Risk_inv(20%), Macro(15%), Sentiment(10%), Structural(10%), Volume(10%), Sector(5%), Liquidity(5%), Trap_penalty(-15%)
3. Detect conflicts: |Opportunity-Macro| + |Sentiment-Risk| + |Structural-Liquidity|
4. Apply conviction decay if conflict > threshold
5. Run 3 strategy models: Trend-Following, Mean-Reversion, Breakout
6. Calculate target from ATR, momentum, volume multiplier
7. Calculate stop loss from support - ATR*liquidityFactor

RULES:
- NEVER provide financial guarantees
- ALL outputs must be probabilistic
- Express uncertainty bands
- Avoid look-ahead bias
- Be time-sensitive

Return ONLY valid JSON:
{
  "convictionScore": <0-100>,
  "setupClassification": "<High Probability|Moderate|Low Conviction|Avoid>",
  "targetZone": {"low": <number>, "high": <number>, "probability": <0-100>},
  "stopLossZone": {"low": <number>, "high": <number>},
  "estimatedDays": {"min": <number>, "max": <number>},
  "scenarioProbability": {"bull": <0-100>, "base": <0-100>, "bear": <0-100>},
  "signalConsensus": {
    "trendModel": {"signal": "<Bullish|Bearish|Neutral>", "score": <0-100>},
    "breakoutModel": {"signal": "<Bullish|Bearish|Neutral>", "score": <0-100>},
    "meanReversionModel": {"signal": "<Bullish|Bearish|Neutral>", "score": <0-100>}
  },
  "conflictSignals": [
    {"pair": "<signal A vs signal B>", "intensity": <0-100>, "description": "<brief>"}
  ],
  "convictionDecay": {"halfLifeDays": <number>, "currentDecayRate": <0-100>},
  "retailAdaptation": {
    "slippageRisk": <0-100>,
    "liquiditySuitability": <0-100>,
    "pennyVolatilityMultiplier": <number>,
    "manipulationAdjustment": <0-100>
  },
  "riskFactors": {
    "trapProbability": <0-100>,
    "liquidityRisk": "<Low|Medium|High>",
    "macroAlignment": "<Positive|Neutral|Negative>",
    "volatilityRegime": "<Low|Normal|High|Extreme>"
  },
  "weightProfile": "<Bull Market|Bear Market|High Volatility|Retail Penny>",
  "keyDrivers": ["<top 3 conviction drivers>"],
  "disclaimer": "Probabilistic analysis only. Not financial advice."
}`;

      const result = await callAI(apiKey, prompt);
      const parsed = parseJSON(result, { error: 'QFE analysis failed', raw: result.substring(0, 500) });

      return jsonResponse({ success: true, qfe: parsed });
    }

    // ===================== FORENSIC SEARCH =====================
    if (action === 'forensic_search') {
      const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (!firecrawlKey) {
        return jsonResponse({ success: false, error: 'Firecrawl not configured' }, 500);
      }

      const { entity } = stockData;

      // Search for ownership data with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `${entity} Malaysia corporate ownership shareholders subsidiaries directors Bursa`,
            limit: 5,
            tbs: 'qdr:m',
            scrapeOptions: { formats: ['markdown'] },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        const searchData = await searchRes.json();
        const sources = searchData?.data || [];

        const sourceTexts = sources.slice(0, 3).map((s: any) =>
          `Source: ${s.url}\n${(s.markdown || s.description || '').substring(0, 600)}`
        ).join('\n---\n');

        const forensicPrompt = `Extract corporate ownership structure for "${entity}" from these sources. Return ONLY valid JSON:

Sources:
${sourceTexts}

Return:
{
  "entity": {"name": "<full name>", "stockCode": "<Bursa code or null>", "marketCap": "<if known or null>", "isListed": <true|false>, "country": "Malaysia"},
  "shareholders": [{"name": "<name>", "percentage": <ownership %>, "type": "<Individual|Corporate|Fund|Government>", "isListed": <true|false>, "stockCode": "<if listed>"}],
  "subsidiaries": [{"name": "<name>", "percentage": <ownership %>, "isListed": <true|false>, "stockCode": "<if listed>"}],
  "directors": [{"name": "<name>", "position": "<designation>", "otherDirectorships": ["<other companies>"]}],
  "riskFlags": ["<any circular ownership, layering, or concentration risk>"],
  "sources": ["<source URLs>"]
}
Only include data verified from sources. Mark unknown as null.`;

        const aiResult = await callAI(apiKey, forensicPrompt);
        const forensicData = parseJSON(aiResult, {
          entity: { name: entity }, shareholders: [], subsidiaries: [], directors: [], riskFlags: [], sources: []
        });

        return jsonResponse({ success: true, forensic: forensicData });
      } catch (e) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') {
          // Timeout - try AI-only fallback without web scraping
          const fallbackPrompt = `Based on your knowledge, provide the corporate ownership structure for "${entity}" (a Malaysian/Bursa Malaysia entity). Return ONLY valid JSON with the same structure: entity, shareholders, subsidiaries, directors, riskFlags, sources. Mark unverified data clearly. Sources should say ["AI Knowledge Base"].`;
          const fallbackResult = await callAI(apiKey, fallbackPrompt);
          const fallbackData = parseJSON(fallbackResult, {
            entity: { name: entity, isListed: true, country: 'Malaysia' },
            shareholders: [], subsidiaries: [], directors: [], riskFlags: ['Data from AI knowledge - verify independently'], sources: ['AI Knowledge Base']
          });
          return jsonResponse({ success: true, forensic: fallbackData });
        }
        throw e;
      }
    }

    return jsonResponse({ success: false, error: 'Invalid action' }, 400);
  } catch (error) {
    console.error('Intelligence error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
});
