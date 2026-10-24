import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyCustomerOtp } from '@/lib/auth/otp';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/lib/auth/session';

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6).max(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter the 6-digit verification code' }, { status: 400 });
    }

    const { email, otp } = parsed.data;
    const result = await verifyCustomerOtp(email, otp);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return NextResponse.json({
      success: true,
      user: result.user,
      message: 'Successfully authenticated',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 400 });
  }
}
