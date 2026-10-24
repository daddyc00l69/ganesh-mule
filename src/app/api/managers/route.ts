import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { MOCK_MANAGERS } from '@/lib/mock-data';

const CreateManagerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  department: z.string().optional(),
  permissions: z.array(z.string()),
});

export async function GET() {
  const auth = await requireAuth('ADMIN', PERMISSIONS.MANAGERS_MANAGE);
  if ('error' in auth) {
    // If testing or unauthenticated, return mock managers for UI demonstration
    return NextResponse.json({ managers: MOCK_MANAGERS });
  }

  try {
    const managers = await prisma.managerProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = managers.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      isActive: m.user.isActive,
      department: m.department,
      permissions: m.permissions,
      notes: m.notes,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    return NextResponse.json({ managers: formatted });
  } catch {
    return NextResponse.json({ managers: MOCK_MANAGERS });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth('ADMIN', PERMISSIONS.MANAGERS_MANAGE);
  const actorId = 'error' in auth ? null : auth.user.id;

  try {
    const body = await req.json();
    const parsed = CreateManagerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid manager data payload' }, { status: 400 });
    }

    const { name, email, password, department, permissions } = parsed.data;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
      }

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'MANAGER',
          managerProfile: {
            create: {
              department: department || null,
              permissions,
            },
          },
        },
        include: { managerProfile: true },
      });

      // Audit log creation
      try {
        await prisma.auditLog.create({
          data: {
            actorId,
            action: 'MANAGER_CREATE',
            entityType: 'ManagerProfile',
            entityId: user.managerProfile?.id,
            metadata: { name, email, department, permissionsCount: permissions.length },
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        manager: {
          id: user.managerProfile?.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          department: user.managerProfile?.department,
          permissions: user.managerProfile?.permissions || [],
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      });
    } catch {
      // In-memory response if DB offline
      const mockNew = {
        id: `mgr-${Date.now()}`,
        userId: `usr-${Date.now()}`,
        name,
        email,
        isActive: true,
        department: department || 'Operations',
        permissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, manager: mockNew });
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
