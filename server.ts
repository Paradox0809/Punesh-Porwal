import express from "express";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // GMP Scraper Endpoint
  app.get("/api/gmp/:company", async (req, res) => {
    const { company } = req.params;
    try {
      // Using Yahoo Search to avoid strict rate limits
      const searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(company)}+ipo+gmp+today`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 5000
      });

      const $ = cheerio.load(response.data);
      // Basic extraction of text snippets from search results to pass to Gemini
      const snippets: string[] = [];
      $('.compText').each((_, el) => {
        snippets.push($(el).text());
      });

      res.json({ 
        company,
        data: snippets.slice(0, 5).join('\n'),
        source: 'Yahoo Search Scraper'
      });
    } catch (error: any) {
      // Handle error gracefully without logging full stack trace
      const status = error?.response?.status || 503;
      const message = error?.message || 'Unknown error';
      console.warn(`Scraping warning: Failed to fetch GMP data (${status}: ${message})`);
      
      // Return 200 with empty data so the frontend doesn't break, 
      // Gemini will use its own search tool as a fallback.
      res.json({ 
        company,
        data: '',
        source: 'Fallback (Scraper Failed)'
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
