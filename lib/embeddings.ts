import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

const globalForEmbedder = globalThis as unknown as {
  embeddingPipeline: Promise<FeatureExtractionPipeline> | undefined;
};

function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (!globalForEmbedder.embeddingPipeline) {
    globalForEmbedder.embeddingPipeline = pipeline(
      "feature-extraction",
      MODEL_NAME,
      { quantized: false }
    );
  }
  return globalForEmbedder.embeddingPipeline;
}

export async function generateEmbedding(text: string): Promise<Float32Array> {
  const extractor = await getEmbeddingPipeline();
  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });
  return new Float32Array(output.data as Float32Array);
}
