import {
  type Prayer,
  type InsertPrayer,
  type Bookmark,
  type InsertBookmark,
  type LiftUp,
  type InsertLiftUp,
  type DailyInspiration,
  type InsertDailyInspiration,
  type Question,
  type InsertQuestion,
  type Comment,
  type InsertComment,
  type PrayerComment,
  type InsertPrayerComment,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db, pool } from "./db";

export interface IStorage {
  // Prayers
  getPrayers(): Promise<Prayer[]>;
  getPrayer(id: string): Promise<Prayer | undefined>;
  createPrayer(prayer: InsertPrayer): Promise<Prayer>;
  updatePrayerLiftUpCount(id: string, count: number): Promise<void>;

  // Bookmarks
  getBookmarksBySession(sessionId: string): Promise<Bookmark[]>;
  getBookmarkedPrayers(sessionId: string): Promise<Prayer[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(prayerId: string, sessionId: string): Promise<void>;
  hasBookmark(prayerId: string, sessionId: string): Promise<boolean>;

  // Lift Ups
  createLiftUp(liftUp: InsertLiftUp): Promise<LiftUp>;
  hasLiftedUp(prayerId: string, sessionId: string): Promise<boolean>;
  getLiftUpCount(prayerId: string): Promise<number>;

  // Daily Inspiration
  getDailyInspiration(): Promise<DailyInspiration | undefined>;
  createDailyInspiration(inspiration: InsertDailyInspiration): Promise<DailyInspiration>;
  getAllInspirations(): Promise<DailyInspiration[]>;

  // Q&A
  getQuestions(): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;

  getCommentsByQuestion(questionId: string): Promise<Comment[]>;
  createComment(comment: InsertComment & { questionId: string }): Promise<Comment>;

  // Prayer comments
  getCommentsByPrayer(prayerId: string): Promise<PrayerComment[]>;
  createPrayerComment(comment: InsertPrayerComment & { prayerId: string }): Promise<PrayerComment>;
}

export class MemStorage implements IStorage {
  private prayers: Map<string, Prayer>;
  private bookmarks: Map<string, Bookmark>;
  private liftUps: Map<string, LiftUp>;
  private dailyInspirations: Map<string, DailyInspiration>;
  private questions: Map<string, Question>;
  private comments: Map<string, Comment>;
  private prayerComments: Map<string, PrayerComment>;

  constructor() {
    this.prayers = new Map();
    this.bookmarks = new Map();
    this.liftUps = new Map();
    this.dailyInspirations = new Map();
    this.questions = new Map();
    this.comments = new Map();
    this.prayerComments = new Map();
    this.seedDailyInspirations();
  }

  private async seedDailyInspirations() {
    const inspirations: InsertDailyInspiration[] = [
      {
        content: "The Lord is my shepherd; I shall not want.",
        attribution: "Psalm 23:1",
        type: "verse",
      },
      {
        content: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.",
        attribution: "Jeremiah 29:11",
        type: "verse",
      },
      {
        content: "Peace begins with a smile.",
        attribution: "Mother Teresa",
        type: "quote",
      },
      {
        content: "Prayer is not asking. Prayer is putting oneself in the hands of God.",
        attribution: "Mother Teresa",
        type: "quote",
      },
      {
        content: "Be still, and know that I am God.",
        attribution: "Psalm 46:10",
        type: "verse",
      },
      {
        content: "In moments of stillness, we find God's voice speaking to our hearts.",
        attribution: "Anonymous",
        type: "thought",
      },
      {
        content: "Cast all your anxiety on him because he cares for you.",
        attribution: "1 Peter 5:7",
        type: "verse",
      },
    ];

    for (const inspiration of inspirations) {
      await this.createDailyInspiration(inspiration);
    }
  }

  // Prayers
  async getPrayers(): Promise<Prayer[]> {
    return Array.from(this.prayers.values())
      .filter(p => p.isModerated)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getPrayer(id: string): Promise<Prayer | undefined> {
    return this.prayers.get(id);
  }

  async createPrayer(insertPrayer: InsertPrayer): Promise<Prayer> {
    const id = randomUUID();
    const prayer: Prayer = {
      ...insertPrayer,
      id,
      liftUpCount: 0,
      // Ensure required fields have concrete values matching the `Prayer` type
      isAnonymous: insertPrayer.isAnonymous ?? false,
      authorName: insertPrayer.authorName ?? null,
      category: (insertPrayer as any).category ?? 'Other',
      isModerated: true,
      createdAt: new Date(),
    };
    this.prayers.set(id, prayer);
    return prayer;
  }

  async updatePrayerLiftUpCount(id: string, count: number): Promise<void> {
    const prayer = this.prayers.get(id);
    if (prayer) {
      prayer.liftUpCount = count;
      this.prayers.set(id, prayer);
    }
  }

  // Questions (Q&A)
  async getQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.isModerated)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = {
      ...insertQuestion,
      id,
      isModerated: true,
      createdAt: new Date(),
    } as Question;
    this.questions.set(id, question);
    return question;
  }

  // Comments
  async getCommentsByQuestion(questionId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(c => c.questionId === questionId && c.isModerated)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getCommentsByPrayer(prayerId: string): Promise<PrayerComment[]> {
    return Array.from(this.prayerComments.values())
      .filter(c => c.prayerId === prayerId && c.isModerated)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createComment(insertComment: InsertComment & { questionId: string }): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...insertComment,
      id,
      questionId: insertComment.questionId,
      isModerated: true,
      createdAt: new Date(),
    } as Comment;
    this.comments.set(id, comment);
    return comment;
  }

  async createPrayerComment(insertComment: InsertPrayerComment & { prayerId: string }): Promise<PrayerComment> {
    const id = randomUUID();
    const comment: PrayerComment = {
      ...insertComment,
      id,
      prayerId: insertComment.prayerId,
      isModerated: true,
      createdAt: new Date(),
    } as PrayerComment;
    this.prayerComments.set(id, comment);
    return comment;
  }

  // Bookmarks
  async getBookmarksBySession(sessionId: string): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(b => b.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getBookmarkedPrayers(sessionId: string): Promise<Prayer[]> {
    const bookmarks = await this.getBookmarksBySession(sessionId);
    const prayerIds = bookmarks.map(b => b.prayerId);
    return Array.from(this.prayers.values())
      .filter(p => prayerIds.includes(p.id))
      .sort((a, b) => {
        const aBookmark = bookmarks.find(bm => bm.prayerId === a.id);
        const bBookmark = bookmarks.find(bm => bm.prayerId === b.id);
        return new Date(bBookmark!.createdAt).getTime() - new Date(aBookmark!.createdAt).getTime();
      });
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    const bookmark: Bookmark = {
      ...insertBookmark,
      id,
      createdAt: new Date(),
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async deleteBookmark(prayerId: string, sessionId: string): Promise<void> {
    const bookmark = Array.from(this.bookmarks.values())
      .find(b => b.prayerId === prayerId && b.sessionId === sessionId);
    if (bookmark) {
      this.bookmarks.delete(bookmark.id);
    }
  }

  async hasBookmark(prayerId: string, sessionId: string): Promise<boolean> {
    return Array.from(this.bookmarks.values())
      .some(b => b.prayerId === prayerId && b.sessionId === sessionId);
  }

  // Lift Ups
  async createLiftUp(insertLiftUp: InsertLiftUp): Promise<LiftUp> {
    const id = randomUUID();
    const liftUp: LiftUp = {
      ...insertLiftUp,
      id,
      createdAt: new Date(),
    };
    this.liftUps.set(id, liftUp);
    return liftUp;
  }

  async hasLiftedUp(prayerId: string, sessionId: string): Promise<boolean> {
    return Array.from(this.liftUps.values())
      .some(l => l.prayerId === prayerId && l.sessionId === sessionId);
  }

  async getLiftUpCount(prayerId: string): Promise<number> {
    return Array.from(this.liftUps.values())
      .filter(l => l.prayerId === prayerId)
      .length;
  }

  // Daily Inspiration
  async getDailyInspiration(): Promise<DailyInspiration | undefined> {
    const inspirations = Array.from(this.dailyInspirations.values()).sort((a, b) => 
      a.id.localeCompare(b.id)
    );
    if (inspirations.length === 0) return undefined;
    
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % inspirations.length;
    return inspirations[index];
  }

  async createDailyInspiration(insertInspiration: InsertDailyInspiration): Promise<DailyInspiration> {
    const id = randomUUID();
    const inspiration: DailyInspiration = {
      ...insertInspiration,
      id,
    };
    this.dailyInspirations.set(id, inspiration);
    return inspiration;
  }

  async getAllInspirations(): Promise<DailyInspiration[]> {
    return Array.from(this.dailyInspirations.values());
  }
}

// Postgres-backed storage using drizzle
export class PostgresStorage implements IStorage {
  // Helper mappers: convert snake_case DB rows to camelCase objects
  private mapPrayerRow(row: any): Prayer {
    return {
      id: String(row.id),
      content: row.content,
      category: row.category ?? 'Other',
      isAnonymous: Boolean(row.is_anonymous ?? false),
      authorName: row.author_name ?? null,
      liftUpCount: Number(row.lift_up_count ?? 0),
      isModerated: Boolean(row.is_moderated ?? true),
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    } as Prayer;
  }

  private mapQuestionRow(row: any): Question {
    return {
      id: String(row.id),
      title: row.title,
      content: row.content,
      isAnonymous: Boolean(row.is_anonymous ?? false),
      authorName: row.author_name ?? null,
      isModerated: Boolean(row.is_moderated ?? true),
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    } as Question;
  }

  private mapCommentRow(row: any): Comment {
    return {
      id: String(row.id),
      questionId: String(row.question_id),
      content: row.content,
      isAnonymous: Boolean(row.is_anonymous ?? false),
      authorName: row.author_name ?? null,
      isModerated: Boolean(row.is_moderated ?? true),
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    } as Comment;
  }

  private mapPrayerCommentRow(row: any): PrayerComment {
    return {
      id: String(row.id),
      prayerId: String(row.prayer_id),
      content: row.content,
      isAnonymous: Boolean(row.is_anonymous ?? false),
      authorName: row.author_name ?? null,
      isModerated: Boolean(row.is_moderated ?? true),
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    } as PrayerComment;
  }

  private mapBookmarkRow(row: any): Bookmark {
    return {
      id: String(row.id),
      prayerId: String(row.prayer_id),
      sessionId: row.session_id,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    } as Bookmark;
  }
  // Prayers
  async getPrayers(): Promise<Prayer[]> {
    const res = await pool!.query(`SELECT * FROM prayers WHERE is_moderated = true ORDER BY created_at DESC`);
    return res.rows.map((r: any) => this.mapPrayerRow(r));
  }

  async getPrayer(id: string): Promise<Prayer | undefined> {
    const res = await pool!.query(`SELECT * FROM prayers WHERE id = $1 LIMIT 1`, [id]);
    const row = res.rows[0];
    return row ? this.mapPrayerRow(row) : undefined;
  }

  async createPrayer(insertPrayer: InsertPrayer): Promise<Prayer> {
    const res = await pool!.query(
      `INSERT INTO prayers (content, category, is_anonymous, author_name, lift_up_count, is_moderated) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [insertPrayer.content, (insertPrayer as any).category ?? 'Other', insertPrayer.isAnonymous ?? false, insertPrayer.authorName ?? null, 0, true]
    );
    return this.mapPrayerRow(res.rows[0]);
  }

  async updatePrayerLiftUpCount(id: string, count: number): Promise<void> {
    await pool!.query(`UPDATE prayers SET lift_up_count = $1 WHERE id = $2`, [count, id]);
  }

  // Bookmarks
  async getBookmarksBySession(sessionId: string): Promise<Bookmark[]> {
    const res = await pool!.query(`SELECT * FROM bookmarks WHERE session_id = $1 ORDER BY created_at DESC`, [sessionId]);
    return res.rows.map((r: any) => this.mapBookmarkRow(r));
  }

  async getBookmarkedPrayers(sessionId: string): Promise<Prayer[]> {
    const res = await pool!.query(`SELECT p.* FROM prayers p INNER JOIN bookmarks b ON b.prayer_id = p.id WHERE b.session_id = $1 ORDER BY b.created_at DESC`, [sessionId]);
    return res.rows.map((r: any) => this.mapPrayerRow(r));
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const res = await pool!.query(
      `INSERT INTO bookmarks (prayer_id, session_id) VALUES ($1, $2) RETURNING *`,
      [insertBookmark.prayerId, insertBookmark.sessionId]
    );
    return this.mapBookmarkRow(res.rows[0]);
  }

  async deleteBookmark(prayerId: string, sessionId: string): Promise<void> {
    await pool!.query(`DELETE FROM bookmarks WHERE prayer_id = $1 AND session_id = $2`, [prayerId, sessionId]);
  }

  async hasBookmark(prayerId: string, sessionId: string): Promise<boolean> {
    const res = await pool!.query(`SELECT 1 FROM bookmarks WHERE prayer_id = $1 AND session_id = $2 LIMIT 1`, [prayerId, sessionId]);
    return (res.rowCount ?? 0) > 0;
  }

  // Lift Ups
  async createLiftUp(insertLiftUp: InsertLiftUp): Promise<LiftUp> {
    const res = await pool!.query(
      `INSERT INTO lift_ups (prayer_id, session_id) VALUES ($1, $2) RETURNING *`,
      [insertLiftUp.prayerId, insertLiftUp.sessionId]
    );
    // map fields: lift_ups uses created_at
    const row = res.rows[0];
    return {
      id: String(row.id),
      prayerId: String(row.prayer_id),
      sessionId: row.session_id,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    } as LiftUp;
  }

  async hasLiftedUp(prayerId: string, sessionId: string): Promise<boolean> {
    const res = await pool!.query(`SELECT 1 FROM lift_ups WHERE prayer_id = $1 AND session_id = $2 LIMIT 1`, [prayerId, sessionId]);
    return (res.rowCount ?? 0) > 0;
  }

  async getLiftUpCount(prayerId: string): Promise<number> {
    const res = await pool!.query(`SELECT count(*)::int FROM lift_ups WHERE prayer_id = $1`, [prayerId]);
    return Number(res.rows[0].count ?? 0);
  }

  // Daily Inspiration
  async getDailyInspiration(): Promise<DailyInspiration | undefined> {
    const res = await pool!.query(`SELECT * FROM daily_inspirations ORDER BY id ASC`);
    const inspirations = res.rows as DailyInspiration[];
    if (inspirations.length === 0) return undefined;
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % inspirations.length;
    return inspirations[index];
  }

  async createDailyInspiration(insertInspiration: InsertDailyInspiration): Promise<DailyInspiration> {
    const res = await pool!.query(
      `INSERT INTO daily_inspirations (content, attribution, type) VALUES ($1, $2, $3) RETURNING *`,
      [insertInspiration.content, insertInspiration.attribution, insertInspiration.type]
    );
    return res.rows[0] as DailyInspiration;
  }

  async getAllInspirations(): Promise<DailyInspiration[]> {
    const res = await pool!.query(`SELECT * FROM daily_inspirations`);
    return res.rows as DailyInspiration[];
  }

  // Q&A
  async getQuestions(): Promise<Question[]> {
    const res = await pool!.query(`SELECT * FROM questions WHERE is_moderated = true ORDER BY created_at DESC`);
    return res.rows.map((r: any) => this.mapQuestionRow(r));
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const res = await pool!.query(`SELECT * FROM questions WHERE id = $1 LIMIT 1`, [id]);
    const row = res.rows[0];
    return row ? this.mapQuestionRow(row) : undefined;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const res = await pool!.query(
      `INSERT INTO questions (title, content, is_anonymous, author_name, is_moderated) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [insertQuestion.title, insertQuestion.content, insertQuestion.isAnonymous ?? false, insertQuestion.authorName ?? null, true]
    );
    return this.mapQuestionRow(res.rows[0]);
  }

  async getCommentsByQuestion(questionId: string): Promise<Comment[]> {
    const res = await pool!.query(`SELECT * FROM comments WHERE question_id = $1 AND is_moderated = true ORDER BY created_at ASC`, [questionId]);
    return res.rows.map((r: any) => this.mapCommentRow(r));
  }

  async createComment(insertComment: InsertComment & { questionId: string }): Promise<Comment> {
    const res = await pool!.query(
      `INSERT INTO comments (question_id, content, is_anonymous, author_name, is_moderated) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [insertComment.questionId, insertComment.content, insertComment.isAnonymous ?? false, insertComment.authorName ?? null, true]
    );
    return this.mapCommentRow(res.rows[0]);
  }

  // Prayer comments
  async getCommentsByPrayer(prayerId: string): Promise<PrayerComment[]> {
    const res = await pool!.query(`SELECT * FROM prayer_comments WHERE prayer_id = $1 AND is_moderated = true ORDER BY created_at ASC`, [prayerId]);
    return res.rows.map((r: any) => this.mapPrayerCommentRow(r));
  }

  async createPrayerComment(insertComment: InsertPrayerComment & { prayerId: string }): Promise<PrayerComment> {
    const res = await pool!.query(
      `INSERT INTO prayer_comments (prayer_id, content, is_anonymous, author_name, is_moderated) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [insertComment.prayerId, insertComment.content, insertComment.isAnonymous ?? false, insertComment.authorName ?? null, true]
    );
    return this.mapPrayerCommentRow(res.rows[0]);
  }
}

const usingPostgres = Boolean(process.env.DATABASE_URL);
if (usingPostgres) {
  // Helpful runtime log so you can confirm persistence is active
  // when running the server locally.
  // Example output: `Storage backend: PostgresStorage`
  // If you see `MemStorage` you are running without `DATABASE_URL`.
  // Logs are shown in `server/index.ts` request logging block.
  // Keep this lightweight and informative.
  // eslint-disable-next-line no-console
  console.log("Storage backend: PostgresStorage");
} else {
  // eslint-disable-next-line no-console
  console.log("Storage backend: MemStorage (in-memory, not persisted)");
}

export const storage: IStorage = usingPostgres ? new PostgresStorage() : new MemStorage();
