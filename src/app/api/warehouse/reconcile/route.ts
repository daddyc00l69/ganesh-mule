import { NextRequest, NextResponse } from 'next/server';
import { runWarehouseReconcileBatch } from '@/lib/warehouse/schedule';

export async function POST(req: NextRequest) {
  try {
    let actor = 'Manual Manager Trigger';
    try {
      const body = await req.json();
      if (body?.actor) actor = body.actor;
    } catch {}

    const result = await runWarehouseReconcileBatch(actor);

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
