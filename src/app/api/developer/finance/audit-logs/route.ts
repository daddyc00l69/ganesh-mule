import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma, isDatabaseOnline } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '30', 10)));

  const dbOnline = await isDatabaseOnline();
  let logs: any[] = [];
  let totalCount = 0;

  if (dbOnline) {
    try {
      const where: any = {};
      if (category) {
        where.category = category;
      }

      totalCount = await prisma.platformFinancialAuditLog.count({ where });
      logs = await prisma.platformFinancialAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (err) {
      console.warn('[AuditLogsAPI] Query error:', err);
    }
  }

  return NextResponse.json({
    success: true,
    logs,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  });
}
