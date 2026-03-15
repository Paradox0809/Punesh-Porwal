import { GoogleGenAI, Type } from "@google/genai";
import { IPOAnalysis, MetricStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeIPO(query: string): Promise<IPOAnalysis> {
  let gmpContext = "";
  try {
    const gmpResponse = await fetch(`/api/gmp/${encodeURIComponent(query)}`);
    if (gmpResponse.ok) {
      const gmpData = await gmpResponse.json();
      gmpContext = `Latest GMP Scraped Data: ${gmpData.data}`;
    } else {
      gmpContext = "GMP data temporarily unavailable (Scraper Fallback)";
    }
  } catch (e) {
    gmpContext = "GMP data temporarily unavailable (Network Error)";
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze the IPO for "${query}". 
    ${gmpContext}
    IMPORTANT: Prioritize data from www.investorgain.com for the most accurate and up-to-date Grey Market Premium (GMP), price bands, and listing estimates.
    Provide a comprehensive investment report in JSON format. 
    Include advanced valuation models: DCF, FCF analysis, LBO feasibility, and Comps.
    If the company is a subsidiary, include the parent company name and ticker.
    Include a "priceHistory" array (last 30 days) and a "marketTrend" array (last 30 days).
    Use search grounding to get the latest data, specifically looking for the latest updates on investorgain.com.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          company: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              ticker: { type: Type.STRING },
              sector: { type: Type.STRING },
              industry: { type: Type.STRING },
              founded: { type: Type.STRING },
              hq: { type: Type.STRING },
              businessModel: { type: Type.STRING },
              parent: { type: Type.STRING },
            },
            required: ["name", "sector", "industry", "businessModel"],
          },
          ipoDetails: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              priceBand: {
                type: Type.OBJECT,
                properties: {
                  lower: { type: Type.NUMBER },
                  upper: { type: Type.NUMBER },
                },
              },
              lotSize: { type: Type.NUMBER },
              issueSize: { type: Type.STRING },
              freshIssue: { type: Type.STRING },
              ofs: { type: Type.STRING },
              proceedsUse: { type: Type.ARRAY, items: { type: Type.STRING } },
              preIpoInvestors: { type: Type.ARRAY, items: { type: Type.STRING } },
              brlm: { type: Type.STRING },
              registrar: { type: Type.STRING },
              lockUp: { type: Type.STRING },
              promoterHolding: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: Object.values(MetricStatus) },
                },
              },
            },
          },
          valuation: {
            type: Type.OBJECT,
            properties: {
              peRatio: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: Object.values(MetricStatus) },
                },
              },
              pbRatio: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: Object.values(MetricStatus) },
                },
              },
              evEbitda: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: Object.values(MetricStatus) },
                },
              },
              marketCap: { type: Type.STRING },
              listingGainEstimate: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  status: { type: Type.STRING, enum: Object.values(MetricStatus) },
                },
              },
              dcf: {
                type: Type.OBJECT,
                properties: {
                  fairValue: { type: Type.NUMBER },
                  upside: { type: Type.NUMBER },
                  assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
              fcf: {
                type: Type.OBJECT,
                properties: {
                  yield: { type: Type.NUMBER },
                  growth: { type: Type.NUMBER },
                },
              },
              lbo: {
                type: Type.OBJECT,
                properties: {
                  irr: { type: Type.NUMBER },
                  exitMultiple: { type: Type.NUMBER },
                },
              },
              comps: {
                type: Type.OBJECT,
                properties: {
                  averagePe: { type: Type.NUMBER },
                  impliedPrice: { type: Type.NUMBER },
                },
              },
            },
          },
          financials: {
            type: Type.OBJECT,
            properties: {
              revenue: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                    status: { type: Type.STRING, enum: Object.values(MetricStatus) },
                  },
                },
              },
              profit: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                    status: { type: Type.STRING, enum: Object.values(MetricStatus) },
                  },
                },
              },
              roe: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: Object.values(MetricStatus) },
                },
              },
              debtToEquity: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: Object.values(MetricStatus) },
                },
              },
            },
          },
          risks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                severity: { type: Type.STRING, enum: Object.values(MetricStatus) },
                description: { type: Type.STRING },
              },
            },
          },
          news: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                sentiment: { type: Type.STRING, enum: ["positive", "neutral", "negative"] },
                source: { type: Type.STRING },
                date: { type: Type.STRING },
              },
            },
          },
          gmp: {
            type: Type.OBJECT,
            properties: {
              current: { type: Type.NUMBER },
              trend: { type: Type.STRING, enum: ["up", "down", "flat"] },
              percentage: { type: Type.NUMBER },
            },
          },
          priceHistory: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                price: { type: Type.NUMBER },
                gmp: { type: Type.NUMBER },
              },
            },
          },
          marketTrend: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                indexValue: { type: Type.NUMBER },
                sentiment: { type: Type.NUMBER },
              },
            },
          },
          peers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                pe: { type: Type.NUMBER },
                marketCap: { type: Type.STRING },
              },
            },
          },
          verdict: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              recommendation: { type: Type.STRING, enum: ["Subscribe", "Avoid", "Neutral"] },
              summary: { type: Type.STRING },
            },
          },
        },
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to generate analysis");
  }

  return JSON.parse(response.text);
}

export async function getUpcomingIPOs(): Promise<any[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "List the top 10 upcoming mainboard IPOs in India. IMPORTANT: Prioritize data from www.investorgain.com for accurate dates, price bands, and status. Return as a JSON array of objects.",
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            sector: { type: Type.STRING },
            date: { type: Type.STRING },
            size: { type: Type.STRING },
            status: { type: Type.STRING, enum: ["Upcoming", "Open", "Closed"] },
          },
          required: ["name", "sector", "date", "size", "status"],
        },
      },
    },
  });

  return JSON.parse(response.text);
}

export async function getMarketUpdates(): Promise<any[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Provide the latest market updates and news regarding the Indian IPO market. IMPORTANT: Prioritize data from www.investorgain.com for accurate GMP changes and announcements. Return as a JSON array of objects.",
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            date: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ["title", "content", "date"],
        },
      },
    },
  });

  if (!response.text) {
    return [];
  }

  return JSON.parse(response.text);
}
