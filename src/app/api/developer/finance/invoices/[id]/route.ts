import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { getPlatformBusinessProfile } from '@/lib/finance/settings-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const dbOnline = await isDatabaseOnline();
  let invoice: any = null;

  if (dbOnline) {
    try {
      invoice = await prisma.platformInvoice.findFirst({
        where: {
          OR: [{ id }, { invoiceNumber: id }],
        },
        include: {
          transactions: {
            include: {
              order: true,
            },
          },
        },
      });
    } catch {}
  }

  if (!invoice) {
    return NextResponse.json({ error: 'Platform invoice not found' }, { status: 404 });
  }

  const profile = await getPlatformBusinessProfile();

  return NextResponse.json({
    success: true,
    invoice,
    supplierProfile: profile,
  });
}
