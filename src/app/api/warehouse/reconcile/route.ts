import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { runWarehouseReconcileBatch } from '@/lib/warehouse/schedule';
import { getCurrentUser } from '@/lib/auth/server';
import { sendReconcileWhatsAppAlert } from '@/lib/whatsapp/baileys-service';

function hasValidCronSecret(req: NextRequest): boolean {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  if (!configuredSecret) return false;

  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const headerSecret = req.headers.get('x-cron-secret')?.trim();
  const candidate = bearer || headerSecret || '';

  if (candidate.length !== configuredSecret.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(configuredSecret));
}

export async function POST(req: NextRequest) {
  try {
    const isCronAuthorized = hasValidCronSecret(req);

    if (process.env.NODE_ENV === 'production' && !isCronAuthorized) {
      const user = await getCurrentUser();
      const isStaff = user && (user.role === 'ADMIN' || user.role === 'MANAGER');
      if (!isStaff) {
        return NextResponse.json(
          { error: 'Unauthorized: Valid CRON_SECRET or staff session required' },
          { status: 401 }
        );
      }
    }

    let actor = isCronAuthorized ? 'VPS Scheduled Cron (12:30 AM IST)' : 'Manual Manager Trigger';
    try {
      const body = await req.json();
      if (body?.actor) actor = body.actor;
    } catch {}

    const result = await runWarehouseReconcileBatch(actor);

    // Dispatch Baileys WhatsApp 12:30 AM summary to backend operations
    sendReconcileWhatsAppAlert({
      reconciledCount: (result as any).reconciledOrdersCount || (result as any).summary?.reconciledOrders || 0,
      totalRevenuePaise: (result as any).totalRevenueReconciledPaise || (result as any).summary?.totalRevenuePaise || 0,
      date: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
    }).catch((e) => console.warn('[Warehouse WhatsApp Reconcile Alert Warning]', e));

    return NextResponse.json({
      success: true,
      batch: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to run warehouse reconciliation', details: error.message },
      { status: 500 }
    );
  }
}
