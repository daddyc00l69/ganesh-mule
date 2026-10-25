import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { generateToken, setSessionCookie, SESSION_MAX_AGE, SESSION_COOKIE_NAME, createUserSessionToken } from '@/lib/auth/session';
import { authenticateStaffLogin, getAdminConfigStatus } from '@/lib/auth/staff-store';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  expectedRole: z.enum(['ADMIN', 'MANAGER']),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password parameters' }, { status: 400 });
    }

    const { email, password, expectedRole } = parsed.data;

    // 1. Check Staff Store (configured Admin and verified Managers)
    try {
      const result = await authenticateStaffLogin({ email, password, expectedRole });
      if (result.success) {
        const response = NextResponse.json({
          success: true,
          user: result.user,
        });
        response.cookies.set(SESSION_COOKIE_NAME, result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: SESSION_MAX_AGE,
        });
        return response;
      }
    } catch (err: any) {
      // If error message indicates wrong password, throw immediately
      if (err.message.includes('password')) {
        return NextResponse.json({ error: err.message }, { status: 401 });
      }
    }

    // 2. Check Database Users if DB is online
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { managerProfile: true },
      });

      if (user) {
        if (!user.isActive) {
          return NextResponse.json({ error: 'Account has been suspended. Contact administrator.' }, { status: 403 });
        }

        if (user.role !== expectedRole && user.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Access denied: unauthorized for this portal' }, { status: 403 });
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const safeUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as any,
          permissions: user.managerProfile?.permissions || [],
          isActive: true,
          createdAt: user.createdAt.toISOString(),
        };

        const token = createUserSessionToken(safeUser);
        const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

        try {
          await prisma.session.create({
            data: {
              userId: user.id,
              token,
              expiresAt,
            },
          });
        } catch {}

        const response = NextResponse.json({
          success: true,
          user: safeUser,
        });

        response.cookies.set(SESSION_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: SESSION_MAX_AGE,
        });

        return response;
      }
    } catch {
      // Database offline or table empty
    }

    // Check if system is unconfigured
    const adminStatus = getAdminConfigStatus();
    if (!adminStatus.configured) {
      return NextResponse.json(
        {
          error: 'No administrator configured yet. Please visit /config to set up the root Administrator account.',
          unconfigured: true,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error:
          expectedRole === 'MANAGER'
            ? 'Manager account not found or invitation unverified. Please check your joining link in email.'
            : 'Invalid administrator email or password.',
      },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: 'Server authentication error', details: err.message }, { status: 500 });
  }
}
