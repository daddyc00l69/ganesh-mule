import { NextRequest, NextResponse } from 'next/server';
import { getDelhiverySettings, saveDelhiverySettings } from '@/lib/shipping/delhivery';
import { getCurrentUser } from '@/lib/auth/server';

export async function GET() {
  try {
    const settings = getDelhiverySettings();
    // Mask API key for UI security
    const maskedKey = settings.apiKey
      ? settings.apiKey.length > 8
        ? `${settings.apiKey.slice(0, 4)}••••••••${settings.apiKey.slice(-4)}`
        : '••••••••'
      : '';

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        apiKeyMasked: maskedKey,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve Delhivery settings', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    // Allow admin or manager to update settings
    if (user && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const current = getDelhiverySettings();

    // If apiKey is masked or empty, retain current key
    let newApiKey = current.apiKey;
    if (body.apiKey && !body.apiKey.includes('••••')) {
      newApiKey = body.apiKey.trim();
    }

    const updated = saveDelhiverySettings({
      ...body,
      apiKey: newApiKey,
    });

    const maskedKey = updated.apiKey
      ? updated.apiKey.length > 8
        ? `${updated.apiKey.slice(0, 4)}••••••••${updated.apiKey.slice(-4)}`
        : '••••••••'
      : '';

    return NextResponse.json({
      success: true,
      settings: {
        ...updated,
        apiKeyMasked: maskedKey,
      },
      message: 'Delhivery One settings updated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update Delhivery settings', details: error.message },
      { status: 500 }
    );
  }
}
