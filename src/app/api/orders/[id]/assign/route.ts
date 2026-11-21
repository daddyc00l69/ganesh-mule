import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { getLiveOrderById, updateLiveOrderStatus } from '@/lib/orders/store';
import { MOCK_AUDIT_LOGS } from '@/lib/mock-data';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'DEVELOPER')) {
      return NextResponse.json(
        { error: 'Unauthorized: Staff credentials required to assign orders' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { managerName, managerId } = body as { managerName: string | null; managerId?: string | null };

    const order = getLiveOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousManager = order.assignedManagerName || null;
    const nextManager = managerName && managerName.trim() ? managerName.trim() : null;

    order.assignedManagerName = nextManager;
    order.updatedAt = new Date().toISOString();

    const updated = updateLiveOrderStatus(order.id, {
      assignedManagerName: nextManager,
    });

    const dbOnline = await isDatabaseOnline();
    if (dbOnline) {
      try {
        await prisma.order.updateMany({
          where: {
            OR: [{ id: order.id }, { orderNumber: order.orderNumber }],
          },
          data: {
            assignedManagerName: nextManager,
            assignedManagerId: managerId || null,
          },
        });

        await prisma.auditLog.create({
          data: {
            actorId: user.id.startsWith('usr-') ? null : user.id,
            action: 'ORDER_MANAGER_ASSIGNMENT',
            entityType: 'Order',
            entityId: order.orderNumber,
            metadata: {
              fromManager: previousManager,
              toManager: nextManager,
              assignedByRole: user.role,
              assignedByEmail: user.email,
            },
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          },
        });
      } catch (dbErr) {
        console.warn('[DB Audit/Assign Warning]', dbErr);
      }
    }

    MOCK_AUDIT_LOGS.unshift({
      id: `audit-${Date.now()}`,
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      action: 'ORDER_MANAGER_ASSIGNMENT',
      entityType: 'Order',
      entityId: order.orderNumber,
      metadata: {
        fromManager: previousManager,
        toManager: nextManager,
        assignedByRole: user.role,
      },
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      order: updated || order,
      assignedManagerName: nextManager,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to assign order', details: error.message },
      { status: 500 }
    );
  }
}
