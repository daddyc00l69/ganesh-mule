import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma, isDatabaseOnline } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const startTime = performance.now();
    const dbOnline = await isDatabaseOnline();
    let dbLatencyMs = 0;

    if (dbOnline) {
      const probeStart = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Math.round(performance.now() - probeStart);
    }

    // Account counts and store telemetry from live database
    const [
      totalDevelopers,
      totalAdmins,
      totalManagers,
      totalCustomers,
      activeStaff,
      disabledStaff,
      recentAuditLogs,
      totalProducts,
      totalCategories,
      totalOrders,
      activeSessions,
      lowStockProducts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'DEVELOPER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'MANAGER' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: { in: ['DEVELOPER', 'ADMIN', 'MANAGER'] }, isActive: true } }),
      prisma.user.count({ where: { role: { in: ['DEVELOPER', 'ADMIN', 'MANAGER'] }, isActive: false } }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { name: true, email: true, role: true } } },
      }),
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.count(),
      prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
      prisma.product.count({ where: { stockQuantity: { lte: 5 } } }),
    ]);

    // Integration status verification
    const integrations = {
      razorpay: {
        configured: Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        keyIdMasked: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
          ? `${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.slice(0, 8)}...`
          : 'Missing',
        webhookConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
      },
      delhivery: {
        configured: Boolean(process.env.DELHIVERY_API_KEY && process.env.DELHIVERY_CLIENT_ID),
        clientId: process.env.DELHIVERY_CLIENT_ID || 'Missing',
        apiKeyMasked: process.env.DELHIVERY_API_KEY
          ? `${process.env.DELHIVERY_API_KEY.slice(0, 6)}...`
          : 'Missing',
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'staging',
      },
      resend: {
        configured: Boolean(process.env.RESEND_API_KEY),
        fromEmail: process.env.EMAIL_FROM || process.env.AUTH_EMAIL_FROM || 'orders@devtushar.uk',
      },
      chatwoot: {
        configured: Boolean(process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN),
        baseUrl: process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://app.chatwoot.com',
      },
      googleOAuth: {
        configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        clientIdMasked: process.env.GOOGLE_CLIENT_ID
          ? `${process.env.GOOGLE_CLIENT_ID.slice(0, 12)}...`
          : 'Missing',
      },
    };

    // System Telemetry
    const memory = process.memoryUsage();
    const system = {
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
      },
      database: {
        online: dbOnline,
        latencyMs: dbLatencyMs,
        provider: 'PostgreSQL (Prisma Accelerate / Direct Pool)',
      },
    };

    return NextResponse.json({
      success: true,
      stats: {
        totalDevelopers,
        totalAdmins,
        totalManagers,
        totalCustomers,
        activeStaff,
        disabledStaff,
      },
      storeMetrics: {
        totalProducts,
        totalCategories,
        totalOrders,
        activeSessions,
        lowStockProducts,
      },
      system,
      integrations,
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
        actorName: log.actor?.name || 'System / Automated',
        actorEmail: log.actor?.email || 'system@internal',
        actorRole: log.actor?.role || 'SYSTEM',
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to collect developer telemetry', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - start);

    return NextResponse.json({
      success: true,
      online: true,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Database ping test failed', details: err.message, online: false },
      { status: 500 }
    );
  }
}
