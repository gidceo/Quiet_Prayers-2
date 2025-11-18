import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPrayerSchema, insertBookmarkSchema, insertLiftUpSchema, insertQuestionSchema, insertCommentSchema, insertPrayerCommentSchema } from "@shared/schema";
import { moderateContent } from "./moderation";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all prayers
  app.get("/api/prayers", async (_req, res) => {
    try {
      const prayers = await storage.getPrayers();
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prayers" });
    }
  });

  // Create a prayer
  app.post("/api/prayers", async (req, res) => {
    try {
      const data = insertPrayerSchema.parse(req.body);
      
      // Auto-detect anonymity based on author name
      const isAnonymous = !data.authorName || data.authorName.trim() === "";
      
      // Content moderation
      const contentCheck = moderateContent(data.content);
      if (contentCheck.isProfane) {
        return res.status(400).json({ error: contentCheck.message });
      }
      
      if (data.authorName) {
        const nameCheck = moderateContent(data.authorName);
        if (nameCheck.isProfane) {
          return res.status(400).json({ error: "Please use an appropriate name." });
        }
      }

      const prayer = await storage.createPrayer({ ...data, isAnonymous });
      // log created prayer for debugging visibility
      // eslint-disable-next-line no-console
      console.log("Created prayer:", { id: prayer.id, content: prayer.content.slice(0, 80) });
      res.status(201).json(prayer);
    } catch (error: any) {
      if (error.errors) {
        res.status(400).json({ error: error.errors[0].message });
      } else {
        res.status(500).json({ error: "Failed to create prayer" });
      }
    }
  });

  // Lift up a prayer
  app.post("/api/prayers/lift-up", async (req, res) => {
    try {
      const data = insertLiftUpSchema.parse(req.body);
      
      // Check if already lifted up
      const hasLifted = await storage.hasLiftedUp(data.prayerId, data.sessionId);
      if (hasLifted) {
        return res.status(400).json({ error: "Already lifted up this prayer" });
      }

      await storage.createLiftUp(data);
      
      // Update prayer lift up count
      const count = await storage.getLiftUpCount(data.prayerId);
      await storage.updatePrayerLiftUpCount(data.prayerId, count);
      
      res.status(201).json({ success: true, count });
    } catch (error: any) {
      if (error.errors) {
        res.status(400).json({ error: error.errors[0].message });
      } else {
        res.status(500).json({ error: "Failed to lift up prayer" });
      }
    }
  });

  // Check if user has lifted up or bookmarked a prayer
  app.get("/api/prayers/:prayerId/status", async (req, res) => {
    try {
      const { prayerId } = req.params;
      const sessionId = req.query.sessionId as string;

      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }

      const hasLifted = await storage.hasLiftedUp(prayerId, sessionId);
      const hasBookmark = await storage.hasBookmark(prayerId, sessionId);

      res.json({ hasLifted, hasBookmark });
    } catch (error) {
      res.status(500).json({ error: "Failed to check prayer status" });
    }
  });

  // Get bookmarked prayers
  app.get("/api/bookmarks/prayers", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }

      const prayers = await storage.getBookmarkedPrayers(sessionId);
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookmarked prayers" });
    }
  });

  // Create a bookmark
  app.post("/api/bookmarks", async (req, res) => {
    try {
      const data = insertBookmarkSchema.parse(req.body);
      
      // Check if already bookmarked
      const hasBookmark = await storage.hasBookmark(data.prayerId, data.sessionId);
      if (hasBookmark) {
        return res.status(400).json({ error: "Prayer already bookmarked" });
      }

      const bookmark = await storage.createBookmark(data);
      res.status(201).json(bookmark);
    } catch (error: any) {
      if (error.errors) {
        res.status(400).json({ error: error.errors[0].message });
      } else {
        res.status(500).json({ error: "Failed to create bookmark" });
      }
    }
  });

  // Delete a bookmark
  app.delete("/api/bookmarks/:prayerId", async (req, res) => {
    try {
      const { prayerId } = req.params;
      const sessionId = req.query.sessionId as string;

      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }

      await storage.deleteBookmark(prayerId, sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bookmark" });
    }
  });

  // Get daily inspiration
  app.get("/api/daily-inspiration", async (_req, res) => {
    try {
      const inspiration = await storage.getDailyInspiration();
      if (!inspiration) {
        return res.status(404).json({ error: "No inspiration found" });
      }
      res.json(inspiration);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily inspiration" });
    }
  });

  // Q&A: Get all questions
  app.get("/api/questions", async (_req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Q&A: Create a question
  app.post("/api/questions", async (req, res) => {
    try {
      const data = insertQuestionSchema.parse(req.body);
      
      // Auto-detect anonymity based on author name
      const isAnonymous = !data.authorName || data.authorName.trim() === "";

      // Content moderation
      const titleCheck = moderateContent(data.title);
      if (titleCheck.isProfane) {
        return res.status(400).json({ error: titleCheck.message });
      }

      const contentCheck = moderateContent(data.content);
      if (contentCheck.isProfane) {
        return res.status(400).json({ error: contentCheck.message });
      }

      const question = await storage.createQuestion({ ...data, isAnonymous });
      res.status(201).json(question);
    } catch (error: any) {
      if (error.errors) {
        res.status(400).json({ error: error.errors[0].message });
      } else {
        res.status(500).json({ error: "Failed to create question" });
      }
    }
  });

  // Q&A: Get comments for a question
  app.get("/api/questions/:questionId/comments", async (req, res) => {
    try {
      const { questionId } = req.params;
      const comments = await storage.getCommentsByQuestion(questionId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Q&A: Post a comment to a question
  app.post("/api/questions/:questionId/comments", async (req, res) => {
    try {
      const { questionId } = req.params;
      const body = { ...req.body, questionId };
      const data = insertCommentSchema.parse(body);
      
      // Auto-detect anonymity based on author name
      const isAnonymous = !data.authorName || data.authorName.trim() === "";

      // Moderate comment content
      const contentCheck = moderateContent(data.content);
      if (contentCheck.isProfane) {
        return res.status(400).json({ error: contentCheck.message });
      }

      const comment = await storage.createComment({ ...data, questionId, isAnonymous });
      res.status(201).json(comment);
    } catch (error: any) {
      if (error.errors) {
        res.status(400).json({ error: error.errors[0].message });
      } else {
        res.status(500).json({ error: "Failed to create comment" });
      }
    }
  });

  // Prayer comments: Get comments for a prayer
  app.get("/api/prayers/:prayerId/comments", async (req, res) => {
    try {
      const { prayerId } = req.params;
      const comments = await storage.getCommentsByPrayer(prayerId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prayer comments" });
    }
  });

  // Prayer comments: Post a comment to a prayer
  app.post("/api/prayers/:prayerId/comments", async (req, res) => {
    try {
      const { prayerId } = req.params;
      const body = { ...req.body, prayerId };
      const data = insertPrayerCommentSchema.parse(body);
      
      // Auto-detect anonymity based on author name
      const isAnonymous = !data.authorName || data.authorName.trim() === "";

      const contentCheck = moderateContent(data.content);
      if (contentCheck.isProfane) {
        return res.status(400).json({ error: contentCheck.message });
      }

      const comment = await storage.createPrayerComment({ ...data, prayerId, isAnonymous });
      res.status(201).json(comment);
    } catch (error: any) {
      if (error.errors) {
        res.status(400).json({ error: error.errors[0].message });
      } else {
        res.status(500).json({ error: "Failed to create prayer comment" });
      }
    }
  });

  // Health endpoint: returns storage type and basic counts for monitoring
  app.get('/api/health', async (_req, res) => {
    try {
      const prayers = await storage.getPrayers();
      const questions = await storage.getQuestions();

      // Count prayer comments and question comments (works for small datasets; intended for monitoring)
      let prayerComments = 0;
      for (const p of prayers) {
        const comments = await storage.getCommentsByPrayer(p.id);
        prayerComments += comments.length;
      }

      let questionComments = 0;
      for (const q of questions) {
        const comments = await storage.getCommentsByQuestion(q.id);
        questionComments += comments.length;
      }

      const storageType = process.env.DATABASE_URL ? 'Postgres' : 'Mem';

      res.json({
        storage: storageType,
        counts: {
          prayers: prayers.length,
          questions: questions.length,
          prayerComments,
          questionComments,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch health' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
