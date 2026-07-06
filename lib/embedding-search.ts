import { vectorDb } from "./vector-db";

export function upsertEmbedding(
  interactionId: string,
  embedding: Float32Array
): void {
  const stmt = vectorDb.prepare(`
    INSERT OR REPLACE INTO interaction_embeddings (interaction_id, embedding)
    VALUES (?, ?)
  `);
  stmt.run(interactionId, Buffer.from(embedding.buffer));
}

export function deleteEmbedding(interactionId: string): void {
  const stmt = vectorDb.prepare(`
    DELETE FROM interaction_embeddings WHERE interaction_id = ?
  `);
  stmt.run(interactionId);
}

export interface SimilarResult {
  interaction_id: string;
  distance: number;
}

export function findSimilarInteractions(
  queryEmbedding: Float32Array,
  limit: number = 10
): SimilarResult[] {
  const stmt = vectorDb.prepare(`
    SELECT interaction_id, distance
    FROM interaction_embeddings
    WHERE embedding MATCH ?
    ORDER BY distance
    LIMIT ?
  `);
  return stmt.all(
    Buffer.from(queryEmbedding.buffer),
    limit
  ) as SimilarResult[];
}
