import { NextRequest, NextResponse } from 'next/server';
import {
  calculateDelhiveryShippingCost,
  calculateConsignmentWeightGrams,
} from '@/lib/shipping/delhivery';
import { isValidIndianPin } from '@/lib/constants/india';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const destinationPin =
      searchParams.get('destinationPin') ||
      searchParams.get('d_pin') ||
      searchParams.get('pin') ||
      searchParams.get('pincode');

    if (!destinationPin) {
      return NextResponse.json(
        {
          error:
            'Missing destination PIN code. Provide ?destinationPin=XXXXXX (e.g. 411001 for local Pune)',
        },
        { status: 400 }
      );
    }

    const cleanPin = destinationPin.replace(/\D/g, '').slice(0, 6);
    if (!isValidIndianPin(cleanPin)) {
      return NextResponse.json(
        { error: 'Invalid 6-digit Indian destination PIN code' },
        { status: 400 }
      );
    }

    const weightParam =
      searchParams.get('weightGrams') ||
      searchParams.get('weight') ||
      searchParams.get('cgm');
    const weightGrams = weightParam ? parseInt(weightParam, 10) : 600; // Default 600g (300g jar package)

    const modeParam = searchParams.get('mode') || searchParams.get('md');
    const mode = modeParam?.toLowerCase() === 'surface' || modeParam === 'S' ? 'Surface' : 'Express';

    const originPin = searchParams.get('originPin') || searchParams.get('o_pin') || undefined;

    const result = await calculateDelhiveryShippingCost({
      destinationPincode: cleanPin,
      weightGrams,
      mode,
      originPincode: originPin,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to calculate Delhivery shipping cost', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      destinationPincode,
      weightGrams: rawWeight,
      mode,
      originPincode,
      items,
    } = body as {
      destinationPincode?: string;
      weightGrams?: number;
      mode?: 'Express' | 'Surface';
      originPincode?: string;
      items?: any[];
    };

    if (!destinationPincode) {
      return NextResponse.json(
        { error: 'Missing destinationPincode in JSON payload' },
        { status: 400 }
      );
    }

    const cleanPin = destinationPincode.replace(/\D/g, '').slice(0, 6);
    if (!isValidIndianPin(cleanPin)) {
      return NextResponse.json(
        { error: 'Invalid 6-digit Indian destination PIN code' },
        { status: 400 }
      );
    }

    let weightGrams = rawWeight;
    if (!weightGrams && items && Array.isArray(items)) {
      weightGrams = calculateConsignmentWeightGrams(items);
    }
    if (!weightGrams) {
      weightGrams = 600;
    }

    const result = await calculateDelhiveryShippingCost({
      destinationPincode: cleanPin,
      weightGrams,
      mode: mode || 'Express',
      originPincode,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to calculate Delhivery shipping cost', details: error.message },
      { status: 500 }
    );
  }
}
