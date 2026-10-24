import { NextRequest, NextResponse } from 'next/server';
import { isValidIndianPin, guessCityStateFromPin, INDIAN_STATES } from '@/lib/constants/india';

// In-memory cache for ultra-fast response
const pincodeCache = new Map<string, any>();

function normalizeStateName(rawState: string): string {
  const clean = (rawState || '').trim().toLowerCase();
  const found = INDIAN_STATES.find(
    (s) => s.name.toLowerCase() === clean || s.name.toLowerCase().includes(clean)
  );
  if (found) return found.name;

  // Handle common discrepancies in India Post records
  if (clean.includes('orissa')) return 'Odisha';
  if (clean.includes('uttaranchal')) return 'Uttarakhand';
  if (clean.includes('pondicherry')) return 'Puducherry';
  if (clean.includes('delhi')) return 'Delhi';
  if (clean.includes('jammu')) return 'Jammu and Kashmir';
  if (clean.includes('andaman')) return 'Andaman and Nicobar Islands';

  return rawState;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  try {
    const resolvedParams = await params;
    const pin = (resolvedParams.pin || '').replace(/\D/g, '').slice(0, 6);

    if (!isValidIndianPin(pin)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 6-digit Indian PIN code.' },
        { status: 400 }
      );
    }

    // 1. Check in-memory cache
    if (pincodeCache.has(pin)) {
      return NextResponse.json(pincodeCache.get(pin));
    }

    // 2. Query India Post Public API with 2.5s timeout
    let fetchedData: any = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'GaneshMuleStorefront/1.0' },
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json[0]?.Status === 'Success' && json[0]?.PostOffice?.length > 0) {
          fetchedData = json[0].PostOffice;
        }
      }
    } catch {
      // Network timeout or offline - will use fallback
    }

    // 3. Process fetched India Post records
    if (fetchedData && fetchedData.length > 0) {
      const first = fetchedData[0];
      const rawState = first.State || '';
      const district = first.District || first.Block || '';
      const state = normalizeStateName(rawState);

      // Extract unique post office locality/town names
      const postOffices = Array.from(
        new Set(
          fetchedData
            .map((po: any) => po.Name)
            .filter(Boolean)
            .map((name: string) => name.replace(/\s*\(.*?\)\s*/g, '').trim())
        )
      ) as string[];

      // Best primary town/city representation
      const defaultTown = postOffices[0] || district;
      const city = district || defaultTown;

      const payload = {
        success: true,
        postalCode: pin,
        city,
        district,
        state,
        defaultTown,
        postOffices,
        source: 'INDIA_POST_LIVE',
      };

      pincodeCache.set(pin, payload);
      return NextResponse.json(payload);
    }

    // 4. Fallback to comprehensive local dictionary
    const localGuess = guessCityStateFromPin(pin);
    if (localGuess && localGuess.state) {
      const payload = {
        success: true,
        postalCode: pin,
        city: localGuess.city || '',
        district: localGuess.city || '',
        state: localGuess.state,
        defaultTown: localGuess.city || '',
        postOffices: localGuess.city ? [localGuess.city] : [],
        source: 'LOCAL_REGISTRY',
      };
      pincodeCache.set(pin, payload);
      return NextResponse.json(payload);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'PIN code not found in postal directory. Please enter Town/City and State manually.',
      },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
