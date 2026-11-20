import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  isDbHealthy: boolean | undefined;
  lastDbCheck: number | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : [],
  });

globalForPrisma.prisma = prisma;

// Non-blocking circuit breaker: fast fail locally if Postgres isn't running; quick recovery on production VPS
const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
const isDevEnv = process.env.NODE_ENV === 'development';
const DB_HEALTHY_COOLDOWN_MS = 30_000;
const DB_OFFLINE_COOLDOWN_MS = isTestEnv ? 60_000 : isDevEnv ? 30_000 : 5_000;
const DB_PROBE_TIMEOUT_MS = Number(process.env.DB_PROBE_TIMEOUT_MS) || (isTestEnv ? 150 : isDevEnv ? 250 : 1_500);

export async function isDatabaseOnline(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    return false;
  }

  // Fast-fail: Vercel serverless containers cannot reach localhost
  if (process.env.VERCEL && (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'))) {
    return false;
  }

  const now = Date.now();
  const cooldown = globalForPrisma.isDbHealthy ? DB_HEALTHY_COOLDOWN_MS : DB_OFFLINE_COOLDOWN_MS;
  if (globalForPrisma.lastDbCheck && now - globalForPrisma.lastDbCheck < cooldown) {
    return globalForPrisma.isDbHealthy ?? false;
  }

  globalForPrisma.lastDbCheck = now;
  try {
    const probe = prisma.$queryRaw`SELECT 1`;
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB Probe Timeout')), DB_PROBE_TIMEOUT_MS)
    );
    await Promise.race([probe, timeout]);
    globalForPrisma.isDbHealthy = true;
    return true;
  } catch {
    globalForPrisma.isDbHealthy = false;
    return false;
  }
}

export default prisma;
