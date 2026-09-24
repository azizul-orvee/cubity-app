import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function pooledUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.includes("-pooler")) return url;
  const next = new URL(url);
  if (!next.searchParams.has("pgbouncer")) next.searchParams.set("pgbouncer", "true");
  if (!next.searchParams.has("connection_limit")) next.searchParams.set("connection_limit", "1");
  return next.toString();
}

const databaseUrl = pooledUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
