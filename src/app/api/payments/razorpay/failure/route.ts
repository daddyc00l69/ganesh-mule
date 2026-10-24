import { NextRequest, NextResponse } from 'next/server';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { sendEmail } from '@/lib/email/resend';
import { getPaymentFailedEmailHtml } from '@/lib/email/templates';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, errorReason, customerEmail } = body as {
      orderNumber?: string;
      errorReason?: string;
      customerEmail?: string;
    };

    const order = MOCK_ORDERS.find((o) => o.orderNumber === orderNumber);
    const recipient = customerEmail || order?.customerEmail;

    if (order) {
      order.paymentStatus = 'FAILED';
      order.updatedAt = new Date().toISOString();
    }

    let emailDispatched = false;
    if (recipient) {
      try {
        const html = getPaymentFailedEmailHtml(
          order || { orderNumber, totalAmount: 0 },
          errorReason || 'Transaction interrupted or declined by bank'
        );

        const res = await sendEmail(
          {
            to: recipient,
            subject: `Payment Incomplete for Order #${orderNumber || 'Ganesh Mule'} - Resume Checkout`,
            html,
          },
          'PAYMENT_FAILED'
        );
        emailDispatched = res.success;
      } catch (err) {
        console.warn('Payment failed email trigger warning:', err);
      }
    }

    return NextResponse.json({
      success: true,
      emailDispatched,
      message: 'Payment failure logged and customer recovery email triggered.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to record payment failure', details: error.message },
      { status: 500 }
    );
  }
}
