import { NextRequest, NextResponse } from 'next/server';
import { isValidIndianPin, guessCityStateFromPin, INDIAN_STATES } from '@/lib/constants/india';
import { checkDelhiveryServiceability } from '@/lib/shipping/delhivery';

// In-memory cache for ultra-fast response
const pincodeCache = new Map<string, any>();

function normalizeStateName(rawState: string): string {
  const clean = (rawState || '').trim().toLowerCase();
  const found = INDIAN_STATES.find(
    (s) => s.name.toLowerCase() === clean || s.name.toLowerCase().includes(clean)
  );
  if (found) return found.name;

  if (clean.includes('orissa')) return 'Odisha';
  if (clean.includes('uttaranchal')) return 'Uttarakhand';
  if (clean.includes('pondicherry')) return 'Puducherry';
  if (clean.includes('delhi')) return 'Delhi';
  if (clean.includes('jammu')) return 'Jammu and Kashmir';
  if (clean.includes('andaman')) return 'Andaman and Nicobar Islands';

  return rawState;
}

function cleanPostOfficeName(name: string): string {
  return (name || '')
    .replace(/\b(G\.?P\.?O\.?|H\.?O\.?|S\.?O\.?|B\.?O\.?|R\.?S\.?)\b/gi, '')
    .replace(/\(.*?\)/g, '')
    .trim();
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

    // Local heuristic guess for instant baseline
    const localGuess = guessCityStateFromPin(pin);

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
      let rawDistrict = (first.District || first.Block || '').replace(/ district/i, '').trim();
      const rawBlock = (first.Block || '').trim();

      // Normalize common district names
      if (/ahmed\s*nagar/i.test(rawDistrict)) rawDistrict = 'Ahmednagar';
      if (/bangalore/i.test(rawDistrict)) rawDistrict = 'Bengaluru';
      if (/aurangabad/i.test(rawDistrict)) rawDistrict = 'Chhatrapati Sambhajinagar';
      if (/central delhi|new delhi/i.test(rawDistrict)) rawDistrict = 'New Delhi';

      // Sort offices: Head Post Office (1) > Sub Post Office (2) > Branch Post Office (3)
      const rank = (type: string) => {
        if (/head/i.test(type)) return 1;
        if (/sub/i.test(type)) return 2;
        return 3;
      };

      const sortedOffices = [...fetchedData].sort((a, b) => rank(a.BranchType || '') - rank(b.BranchType || ''));

      // Determine best primary Town/City name
      let primaryTown = '';

      // Rule A: Check if any post office matches the local guess (e.g. "Lonavala" for 410401)
      if (localGuess?.city) {
        const target = localGuess.city.toLowerCase().trim();
        const match = sortedOffices.find(
          (o) =>
            cleanPostOfficeName(o.Name).toLowerCase() === target ||
            cleanPostOfficeName(o.Name).toLowerCase().includes(target)
        );
        if (match) primaryTown = cleanPostOfficeName(match.Name);
      }

      // Rule B: Check if any office name matches the district (e.g. "Solapur" or "Kolhapur")
      if (!primaryTown) {
        const distMatch = sortedOffices.find(
          (o) => cleanPostOfficeName(o.Name).toLowerCase() === rawDistrict.toLowerCase()
        );
        if (distMatch) primaryTown = cleanPostOfficeName(distMatch.Name);
      }

      // Rule C: Head Post Office
      if (!primaryTown) {
        const ho = sortedOffices.find((o) => /head/i.test(o.BranchType || ''));
        if (ho) primaryTown = cleanPostOfficeName(ho.Name);
      }

      // Rule D: Sub Post Office
      if (!primaryTown) {
        const so = sortedOffices.find((o) => /sub/i.test(o.BranchType || ''));
        if (so) primaryTown = cleanPostOfficeName(so.Name);
      }

      // Rule E: Fallback
      if (!primaryTown) {
        primaryTown = localGuess?.city || rawDistrict || rawBlock;
      }

      // Final City display
      const isMetro = ['mumbai', 'pune', 'bengaluru', 'hyderabad', 'chennai', 'kolkata', 'ahmedabad'].includes(
        rawDistrict.toLowerCase()
      );
      const city = isMetro ? rawDistrict : primaryTown || rawDistrict;

      // Extract unique clean post office names with primaryTown first
      const allOffices = Array.from(
        new Set(sortedOffices.map((o) => cleanPostOfficeName(o.Name)).filter(Boolean))
      );
      allOffices.sort((a, b) => {
        if (a.toLowerCase() === primaryTown.toLowerCase()) return -1;
        if (b.toLowerCase() === primaryTown.toLowerCase()) return 1;
        return 0;
      });

      const delhivery = await checkDelhiveryServiceability(pin);

      const payload = {
        success: true,
        postalCode: pin,
        city,
        district: rawDistrict,
        state: normalizeStateName(rawState),
        defaultTown: primaryTown,
        postOffices: allOffices,
        source: 'INDIA_POST_LIVE',
        delhivery: {
          serviceable: delhivery.serviceable,
          prepaidAvailable: delhivery.prepaidAvailable,
          expectedDeliveryDays: delhivery.expectedDeliveryDays,
          deliverySpeed: delhivery.deliverySpeed,
          carrier: delhivery.carrier,
          providerUrl: delhivery.providerUrl,
        },
      };

      pincodeCache.set(pin, payload);
      return NextResponse.json(payload);
    }

    // 4. Fallback to comprehensive local dictionary
    if (localGuess && localGuess.state) {
      const city = localGuess.city || 'District City';
      const delhivery = await checkDelhiveryServiceability(pin);
      const payload = {
        success: true,
        postalCode: pin,
        city,
        district: city,
        state: localGuess.state,
        defaultTown: city,
        postOffices: [city],
        source: 'LOCAL_REGISTRY',
        delhivery: {
          serviceable: delhivery.serviceable,
          prepaidAvailable: delhivery.prepaidAvailable,
          expectedDeliveryDays: delhivery.expectedDeliveryDays,
          deliverySpeed: delhivery.deliverySpeed,
          carrier: delhivery.carrier,
          providerUrl: delhivery.providerUrl,
        },
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
