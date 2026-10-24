import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendCustomerOtp } from '@/lib/auth/otp';

const SendOtpSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid email address' }, { status: 400 });
    }

    const { email } = parsed.data;
    const result = await sendCustomerOtp(email);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to dispatch verification code' }, { status: 500 });
  }
}
