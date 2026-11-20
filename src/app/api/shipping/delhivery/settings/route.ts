import { NextRequest, NextResponse } from 'next/server';
import { getDelhiverySettings, saveDelhiverySettings } from '@/lib/shipping/delhivery';
import { getCurrentUser, requireAuthInProduction } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/permissions';
import { DelhiverySettings } from '@/types';

function sanitizeDelhiverySettings(settings: DelhiverySettings) {
  const maskedKey = settings.apiKey
    ? settings.apiKey.length > 8
      ? `${settings.apiKey.slice(0, 4)}••••••••${settings.apiKey.slice(-4)}`
      : '••••••••'
    : '';
  const { apiKey: _omitApiKey, ...safeSettings } = settings;
  return {
    ...safeSettings,
    apiKeyMasked: maskedKey,
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    const isStaff = Boolean(user && (user.role === 'ADMIN' || user.role === 'MANAGER'));
    const settings = getDelhiverySettings();

    // Unauthenticated public callers (e.g. checkout) only receive non-sensitive shipping mode metadata
    if (process.env.NODE_ENV === 'production' && !isStaff) {
      return NextResponse.json({
        success: true,
        settings: {
          shippingMode: settings.shippingMode,
          originPincode: settings.originPincode,
          originCity: settings.originCity,
          originState: settings.originState,
          insuredPackaging: settings.insuredPackaging,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: sanitizeDelhiverySettings(settings),
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
    const auth = await requireAuthInProduction('MANAGER', PERMISSIONS.SETTINGS_MANAGE);
    if ('response' in auth) return auth.response;

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

    return NextResponse.json({
      success: true,
      settings: sanitizeDelhiverySettings(updated),
      message: 'Delhivery One settings updated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update Delhivery settings', details: error.message },
      { status: 500 }
    );
  }
}
