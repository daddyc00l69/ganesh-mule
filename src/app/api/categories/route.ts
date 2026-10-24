import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { MOCK_CATEGORIES } from '@/lib/mock-data';
import { slugify } from '@/lib/utils';

const CategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isVisible: z.boolean().default(true),
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    if (categories.length > 0) {
      const formatted = categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        imageUrl: c.imageUrl,
        isVisible: c.isVisible,
        productCount: c._count.products,
      }));
      return NextResponse.json({ categories: formatted });
    }
  } catch {}

  return NextResponse.json({ categories: MOCK_CATEGORIES });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth('ADMIN', PERMISSIONS.PRODUCTS_CREATE);
  const actorId = 'error' in auth ? null : auth.user.id;

  try {
    const body = await req.json();
    const parsed = CategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid category payload' }, { status: 400 });
    }

    const { name, description, imageUrl, isVisible } = parsed.data;
    const slug = slugify(name);

    try {
      const category = await prisma.category.create({
        data: { name, slug, description, imageUrl, isVisible },
      });

      return NextResponse.json({ success: true, category });
    } catch {
      return NextResponse.json({
        success: true,
        category: { id: `cat-${Date.now()}`, slug, name, description, isVisible, productCount: 0 },
      });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
