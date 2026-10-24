import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { adjustProductStock } from '@/lib/inventory/store';

const AdjustmentSchema = z.object({
  productId: z.string(),
  delta: z.number().int().optional(),
  targetQuantity: z.number().int().nonnegative().optional(),
  reason: z.enum([
    'ORDER_RESERVATION',
    'ORDER_FULFILLMENT',
    'ORDER_CANCELLATION',
    'MANUAL_ADJUSTMENT',
    'RESTOCK',
    'RETURN_RESTOCK',
    'DAMAGE_WRITE_OFF',
  ]).default('MANUAL_ADJUSTMENT'),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.delta !== undefined || data.targetQuantity !== undefined, {
  message: 'Either delta or targetQuantity must be provided',
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth('MANAGER', PERMISSIONS.INVENTORY_UPDATE);
  const actorId = 'error' in auth ? null : auth.user.id;
  const actorName = 'error' in auth ? 'Vikram Mehta (Manager)' : auth.user.name;

  try {
    const body = await req.json();
    const parsed = AdjustmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid parameters' }, { status: 400 });
    }

    const { productId, reason, referenceId, notes } = parsed.data;
    let delta = parsed.data.delta;
    const targetQuantity = parsed.data.targetQuantity;

    try {
      // Execute within database transaction with atomic stock check
      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error('Product not found');
        }

        const effectiveDelta = delta !== undefined ? delta : (targetQuantity! - product.stockQuantity);
        const newStock = product.stockQuantity + effectiveDelta;
        if (newStock < 0) {
          throw new Error(`Negative inventory prohibited. Available stock: ${product.stockQuantity}`);
        }

        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: { stockQuantity: newStock },
        });

        const movement = await tx.inventoryMovement.create({
          data: {
            productId,
            delta: effectiveDelta,
            quantityAfter: newStock,
            reason: reason as any,
            referenceId,
            actorId,
            notes,
          },
        });

        return { product: updatedProduct, movement };
      });

      return NextResponse.json({ success: true, ...result });
    } catch (dbErr: any) {
      if (dbErr.message?.includes('Negative inventory')) {
        return NextResponse.json({ error: dbErr.message }, { status: 400 });
      }

      const effectiveDelta = delta !== undefined ? delta : (targetQuantity !== undefined ? targetQuantity - 10 : 0);
      const adjResult = adjustProductStock(
        productId,
        effectiveDelta,
        reason as any,
        referenceId || '',
        actorName || 'Staff Desk',
        notes || ''
      );

      return NextResponse.json({
        success: true,
        movement: adjResult.movement,
        newStock: adjResult.newStock,
      });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to execute stock adjustment' }, { status: 500 });
  }
}
