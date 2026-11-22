import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { getCustomerReviewsAndRewards } from '@/lib/reviews/review-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email');
    const currentUser = await getCurrentUser();

    const customerEmail = emailParam || currentUser?.email;
    const customerId = currentUser?.id;

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Email parameter or active customer session required' },
        { status: 401 }
      );
    }

    const data = await getCustomerReviewsAndRewards(customerEmail, customerId);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error('[My Reviews & Rewards API Error]', error);
    return NextResponse.json(
      { error: 'Failed to retrieve your reviews and rewards', details: error.message },
      { status: 500 }
    );
  }
}
