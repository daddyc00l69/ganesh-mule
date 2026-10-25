import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server';
import {
  getAllManagers,
  getAllInvites,
  createManagerInvite,
  revokeManagerInvite,
} from '@/lib/auth/staff-store';

const InviteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  department: z.string().min(2, 'Department is required'),
  permissions: z.array(z.string()).default([]),
});

const PatchSchema = z.object({
  action: z.enum(['REVOKE_INVITE', 'TOGGLE_ACTIVE']),
  inviteId: z.string().optional(),
  managerId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAuth('ADMIN');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const managers = getAllManagers();
  const invites = getAllInvites();

  return NextResponse.json({
    success: true,
    managers: managers.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      email: m.email,
      phone: m.phone,
      department: m.department,
      permissions: m.permissions,
      isActive: m.isActive,
      createdAt: m.createdAt,
    })),
    invites,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth('ADMIN');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = InviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { name, email, phone, department, permissions } = parsed.data;

    const result = await createManagerInvite({
      name,
      email,
      phone,
      department,
      permissions,
    });

    return NextResponse.json({
      success: true,
      message: `Invitation email dispatched to ${email}`,
      invite: result.invite,
      inviteUrl: result.inviteUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send invite' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth('ADMIN');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { action, inviteId, managerId, isActive } = parsed.data;

    if (action === 'REVOKE_INVITE' && inviteId) {
      revokeManagerInvite(inviteId);
      return NextResponse.json({ success: true, message: 'Invitation revoked.' });
    }

    if (action === 'TOGGLE_ACTIVE' && managerId && isActive !== undefined) {
      const managers = getAllManagers();
      const target = managers.find((m) => m.id === managerId || m.userId === managerId);
      if (target) {
        target.isActive = isActive;
        target.updatedAt = new Date().toISOString();
        return NextResponse.json({ success: true, manager: target });
      }
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Action parameters incomplete' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update manager' }, { status: 500 });
  }
}
