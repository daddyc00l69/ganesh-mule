import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { generateToken, setSessionCookie, SESSION_MAX_AGE, SESSION_COOKIE_NAME, createUserSessionToken } from '@/lib/auth/session';
import { authenticateStaffLogin, getAdminConfigStatus } from '@/lib/auth/staff-store';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  expectedRole: z.enum(['DEVELOPER', 'ADMIN', 'MANAGER']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password parameters' }, { status: 400 });
    }

    const { email, password, expectedRole } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();
    const isDevEmail = cleanEmail === (process.env.DEVELOPER_EMAIL || 'tushar0p.test@gmail.com').toLowerCase();
    const resolvedRole = expectedRole || (isDevEmail ? 'DEVELOPER' : cleanEmail.includes('admin') ? 'ADMIN' : 'MANAGER');
    const isHttps = req.nextUrl.protocol === 'https:';

    // 1. Check Staff Store (configured Developer, Admin and verified Managers)
    try {
      let result;
      try {
        result = await authenticateStaffLogin({ email: cleanEmail, password, expectedRole: resolvedRole });
      } catch (err: any) {
        // Try alternate roles if expectedRole didn't match
        const altRole = isDevEmail ? 'DEVELOPER' : resolvedRole === 'ADMIN' ? 'MANAGER' : 'ADMIN';
        result = await authenticateStaffLogin({ email: cleanEmail, password, expectedRole: altRole });
      }

      if (result && result.success) {
        const response = NextResponse.json({
          success: true,
          user: result.user,
        });
        response.cookies.set(SESSION_COOKIE_NAME, result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' && isHttps,
          sameSite: 'lax',
          path: '/',
          maxAge: SESSION_MAX_AGE,
        });
        return response;
      }
    } catch {
      // In-memory staff store did not match, fall through to PostgreSQL database check
    }

    // 2. Check Database Users if DB is online
    try {
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: { managerProfile: true },
      });

      if (user) {
        if (!user.isActive) {
          return NextResponse.json({ error: 'Account has been suspended. Contact administrator.' }, { status: 403 });
        }

        if (user.role !== 'DEVELOPER' && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          return NextResponse.json({ error: 'Access denied: Staff or Developer credentials required.' }, { status: 403 });
        }

        if (!user.passwordHash) {
          return NextResponse.json({ error: 'This staff account was created with Google. Please click "Continue with Google".' }, { status: 400 });
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
          department: user.managerProfile?.department || undefined,
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
          await prisma.auditLog.create({
            data: {
              actorId: user.id,
              action: 'STAFF_LOGIN_PASSWORD',
              entityType: 'User',
              entityId: user.id,
              metadata: {
                role: user.role,
                authMethod: 'PASSWORD',
                clientIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'internal',
              },
              ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            },
          });
        } catch {}

        const response = NextResponse.json({
          success: true,
          user: safeUser,
        });

        response.cookies.set(SESSION_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' && isHttps,
          sameSite: 'lax',
          path: '/',
          maxAge: SESSION_MAX_AGE,
        });

        return response;
      }
    } catch {
      // Database query error or unreachable
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

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
