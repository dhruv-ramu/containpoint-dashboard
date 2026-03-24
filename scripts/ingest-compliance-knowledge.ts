/**
 * Chunk markdown files under data/compliance-knowledge/, embed with OpenAI,
 * and upsert rows in ComplianceKnowledgeChunk.
 *
 * Usage: npm run ingest:knowledge (loads dashboard/.env)
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { config as loadEnv } from "dotenv";
import { embedMany } from "ai";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";
import { createOpenAI } from "@ai-sdk/openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
loadEnv({ path: path.join(ROOT, ".env") });
const KNOWLEDGE_DIR = path.join(ROOT, "data", "compliance-knowledge");

const MAX_CHARS = 2800;

async function withRetry<T>(label: string, fn: () => Promise<T>, retries = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const wait = 3000 * (i + 1);
      if (i < retries - 1) {
        console.warn(`${label} failed (attempt ${i + 1}/${retries}), retrying in ${wait}ms…`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw last;
}

function chunkMarkdown(source: string, raw: string): { title: string; content: string }[] {
  const lines = raw.split(/\r?\n/);
  const chunks: { title: string; content: string }[] = [];
  let currentTitle = source;
  let buf: string[] = [];

  function flush() {
    const text = buf.join("\n").trim();
    if (text.length < 40) {
      buf = [];
      return;
    }
    let body = text;
    if (body.length > MAX_CHARS) {
      for (let i = 0; i < body.length; i += MAX_CHARS) {
        chunks.push({
          title: `${currentTitle} (part ${Math.floor(i / MAX_CHARS) + 1})`,
          content: body.slice(i, i + MAX_CHARS),
        });
      }
    } else {
      chunks.push({ title: currentTitle, content: body });
    }
    buf = [];
  }

  for (const line of lines) {
    if (line.startsWith("# ")) {
      flush();
      currentTitle = line.replace(/^#\s+/, "").trim() || source;
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      currentTitle = `${source} — ${line.replace(/^##\s+/, "").trim()}`;
      continue;
    }
    buf.push(line);
  }
  flush();

  if (chunks.length === 0) {
    chunks.push({ title: source, content: raw.slice(0, MAX_CHARS) });
  }
  return chunks;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is required");
    process.exit(1);
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const dbUrl = process.env.DATABASE_URL;
  const isAccelerate =
    dbUrl.startsWith("prisma://") || dbUrl.startsWith("prisma+postgres://");
  const prisma = isAccelerate
    ? (new PrismaClient({
        accelerateUrl: dbUrl,
      }).$extends(withAccelerate()) as unknown as InstanceType<typeof PrismaClient>)
    : new PrismaClient({
        adapter: new PrismaPg({ connectionString: dbUrl }),
      });

  await withRetry("Database connect", () => prisma.$connect());

  const files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.error("No .md files in", KNOWLEDGE_DIR);
    process.exit(1);
  }

  type Row = {
    source: string;
    chunkIndex: number;
    title: string;
    content: string;
  };
  const rows: Row[] = [];

  for (const file of files.sort()) {
    const source = file;
    const raw = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), "utf8");
    const parts = chunkMarkdown(file, raw);
    parts.forEach((p, idx) => {
      rows.push({
        source,
        chunkIndex: idx,
        title: p.title,
        content: p.content,
      });
    });
  }

  await withRetry("Clear existing chunks", () => prisma.complianceKnowledgeChunk.deleteMany({}));

  console.log(`Embedding ${rows.length} chunks…`);
  const texts = rows.map((r) => `${r.title}\n\n${r.content}`);
  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: texts,
  });

  await withRetry("Insert chunks", () =>
    prisma.complianceKnowledgeChunk.createMany({
      data: rows.map((r, i) => ({
        source: r.source,
        chunkIndex: r.chunkIndex,
        title: r.title,
        content: r.content,
        embedding: embeddings[i],
      })),
    })
  );

  console.log(`Inserted ${rows.length} chunks.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
