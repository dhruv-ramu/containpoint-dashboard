import { embed, cosineSimilarity } from "ai";
import { prisma } from "@/lib/db";
import { getOpenAIProvider } from "@/lib/openai-provider";

function parseEmbedding(json: unknown): number[] | null {
  if (!Array.isArray(json)) return null;
  const out: number[] = [];
  for (const x of json) {
    if (typeof x !== "number" || !Number.isFinite(x)) return null;
    out.push(x);
  }
  return out.length > 0 ? out : null;
}

export async function embedQuery(text: string): Promise<number[]> {
  const openai = getOpenAIProvider();
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text,
  });
  return embedding;
}

export type RagHit = {
  source: string;
  title: string;
  content: string;
  score: number;
};

/**
 * Cosine similarity search over stored chunks (JSON embeddings).
 * Suitable for hundreds of chunks; migrate to pgvector for very large corpora.
 */
export async function searchComplianceKnowledge(
  query: string,
  topK = 6
): Promise<RagHit[]> {
  const queryEmbedding = await embedQuery(query);
  const rows = await prisma.complianceKnowledgeChunk.findMany({
    select: {
      source: true,
      title: true,
      content: true,
      embedding: true,
    },
  });

  const scored: RagHit[] = [];
  for (const row of rows) {
    const emb = parseEmbedding(row.embedding);
    if (!emb || emb.length !== queryEmbedding.length) continue;
    const score = cosineSimilarity(queryEmbedding, emb);
    scored.push({
      source: row.source,
      title: row.title,
      content: row.content,
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

export function formatRagContext(hits: RagHit[]): string {
  if (hits.length === 0) {
    return "No indexed compliance documents were found. Suggest running `npm run ingest:knowledge` after setting OPENAI_API_KEY.";
  }
  return hits
    .map(
      (h, i) =>
        `### Source ${i + 1}: ${h.title} (${h.source})\nRelevance: ${h.score.toFixed(3)}\n\n${h.content}`
    )
    .join("\n\n---\n\n");
}
