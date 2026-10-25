import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getManagerInvite,
  sendManagerJoinOtp,
  verifyManagerJoinOtp,
} from '@/lib/auth/staff-store';

const JoinActionSchema = z.object({
  action: z.enum(['SEND_OTP', 'VERIFY_JOIN']),
  token: z.string().min(10),
  email: z.string().email(),
  otp: z.string().length(6).optional(),
  password: z.string().min(6).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || undefined;
  const email = searchParams.get('email') || undefined;

  if (!token && !email) {
    return NextResponse.json(
      { valid: false, error: 'Missing joining invitation token or email.' },
      { status: 400 }
    );
  }

  const invite = getManagerInvite(token, email);

  if (!invite) {
    return NextResponse.json(
      {
        valid: false,
        error:
          'Access Denied: This email address has not been invited by an Administrator, or this invitation link has expired.',
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    valid: true,
    invite: {
      id: invite.id,
      name: invite.name,
      email: invite.email,
      department: invite.department,
      permissions: invite.permissions,
      invitedAt: invite.invitedAt,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = JoinActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { action, token, email, otp, password } = parsed.data;

    if (action === 'SEND_OTP') {
      const result = await sendManagerJoinOtp({ token, email });
      return NextResponse.json(result);
    }

    if (action === 'VERIFY_JOIN') {
      if (!otp) {
        return NextResponse.json({ error: 'Please enter the 6-digit OTP passcode.' }, { status: 400 });
      }

      const result = await verifyManagerJoinOtp({
        token,
        email,
        otp,
        password,
      });

      return NextResponse.json({
        success: true,
        message: 'Identity verified! Welcome to Ganesh Mule Operations Management.',
        user: result.user,
        redirect: '/manager',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 400 });
  }
}
