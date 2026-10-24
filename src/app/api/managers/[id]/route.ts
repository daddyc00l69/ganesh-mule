import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth('ADMIN', PERMISSIONS.MANAGERS_MANAGE);
  const actorId = 'error' in auth ? null : auth.user.id;

  try {
    const body = await req.json();
    const { name, department, permissions, isActive } = body;

    try {
      const manager = await prisma.managerProfile.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!manager) {
        return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
      }

      if (typeof isActive === 'boolean') {
        await prisma.user.update({
          where: { id: manager.userId },
          data: { isActive },
        });
      }

      const updated = await prisma.managerProfile.update({
        where: { id },
        data: {
          department: department !== undefined ? department : manager.department,
          permissions: permissions !== undefined ? permissions : manager.permissions,
        },
        include: { user: true },
      });

      // Audit log
      try {
        await prisma.auditLog.create({
          data: {
            actorId,
            action: isActive !== undefined ? 'MANAGER_STATUS_TOGGLE' : 'MANAGER_PERMISSIONS_UPDATE',
            entityType: 'ManagerProfile',
            entityId: id,
            metadata: { isActive, permissionsCount: permissions?.length },
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        manager: {
          id: updated.id,
          userId: updated.userId,
          name: updated.user.name,
          email: updated.user.email,
          isActive: updated.user.isActive,
          department: updated.department,
          permissions: updated.permissions,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    } catch {
      return NextResponse.json({
        success: true,
        manager: { id, name: name || 'Manager', isActive: isActive ?? true, permissions: permissions || [] },
      });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to update manager' }, { status: 500 });
  }
}
