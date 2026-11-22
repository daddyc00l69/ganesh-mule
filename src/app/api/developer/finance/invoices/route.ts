import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { generatePlatformInvoice } from '@/lib/finance/invoice-service';

const CreateInvoiceSchema = z.object({
  orderId: z.string().optional(),
  orderNumber: z.string().optional(),
  transactionId: z.string().optional(),
  clientBusinessName: z.string().optional(),
  clientGstin: z.string().optional().nullable(),
  taxableAmountPaise: z.number().int().positive(),
  gstRate: z.number().min(0).max(28).optional().default(18.0),
  placeOfSupplyStateCode: z.string().optional().default('27'),
  serviceDescription: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().toLowerCase() || '';
  const status = searchParams.get('status') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '25', 10)));

  const dbOnline = await isDatabaseOnline();
  let invoices: any[] = [];
  let totalCount = 0;

  if (dbOnline) {
    try {
      const where: any = {};
      if (q) {
        where.OR = [
          { invoiceNumber: { contains: q, mode: 'insensitive' } },
          { orderNumber: { contains: q, mode: 'insensitive' } },
          { clientBusinessName: { contains: q, mode: 'insensitive' } },
        ];
      }
      if (status) {
        where.status = status;
      }

      totalCount = await prisma.platformInvoice.count({ where });
      invoices = await prisma.platformInvoice.findMany({
        where,
        include: {
          transactions: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (err) {
      console.warn('[InvoicesAPI] Query error:', err);
    }
  }

  return NextResponse.json({
    success: true,
    invoices,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = CreateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid invoice creation payload', details: parsed.error },
        { status: 400 }
      );
    }

    const invoice = await generatePlatformInvoice(parsed.data);

    // Audit log
    const dbOnline = await isDatabaseOnline();
    if (dbOnline) {
      try {
        await prisma.platformFinancialAuditLog.create({
          data: {
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            category: 'PLATFORM_INVOICE',
            action: 'ISSUE_PLATFORM_INVOICE',
            newState: invoice as any,
            reason: `Issued platform invoice ${invoice.invoiceNumber}`,
          },
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: `Platform Invoice ${invoice.invoiceNumber} successfully issued.`,
      invoice,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to issue platform invoice', details: err.message },
      { status: 500 }
    );
  }
}
