import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  if (!process.env.SQL_HOST) {
    throw new Error("DATABASE_URL (Neon Postgres) or SQL_HOST must be set in environment variables.");
  }
  if (!process.env.SQL_DB_NAME) {
    throw new Error("SQL_DB_NAME must be set in environment variables.");
  }
  if (!process.env.SQL_ADMIN_USER && !process.env.SQL_USER) {
    throw new Error("SQL_ADMIN_USER must be set in environment variables.");
  }
  if (!process.env.SQL_ADMIN_PASSWORD && !process.env.SQL_PASSWORD) {
    throw new Error("SQL_ADMIN_PASSWORD must be set in environment variables.");
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: databaseUrl
    ? {
        url: databaseUrl,
      }
    : {
        host: process.env.SQL_HOST!,
        user: (process.env.SQL_ADMIN_USER || process.env.SQL_USER)!,
        password: (process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD)!,
        database: process.env.SQL_DB_NAME!,
        ssl: process.env.SQL_SSL === "true" ? { rejectUnauthorized: false } : false,
      },
  verbose: true,
});
