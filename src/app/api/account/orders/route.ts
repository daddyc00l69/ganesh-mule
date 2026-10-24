import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getCustomerSession } from '@/lib/auth/otp';
import { getCurrentUser } from '@/lib/auth/server';
import { getLiveOrdersByCustomerEmail, getLiveOrderById } from '@/lib/orders/store';

export async function GET(req: NextRequest) {
  try {
    // Enforce strict login requirement: no orders are shown without active authenticated session
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    let customerEmail: string | null = null;
    if (token) {
      const customer = getCustomerSession(token);
      if (customer) {
        customerEmail = customer.email;
      } else {
        const dbUser = await getCurrentUser();
        if (dbUser) customerEmail = dbUser.email;
      }
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in with your email OTP to view orders.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('orderNumber')?.trim();

    // 1. If explicit orderNumber lookup requested, verify it belongs to this authenticated customer
    if (orderNumber) {
      const order = getLiveOrderById(orderNumber);
      if (!order || order.customerEmail?.toLowerCase() !== customerEmail.toLowerCase()) {
        return NextResponse.json({ error: 'Order not found in your account.' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        orders: [order],
      });
    }

    const orders = getLiveOrdersByCustomerEmail(customerEmail);

    return NextResponse.json({
      success: true,
      email: customerEmail,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to retrieve orders', details: error.message }, { status: 500 });
  }
}
