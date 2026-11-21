import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

const CreateStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address required').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'MANAGER']),
  department: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});

const UpdateStaffSchema = z.object({
  userId: z.string().min(1, 'Target userId is required'),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'DEVELOPER']).optional(),
  isActive: z.boolean().optional(),
  department: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  newPassword: z.string().min(8).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const staffUsers = await prisma.user.findMany({
      where: {
        role: { in: ['DEVELOPER', 'ADMIN', 'MANAGER'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        managerProfile: true,
      },
    });

    return NextResponse.json({
      success: true,
      staff: staffUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        department: u.managerProfile?.department || null,
        permissions: u.managerProfile?.permissions || [],
        notes: u.managerProfile?.notes || null,
        isPrimaryDeveloper: u.email === auth.user.email,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve staff accounts', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = CreateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, role, department, permissions } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: `An account with email ${email} already exists.` },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user and profile in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          isActive: true,
        },
      });

      if (role === 'MANAGER' || permissions.length > 0) {
        await tx.managerProfile.create({
          data: {
            userId: user.id,
            department: department || 'Operations',
            permissions: permissions.length > 0 ? permissions : ['orders.read', 'orders.update', 'inventory.read'],
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: 'DEVELOPER_STAFF_CREATE',
          entityType: 'User',
          entityId: user.id,
          metadata: {
            createdUserEmail: email,
            createdUserName: name,
            role,
            department,
          },
        },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      message: `${role} account for ${name} (${email}) created successfully.`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to create staff account', details: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = UpdateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { userId, name, email, role, isActive, department, permissions, newPassword } = parsed.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { managerProfile: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target staff account not found' }, { status: 404 });
    }

    // Safety rule: Prevent deactivating the logged-in developer themselves
    if (targetUser.id === auth.user.id && isActive === false) {
      return NextResponse.json(
        { error: 'Action rejected: You cannot deactivate your own active Developer account.' },
        { status: 403 }
      );
    }

    const userUpdates: any = {};
    if (name !== undefined) userUpdates.name = name;
    if (email !== undefined) userUpdates.email = email;
    if (role !== undefined) userUpdates.role = role;
    if (isActive !== undefined) userUpdates.isActive = isActive;
    if (newPassword) {
      userUpdates.passwordHash = await hashPassword(newPassword);
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdates,
        });
      }

      if (department !== undefined || permissions !== undefined) {
        if (targetUser.managerProfile) {
          await tx.managerProfile.update({
            where: { userId },
            data: {
              ...(department !== undefined ? { department } : {}),
              ...(permissions !== undefined ? { permissions } : {}),
            },
          });
        } else if (role === 'MANAGER' || (permissions && permissions.length > 0)) {
          await tx.managerProfile.create({
            data: {
              userId,
              department: department || 'Operations',
              permissions: permissions || [],
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: 'DEVELOPER_STAFF_UPDATE',
          entityType: 'User',
          entityId: userId,
          metadata: {
            targetUserEmail: targetUser.email,
            changes: {
              ...userUpdates,
              passwordReset: Boolean(newPassword),
              department,
              permissionsCount: permissions?.length,
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Account for ${targetUser.email} updated successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to update staff account', details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const url = new URL(req.url);
    let userId = url.searchParams.get('userId');

    if (!userId) {
      try {
        const body = await req.json();
        userId = body.userId;
      } catch {}
    }

    if (!userId) {
      return NextResponse.json({ error: 'Target userId is required for deletion' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target staff account not found' }, { status: 404 });
    }

    // Safety rule 1: Developer cannot delete their own active account
    if (targetUser.id === auth.user.id) {
      return NextResponse.json(
        { error: 'Action rejected: You cannot delete your own active Developer account.' },
        { status: 403 }
      );
    }

    // Safety rule 2: Primary developer account cannot be deleted
    const configuredDeveloperEmail = (process.env.DEVELOPER_EMAIL || 'tushar0p.test@gmail.com').toLowerCase().trim();
    if (targetUser.email.toLowerCase() === configuredDeveloperEmail || targetUser.email.toLowerCase() === 'tushar0p.test@gmail.com') {
      return NextResponse.json(
        { error: 'Action rejected: The root Developer account cannot be deleted.' },
        { status: 403 }
      );
    }

    // Safety rule 3: Protect existing order records
    const orderCount = await prisma.order.count({ where: { userId } });
    if (orderCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete account: This staff account is linked to ${orderCount} customer order(s). Please suspend access instead to protect order history.`,
        },
        { status: 400 }
      );
    }

    // Safe transactional deletion
    await prisma.$transaction(async (tx) => {
      // 1. Unlink historical AuditLog actor references to preserve security logs
      await tx.auditLog.updateMany({
        where: { actorId: userId },
        data: { actorId: null },
      });

      // 2. Remove dependent user records
      await tx.session.deleteMany({ where: { userId } });
      await tx.managerProfile.deleteMany({ where: { userId } });
      await tx.customerProfile.deleteMany({ where: { userId } });
      await tx.address.deleteMany({ where: { userId } });

      // 3. Delete the User entity
      await tx.user.delete({ where: { id: userId } });

      // 4. Record Developer audit trail
      await tx.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: 'DEVELOPER_STAFF_DELETE',
          entityType: 'User',
          entityId: userId,
          metadata: {
            deletedEmail: targetUser.email,
            deletedName: targetUser.name,
            deletedRole: targetUser.role,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Staff account for ${targetUser.name} (${targetUser.email}) has been permanently deleted.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to delete staff account', details: err.message },
      { status: 500 }
    );
  }
}
