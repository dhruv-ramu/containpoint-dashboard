import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrisma> };

function createPrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const isAccelerate =
    url.startsWith("prisma://") || url.startsWith("prisma+postgres://");

  if (isAccelerate) {
    return new PrismaClient({
      accelerateUrl: url,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    }).$extends(withAccelerate()) as unknown as InstanceType<typeof PrismaClient>;
  }

  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
