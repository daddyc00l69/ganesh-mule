import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearSessionCookie, getSessionTokenFromCookies, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { logoutCustomerSession } from '@/lib/auth/otp';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (rawToken) {
      logoutCustomerSession(rawToken);
    }

    const token = await getSessionTokenFromCookies();
    if (token) {
      try {
        await prisma.session.delete({ where: { token } });
      } catch {}
    }
  } catch {}

  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
