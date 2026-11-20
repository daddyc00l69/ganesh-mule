import { NextResponse } from 'next/server';
import { EMAIL_AUDIT_LOGS } from '@/lib/email/resend';
import { requireAuthInProduction } from '@/lib/auth/server';

export async function GET() {
  const auth = await requireAuthInProduction('MANAGER');
  if ('response' in auth) return auth.response;

  return NextResponse.json({
    success: true,
    count: EMAIL_AUDIT_LOGS.length,
    logs: EMAIL_AUDIT_LOGS,
  });
}
