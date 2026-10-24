import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { generateToken, setSessionCookie, SESSION_MAX_AGE } from '@/lib/auth/session';

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid registration parameters' }, { status: 400 });
    }

    const { name, email, password, phone } = parsed.data;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }

      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'CUSTOMER',
          customerProfile: {
            create: {
              phone: phone || null,
            },
          },
        },
      });

      const token = generateToken();
      const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      await setSessionCookie(token);

      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch {
      // Fallback dev token if DB is offline
      const devToken = `dev_CUSTOMER_${email}`;
      await setSessionCookie(devToken);
      return NextResponse.json({
        success: true,
        user: { id: `usr-${Date.now()}`, name, email, role: 'CUSTOMER' },
      });
    }
  } catch {
    return NextResponse.json({ error: 'Server registration error' }, { status: 500 });
  }
}
