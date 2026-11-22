import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { getEligibleUnreviewedItems } from '@/lib/reviews/review-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email');
    const currentUser = await getCurrentUser();

    const customerEmail = emailParam || currentUser?.email;
    const customerId = currentUser?.id;

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Email parameter or authenticated session required' },
        { status: 401 }
      );
    }

    const eligibleItems = await getEligibleUnreviewedItems(customerEmail, customerId);

    return NextResponse.json({
      success: true,
      eligibleItems,
      count: eligibleItems.length,
    });
  } catch (error: any) {
    console.error('[Reviews Eligible API Error]', error);
    return NextResponse.json(
      { error: 'Failed to retrieve eligible review items', details: error.message },
      { status: 500 }
    );
  }
}
