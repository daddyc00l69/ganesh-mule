import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({ authenticated: true, user });
}
