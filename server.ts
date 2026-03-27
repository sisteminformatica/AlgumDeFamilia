import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { put, del } from "@vercel/blob";

async function startServer() {
  const app = express();
  
  // Request logger
  app.use((req, res, next) => {
    console.log(`[Server] Incoming: ${req.method} ${req.url} (Content-Length: ${req.headers['content-length']})`);
    next();
  });

  // Middleware for large payloads
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  const PORT = 3000;

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Router
  const apiRouter = express.Router();

  // Vercel Blob Upload
  apiRouter.post("/upload", async (req, res) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[Server][${requestId}] POST /api/upload started. Body keys: ${Object.keys(req.body)}`);
    try {
      const { base64, path: filePath } = req.body;
      if (!base64) {
        console.error(`[Server][${requestId}] No base64 data provided`);
        return res.status(400).json({ error: "No base64 data provided" });
      }

      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) {
        console.error(`[Server][${requestId}] BLOB_READ_WRITE_TOKEN is missing`);
        return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN is missing in environment variables" });
      }

      // Clean token if user accidentally included the variable name or quotes
      const cleanToken = token.replace(/^BLOB_READ_WRITE_TOKEN=/, '').replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
      if (cleanToken !== token) {
        console.log(`[Server][${requestId}] Token was cleaned. Original length: ${token.length}, Cleaned length: ${cleanToken.length}`);
      }

      const match = base64.match(/^data:(.+);base64,(.*)$/);
      if (!match) {
        console.error(`[Server][${requestId}] Invalid base64 string format`);
        return res.status(400).json({ error: "Invalid base64 string" });
      }

      const mimeType = match[1];
      const data = match[2];
      const buffer = Buffer.from(data, 'base64');
      
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const fullPath = `${filePath}/${filename}`;

      console.log(`[Server][${requestId}] Uploading to Vercel Blob: ${fullPath} (${buffer.length} bytes)`);
      const blob = await put(fullPath, buffer, {
        contentType: mimeType,
        access: 'public',
        token: cleanToken
      });

      console.log(`[Server][${requestId}] Upload successful: ${blob.url}`);
      res.json({ url: blob.url });
    } catch (error: any) {
      console.error(`[Server][${requestId}] Upload error:`, error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vercel Blob Delete
  apiRouter.post("/delete", async (req, res) => {
    console.log(`[Server] POST /api/delete received for URL: ${req.body.url}`);
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "No URL provided" });
      }

      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) {
        return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN is missing" });
      }
      
      const cleanToken = token.replace(/^BLOB_READ_WRITE_TOKEN=/, '').replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');

      await del(url, {
        token: cleanToken
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("[Server] Delete error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Mount API Router
  app.use("/api", apiRouter);

  // API 404 handler - return JSON instead of HTML
  app.all("/api/*", (req, res) => {
    console.warn(`[Server] API 404: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // Global error handler for API routes
  app.use((err: any, req: any, res: any, next: any) => {
    if (req.originalUrl.startsWith('/api')) {
      console.error("[Server] API Error:", err);
      return res.status(err.status || 500).json({ 
        error: err.message || "Internal Server Error",
        details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
      });
    }
    next(err);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      
      app.get("*", async (req, res, next) => {
        if (req.originalUrl.startsWith('/api')) return next();
        try {
          const url = req.originalUrl;
          const template = await fs.readFile(path.resolve(process.cwd(), "index.html"), "utf-8");
          const html = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    } catch (e) {
      console.error("Failed to create Vite server:", e);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
