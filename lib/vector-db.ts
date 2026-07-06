import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import path from "path";

const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");

const globalForVectorDb = globalThis as unknown as {
  vectorDb: Database.Database | undefined;
};

function createVectorDb(): Database.Database {
  const db = new Database(DB_PATH);
  sqliteVec.load(db);

  // Create vector tables if they don't exist
  // 384 dimensions for all-MiniLM-L6-v2
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS interaction_embeddings USING vec0(
      interaction_id TEXT PRIMARY KEY,
      embedding float[384]
    );
  `);

  return db;
}

export const vectorDb =
  globalForVectorDb.vectorDb ?? createVectorDb();

if (process.env.NODE_ENV !== "production") {
  globalForVectorDb.vectorDb = vectorDb;
}
