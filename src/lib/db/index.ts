import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  isDbHealthy: boolean | undefined;
  lastDbCheck: number | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Fast non-blocking circuit breaker for offline or local dev database environments
const DB_PROBE_COOLDOWN_MS = 60000; // 60 seconds

export async function isDatabaseOnline(): Promise<boolean> {
  const now = Date.now();
  if (globalForPrisma.lastDbCheck && now - globalForPrisma.lastDbCheck < DB_PROBE_COOLDOWN_MS) {
    return globalForPrisma.isDbHealthy ?? false;
  }

  globalForPrisma.lastDbCheck = now;
  try {
    const probe = prisma.$queryRaw`SELECT 1`;
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB Probe Timeout')), 150)
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
