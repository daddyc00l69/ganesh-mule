import { NextResponse } from 'next/server';
import { isDatabaseOnline } from '@/lib/db';
import { isDataDirWritable } from '@/lib/storage/json-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [dbOnline, dataDirWritable] = await Promise.all([
    isDatabaseOnline(),
    Promise.resolve(isDataDirWritable()),
  ]);

  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbOnline ? 'online' : 'fallback',
      storage: dataDirWritable ? 'writable' : 'readonly',
    },
    { status: 200 }
  );
}

