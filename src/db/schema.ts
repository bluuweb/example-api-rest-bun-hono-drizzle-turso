import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users_table", {
  id: integer("id").primaryKey(),
  username: text(),
  email: text().notNull().unique(),
  password: text().notNull(),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export const booksTable = sqliteTable("books_table", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

export type InsertBook = typeof booksTable.$inferInsert;
export type SelectBook = typeof booksTable.$inferSelect;
