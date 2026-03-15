import { GoogleGenAI } from "@google/genai";
import { IPOAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getAIResponse(
  prompt: string, 
  analysis: IPOAnalysis, 
  history: { role: "user" | "model", parts: { text: string }[] }[], 
  drhpUrl?: string,
  upcomingIpos?: any[],
  marketUpdates?: any[]
) {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `You are a Senior IPO Analyst at a top-tier investment bank. 
Your task is to provide deep insights, risk assessments, and investment advice based on the provided IPO analysis data.
Always maintain a professional, data-driven, and objective tone.
Use terminal-style formatting (bullet points, clear sections).
The current IPO being analyzed is: ${analysis.company.name}.
${drhpUrl ? `\nNote: The user has provided a DRHP report at ${drhpUrl}. Incorporate insights from this document if possible (simulated context).` : ''}

Context Data (Current Analysis):
${JSON.stringify(analysis, null, 2)}

${upcomingIpos ? `\nUpcoming IPO Calendar Data:\n${JSON.stringify(upcomingIpos, null, 2)}` : ''}
${marketUpdates ? `\nMarket Updates & News:\n${JSON.stringify(marketUpdates, null, 2)}` : ''}

When answering:
1. Refer to specific financial metrics (P/E, ROE, Debt/Equity).
2. Compare with peers if relevant.
3. Highlight specific risks or red flags.
4. Provide a clear "Analyst's Take" at the end of long responses.
5. Keep responses concise but information-dense.
6. If the user asks about other upcoming IPOs or general market trends, refer to the provided Calendar and Market Updates data.`;

  try {
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
      },
      history: history.slice(0, -1), // History without the latest message
    });

    const response = await chat.sendMessage({
      message: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw new Error("Failed to get response from AI Analyst.");
  }
}
