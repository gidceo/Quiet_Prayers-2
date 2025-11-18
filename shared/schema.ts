import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const prayers = pgTable("prayers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  category: text("category").notNull().default('Other'),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  authorName: text("author_name"),
  liftUpCount: integer("lift_up_count").notNull().default(0),
  isModerated: boolean("is_moderated").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = ['Faith', 'Health', 'Relationships', 'Work', 'Other'] as const;
export type Category = typeof categories[number];

export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Prevent accidental cascade-deletes of prayers: use RESTRICT so a prayer cannot
  // be removed implicitly by deleting related bookmarks.
  prayerId: varchar("prayer_id").notNull().references(() => prayers.id, { onDelete: "restrict" }),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const liftUps = pgTable("lift_ups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Same reasoning as bookmarks: do not cascade-delete prayers when lift-ups are removed.
  prayerId: varchar("prayer_id").notNull().references(() => prayers.id, { onDelete: "restrict" }),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  authorName: text("author_name"),
  isModerated: boolean("is_moderated").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id, { onDelete: "restrict" }),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  authorName: text("author_name"),
  isModerated: boolean("is_moderated").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const prayerComments = pgTable("prayer_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prayerId: varchar("prayer_id").notNull().references(() => prayers.id, { onDelete: "restrict" }),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  authorName: text("author_name"),
  isModerated: boolean("is_moderated").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dailyInspirations = pgTable("daily_inspirations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  attribution: text("attribution").notNull(),
  type: text("type").notNull(), // 'verse', 'quote', 'thought'
});

export const insertPrayerSchema = createInsertSchema(prayers).omit({
  id: true,
  liftUpCount: true,
  isModerated: true,
  createdAt: true,
  isAnonymous: true,
}).extend({
  content: z.string().min(10, "Prayer must be at least 10 characters").max(1000, "Prayer must be less than 1000 characters"),
  category: z.enum(['Faith', 'Health', 'Relationships', 'Work', 'Other'] as const).optional(),
  authorName: z.string().max(100).optional(),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  isModerated: true,
  createdAt: true,
  isAnonymous: true,
}).extend({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  content: z.string().min(10, "Question must be at least 10 characters").max(2000),
  authorName: z.string().max(100).optional(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  questionId: true,
  isModerated: true,
  createdAt: true,
  isAnonymous: true,
}).extend({
  content: z.string().min(1, "Comment cannot be empty").max(1000),
  authorName: z.string().max(100).optional(),
});

export const insertPrayerCommentSchema = createInsertSchema(prayerComments).omit({
  id: true,
  prayerId: true,
  isModerated: true,
  createdAt: true,
  isAnonymous: true,
}).extend({
  content: z.string().min(1, "Comment cannot be empty").max(1000),
  authorName: z.string().max(100).optional(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertLiftUpSchema = createInsertSchema(liftUps).omit({
  id: true,
  createdAt: true,
});

export const insertDailyInspirationSchema = createInsertSchema(dailyInspirations).omit({
  id: true,
});

export type InsertPrayer = z.infer<typeof insertPrayerSchema>;
export type Prayer = typeof prayers.$inferSelect;

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

export type InsertLiftUp = z.infer<typeof insertLiftUpSchema>;
export type LiftUp = typeof liftUps.$inferSelect;

export type InsertDailyInspiration = z.infer<typeof insertDailyInspirationSchema>;
export type DailyInspiration = typeof dailyInspirations.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertPrayerComment = z.infer<typeof insertPrayerCommentSchema>;
export type PrayerComment = typeof prayerComments.$inferSelect;
