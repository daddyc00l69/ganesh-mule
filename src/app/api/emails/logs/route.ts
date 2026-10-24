import { NextResponse } from 'next/server';
import { EMAIL_AUDIT_LOGS } from '@/lib/email/resend';

export async function GET() {
  return NextResponse.json({
    success: true,
    count: EMAIL_AUDIT_LOGS.length,
    logs: EMAIL_AUDIT_LOGS,
  });
}
