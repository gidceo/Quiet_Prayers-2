import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { pool } from "./db";
import { storage } from "./storage";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // If a Postgres pool is available, run a quick connectivity check and log the result.
  if (pool) {
    try {
      await pool.query('SELECT 1');
      // eslint-disable-next-line no-console
      console.log('Postgres connectivity: OK');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Postgres connectivity: FAILED', err);
    }
  }

  // Auto-seed daily inspirations in Postgres if none exist (helps avoid 404s
  // for the daily inspiration endpoint on fresh databases).
  try {
    const insp = await storage.getDailyInspiration();
    if (!insp) {
      // seed a few gentle defaults
      const seeds = [
        { content: 'The Lord is my shepherd; I shall not want.', attribution: 'Psalm 23:1', type: 'verse' },
        { content: 'Be still, and know that I am God.', attribution: 'Psalm 46:10', type: 'verse' },
        { content: "Peace begins with a smile.", attribution: 'Mother Teresa', type: 'quote' },
      ];

      for (const s of seeds) {
        // createDailyInspiration exists on storage interface
        try {
          await storage.createDailyInspiration(s as any);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Failed to seed daily inspiration:', e);
        }
      }

      // log that we seeded entries
      // eslint-disable-next-line no-console
      console.log('Seeded default daily inspirations');
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Could not auto-seed daily inspirations:', e);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  // `reusePort` is not supported on some Windows environments and can
  // cause `ENOTSUP`. Only use it on non-Windows platforms.
  if (process.platform === 'win32') {
    server.listen(port, '0.0.0.0', () => {
      log(`serving on port ${port}`);
    });
  } else {
    server.listen({
      port,
      host: '0.0.0.0',
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  }
})();
