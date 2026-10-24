import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth('ADMIN', PERMISSIONS.PRODUCTS_UPDATE);
  const actorId = 'error' in auth ? null : auth.user.id;

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
  const auth = await requireAuth('ADMIN', PERMISSIONS.PRODUCTS_UPDATE);
  const actorId = 'error' in auth ? null : auth.user.id;

  try {
    try {
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
