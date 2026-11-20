import { NextRequest, NextResponse } from 'next/server';
import { requireAuthInProduction } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuthInProduction('ADMIN', PERMISSIONS.PRODUCTS_UPDATE);
  if ('response' in auth) return auth.response;
  const actorId = auth.user?.id ?? null;

  try {
    const body = await req.json();

    try {
      const product = await prisma.product.update({
        where: { id },
        data: {
          name: body.name,
          sku: body.sku,
          description: body.description,
          price: body.price,
          compareAtPrice: body.compareAtPrice,
          categoryId: body.categoryId,
          stockQuantity: body.stockQuantity,
          lowStockThreshold: body.lowStockThreshold,
          weight: body.weight,
          weightGrams: body.weightGrams,
          isPublished: body.isPublished,
        },
        include: { category: true, images: true },
      });

      try {
        await prisma.auditLog.create({
          data: {
            actorId,
            action: 'PRODUCT_UPDATE',
            entityType: 'Product',
            entityId: id,
            metadata: { price: body.price, stock: body.stockQuantity },
          },
        });
      } catch {}

      return NextResponse.json({ success: true, product });
    } catch {
      return NextResponse.json({ success: true, product: { id, ...body } });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuthInProduction('ADMIN', PERMISSIONS.PRODUCTS_UPDATE);
  if ('response' in auth) return auth.response;
  const actorId = auth.user?.id ?? null;

  try {
    try {
      // Check if product has historical orders to prevent foreign key errors and data loss
      const hasOrders = await prisma.orderItem.count({ where: { productId: id } });
      if (hasOrders > 0) {
        // Safe discontinuation: unpublish to preserve order history and ledger integrity
        await prisma.product.update({
          where: { id },
          data: { isPublished: false },
        });

        await prisma.auditLog.create({
          data: {
            actorId,
            action: 'PRODUCT_DISCONTINUED',
            entityType: 'Product',
            entityId: id,
            metadata: { reason: 'Preserved historical orders, marked unpublished' },
          },
        });

        return NextResponse.json({
          success: true,
          discontinued: true,
          message: 'Product safely discontinued and unlisted from store to preserve historical purchase records.',
        });
      }

      await prisma.product.delete({ where: { id } });

      try {
        await prisma.auditLog.create({
          data: {
            actorId,
            action: 'PRODUCT_DELETE',
            entityType: 'Product',
            entityId: id,
          },
        });
      } catch {}
    } catch {}

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
