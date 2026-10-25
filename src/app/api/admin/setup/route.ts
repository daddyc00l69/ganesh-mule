import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getAdminConfigStatus,
  sendAdminSetupOtp,
  verifyAdminSetupOtp,
  directSetAdminAccount,
} from '@/lib/auth/staff-store';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/lib/auth/session';

const SetupSchema = z.object({
  action: z.enum(['SEND_OTP', 'VERIFY_OTP', 'DIRECT_SETUP']),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(6).optional(),
  otp: z.string().optional(),
});

export async function GET() {
  const status = getAdminConfigStatus();
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SetupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { action, name, email, phone, password, otp } = parsed.data;

    // Direct Instant Password Configuration / Update
    if (action === 'DIRECT_SETUP') {
      if (!name) {
        return NextResponse.json({ error: 'Please enter administrator full name.' }, { status: 400 });
      }
      if (!email) {
        return NextResponse.json({ error: 'Please enter administrator email address.' }, { status: 400 });
      }
      if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
      }

      const result = await directSetAdminAccount({
        name,
        email,
        phone,
        password,
      });

      const response = NextResponse.json({
        success: true,
        message: 'Administrator password configured and logged in successfully!',
        user: result.user,
        redirect: '/admin',
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

    if (action === 'SEND_OTP') {
      if (!name) {
        return NextResponse.json({ error: 'Please enter administrator full name.' }, { status: 400 });
      }
      if (!email) {
        return NextResponse.json({ error: 'Please enter administrator email.' }, { status: 400 });
      }
      if (!phone) {
        return NextResponse.json({ error: 'Please enter a valid mobile number.' }, { status: 400 });
      }

      const result = await sendAdminSetupOtp({
        name,
        email,
        phone,
        password,
      });

      return NextResponse.json(result);
    }

    if (action === 'VERIFY_OTP') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required for OTP verification.' }, { status: 400 });
      }
      if (!otp) {
        return NextResponse.json({ error: 'Please enter the 6-digit verification code.' }, { status: 400 });
      }

      const result = await verifyAdminSetupOtp({
        email,
        otp,
      });

      const response = NextResponse.json({
        success: true,
        message: 'Administrator account configured and logged in successfully!',
        user: result.user,
        redirect: '/admin',
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

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Setup request failed' }, { status: 400 });
  }
}
