import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import { getDbPath } from "./data-dir";

const globalForVectorDb = globalThis as unknown as {
  vectorDb: Database.Database | undefined;
};

function createVectorDb(): Database.Database {
  const db = new Database(getDbPath());
  sqliteVec.load(db);

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS
      interaction_embeddings USING vec0(
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
