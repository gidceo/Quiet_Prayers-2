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

  // Auto-seed daily inspirations in Postgres if none exist
  try {
    const existing = await storage.getAllInspirations();
    if (!existing || existing.length === 0) {
      const seeds = [
        { content: 'The Lord is my shepherd; I shall not want.', attribution: 'Psalm 23:1', type: 'verse' },
        { content: 'Be still, and know that I am God.', attribution: 'Psalm 46:10', type: 'verse' },
        { content: 'Peace begins with a smile.', attribution: 'Mother Teresa', type: 'quote' },
        { content: 'For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.', attribution: 'Jeremiah 29:11', type: 'verse' },
        { content: 'The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.', attribution: 'Numbers 6:24-25', type: 'verse' },
        { content: 'Trust in the Lord with all your heart and lean not on your own understanding.', attribution: 'Proverbs 3:5', type: 'verse' },
        { content: 'I can do all things through Christ who strengthens me.', attribution: 'Philippians 4:13', type: 'verse' },
        { content: 'The Lord is my light and my salvation—whom shall I fear?', attribution: 'Psalm 27:1', type: 'verse' },
        { content: 'Cast all your anxiety on him because he cares for you.', attribution: '1 Peter 5:7', type: 'verse' },
        { content: 'In all things God works for the good of those who love him.', attribution: 'Romans 8:28', type: 'verse' },
        { content: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', attribution: 'Philippians 4:6', type: 'verse' },
        { content: 'Come to me, all you who are weary and burdened, and I will give you rest.', attribution: 'Matthew 11:28', type: 'verse' },
        { content: 'The steadfast love of the Lord never ceases; his mercies never come to an end.', attribution: 'Lamentations 3:22', type: 'verse' },
        { content: 'God is our refuge and strength, an ever-present help in trouble.', attribution: 'Psalm 46:1', type: 'verse' },
        { content: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', attribution: 'Psalm 34:18', type: 'verse' },
        { content: 'For God so loved the world that he gave his one and only Son.', attribution: 'John 3:16', type: 'verse' },
        { content: 'Love the Lord your God with all your heart and with all your soul and with all your mind.', attribution: 'Matthew 22:37', type: 'verse' },
        { content: 'This is the day that the Lord has made; let us rejoice and be glad in it.', attribution: 'Psalm 118:24', type: 'verse' },
        { content: 'The fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness.', attribution: 'Galatians 5:22', type: 'verse' },
        { content: 'Whatever you do, work at it with all your heart, as working for the Lord.', attribution: 'Colossians 3:23', type: 'verse' },
        { content: 'Prayer is not asking. Prayer is putting oneself in the hands of God.', attribution: 'Mother Teresa', type: 'quote' },
        { content: 'Prayer is the key of the morning and the bolt of the evening.', attribution: 'Mahatma Gandhi', type: 'quote' },
        { content: 'To be a Christian without prayer is no more possible than to be alive without breathing.', attribution: 'Martin Luther', type: 'quote' },
        { content: 'Prayer does not change God, but it changes him who prays.', attribution: 'Søren Kierkegaard', type: 'quote' },
        { content: 'Let us not lose heart in doing good, for in due time we will reap if we do not grow weary.', attribution: 'Galatians 6:9', type: 'verse' },
        { content: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged.', attribution: 'Joshua 1:9', type: 'verse' },
        { content: 'The joy of the Lord is your strength.', attribution: 'Nehemiah 8:10', type: 'verse' },
        { content: 'Give thanks to the Lord, for he is good; his love endures forever.', attribution: 'Psalm 107:1', type: 'verse' },
        { content: 'And we know that in all things God works for the good of those who love him.', attribution: 'Romans 8:28', type: 'verse' },
        { content: 'Let your light shine before others, that they may see your good deeds.', attribution: 'Matthew 5:16', type: 'verse' },
        { content: 'Faith is taking the first step even when you don\'t see the whole staircase.', attribution: 'Martin Luther King Jr.', type: 'quote' },
        { content: 'God doesn\'t call the qualified. He qualifies the called.', attribution: 'Mark Batterson', type: 'quote' },
        { content: 'When you go through deep waters, I will be with you.', attribution: 'Isaiah 43:2', type: 'verse' },
        { content: 'Wait for the Lord; be strong and take heart and wait for the Lord.', attribution: 'Psalm 27:14', type: 'verse' },
        { content: 'Great is your faithfulness, O Lord.', attribution: 'Lamentations 3:23', type: 'verse' },
        { content: 'Nothing is impossible with God.', attribution: 'Luke 1:37', type: 'verse' },
        { content: 'Do not worry about tomorrow, for tomorrow will worry about itself.', attribution: 'Matthew 6:34', type: 'verse' },
        { content: 'The Lord will fight for you; you need only to be still.', attribution: 'Exodus 14:14', type: 'verse' },
        { content: 'He gives strength to the weary and increases the power of the weak.', attribution: 'Isaiah 40:29', type: 'verse' },
        { content: 'Those who hope in the Lord will renew their strength. They will soar on wings like eagles.', attribution: 'Isaiah 40:31', type: 'verse' },
        { content: 'Love is patient, love is kind. It does not envy, it does not boast.', attribution: '1 Corinthians 13:4', type: 'verse' },
        { content: 'Therefore, if anyone is in Christ, the new creation has come.', attribution: '2 Corinthians 5:17', type: 'verse' },
        { content: 'My grace is sufficient for you, for my power is made perfect in weakness.', attribution: '2 Corinthians 12:9', type: 'verse' },
        { content: 'Walk by faith, not by sight.', attribution: '2 Corinthians 5:7', type: 'verse' },
        { content: 'Rejoice always, pray continually, give thanks in all circumstances.', attribution: '1 Thessalonians 5:16-18', type: 'verse' },
        { content: 'As for me and my household, we will serve the Lord.', attribution: 'Joshua 24:15', type: 'verse' },
        { content: 'Blessed are the pure in heart, for they will see God.', attribution: 'Matthew 5:8', type: 'verse' },
        { content: 'Seek first his kingdom and his righteousness.', attribution: 'Matthew 6:33', type: 'verse' },
        { content: 'Your word is a lamp for my feet, a light on my path.', attribution: 'Psalm 119:105', type: 'verse' },
        { content: 'Create in me a pure heart, O God, and renew a steadfast spirit within me.', attribution: 'Psalm 51:10', type: 'verse' },
        { content: 'In moments of stillness, we find God\'s voice speaking to our hearts.', attribution: 'Anonymous', type: 'thought' },
        { content: 'Prayer is the bridge between panic and peace.', attribution: 'Anonymous', type: 'thought' },
        { content: 'God whispers in our joys, speaks in our conscience, but shouts in our pains.', attribution: 'C.S. Lewis', type: 'quote' },
        { content: 'The purpose of prayer is not to get what we want but to become what God wants.', attribution: 'Warren Wiersbe', type: 'quote' },
        { content: 'Pray as though everything depended on God. Work as though everything depended on you.', attribution: 'Augustine of Hippo', type: 'quote' },
        { content: 'He who has learned to pray has learned the greatest secret of a holy and happy life.', attribution: 'William Law', type: 'quote' },
        { content: 'Do not be overcome by evil, but overcome evil with good.', attribution: 'Romans 12:21', type: 'verse' },
        { content: 'Above all, love each other deeply, because love covers over a multitude of sins.', attribution: '1 Peter 4:8', type: 'verse' },
        { content: 'Let all that you do be done in love.', attribution: '1 Corinthians 16:14', type: 'verse' },
        { content: 'The Lord your God is with you, the Mighty Warrior who saves.', attribution: 'Zephaniah 3:17', type: 'verse' },
        { content: 'May the God of hope fill you with all joy and peace as you trust in him.', attribution: 'Romans 15:13', type: 'verse' },
        { content: 'For where two or three gather in my name, there am I with them.', attribution: 'Matthew 18:20', type: 'verse' },
        { content: 'The prayer of a righteous person is powerful and effective.', attribution: 'James 5:16', type: 'verse' },
      ];

      for (const s of seeds) {
        try {
          await storage.createDailyInspiration(s as any);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Failed to seed daily inspiration:', e);
        }
      }
      // eslint-disable-next-line no-console
      console.log(`Seeded ${seeds.length} daily inspirations`);
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
