import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getAdminConfigStatus,
  sendAdminSetupOtp,
  verifyAdminSetupOtp,
} from '@/lib/auth/staff-store';

const SetupSchema = z.object({
  action: z.enum(['SEND_OTP', 'VERIFY_OTP']),
  name: z.string().min(2).optional(),
  email: z.string().email(),
  phone: z.string().min(10).optional(),
  password: z.string().min(6).optional(),
  otp: z.string().length(6).optional(),
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

    if (action === 'SEND_OTP') {
      if (!name) {
        return NextResponse.json({ error: 'Please enter administrator full name.' }, { status: 400 });
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
      if (!otp) {
        return NextResponse.json({ error: 'Please enter the 6-digit OTP code.' }, { status: 400 });
      }

      const result = await verifyAdminSetupOtp({
        email,
        otp,
      });

      return NextResponse.json({
        success: true,
        message: 'Administrator account configured and logged in successfully!',
        user: result.user,
        redirect: '/admin',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Setup request failed' }, { status: 400 });
  }
}
