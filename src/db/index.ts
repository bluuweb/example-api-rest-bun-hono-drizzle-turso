import { drizzle } from "drizzle-orm/libsql";

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error("🚫 TURSO_DATABASE_URL is required");
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error("🚫 TURSO_AUTH_TOKEN is required");
}

export const db = drizzle({
  connection: {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
