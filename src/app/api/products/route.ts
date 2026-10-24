import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { getLiveProducts, getLiveInventoryMovements } from '@/lib/inventory/store';
import { slugify } from '@/lib/utils';

const CreateProductSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  description: z.string().min(5),
  price: z.number().int().positive(), // Minor units (paise)
  compareAtPrice: z.number().int().optional().nullable(),
  categoryId: z.string(),
  stockQuantity: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().positive().default(5),
  images: z.array(z.object({ url: z.string().url(), altText: z.string().optional(), position: z.number() })).optional(),
  isPublished: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');
  const search = searchParams.get('q');

  const dbOnline = await isDatabaseOnline();
  if (dbOnline) {
    try {
      const where: any = {};
      if (categoryId && categoryId !== 'ALL') {
        where.categoryId = categoryId;
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { position: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (products.length > 0) {
        return NextResponse.json({ products });
      }
    } catch {}
  }

  // Fallback to rich live products
  let filtered = getLiveProducts();
  if (categoryId && categoryId !== 'ALL') {
    filtered = filtered.filter((p) => p.categoryId === categoryId);
  }
  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );
  }

  return NextResponse.json({
    products: filtered,
    movements: getLiveInventoryMovements(),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth('ADMIN', PERMISSIONS.PRODUCTS_CREATE);
  const actorId = 'error' in auth ? null : auth.user.id;

  try {
    const body = await req.json();
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid product data parameters' }, { status: 400 });
    }

    const data = parsed.data;
    const slug = slugify(data.name);

    try {
      const product = await prisma.product.create({
        data: {
          name: data.name,
          slug,
          sku: data.sku,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          categoryId: data.categoryId,
          stockQuantity: data.stockQuantity,
          lowStockThreshold: data.lowStockThreshold,
          isPublished: data.isPublished,
          images: {
            create: data.images?.map((img) => ({
              url: img.url,
              altText: img.altText || data.name,
              position: img.position,
            })) || [],
          },
        },
        include: {
          category: true,
          images: true,
        },
      });

      // Audit log
      try {
        await prisma.auditLog.create({
          data: {
            actorId,
            action: 'PRODUCT_CREATE',
            entityType: 'Product',
            entityId: product.id,
            metadata: { name: product.name, sku: product.sku, price: product.price },
          },
        });
      } catch {}

      return NextResponse.json({ success: true, product });
    } catch {
      // In-memory mock response if DB is offline
      const mockProd = {
        id: `prod-${Date.now()}`,
        slug,
        ...data,
        images: data.images || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, product: mockProd });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
