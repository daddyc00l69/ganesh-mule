import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getCustomerSession } from '@/lib/auth/otp';
import { getCurrentUser } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      // 1. Check OTP customer session cache
      const customer = getCustomerSession(token);
      if (customer) {
        return NextResponse.json({
          authenticated: true,
          user: customer,
        });
      }

      // 2. Fallback to regular DB user session
      const dbUser = await getCurrentUser();
      if (dbUser) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
          },
        });
      }
    }

    return NextResponse.json({
      authenticated: false,
      user: null,
    }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
