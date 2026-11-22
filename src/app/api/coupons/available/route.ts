import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { getCustomerAvailableReviewRewards } from '@/lib/reviews/reward-coupon-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email');
    const currentUser = await getCurrentUser();

    const customerEmail = emailParam || currentUser?.email;

    if (!customerEmail) {
      return NextResponse.json({ rewards: [] });
    }

    const rewards = await getCustomerAvailableReviewRewards(customerEmail);

    return NextResponse.json({
      success: true,
      rewards,
      count: rewards.length,
    });
  } catch (error: any) {
    console.error('[Available Coupons API Error]', error);
    return NextResponse.json(
      { error: 'Failed to retrieve available customer reward coupons', details: error.message },
      { status: 500 }
    );
  }
}
