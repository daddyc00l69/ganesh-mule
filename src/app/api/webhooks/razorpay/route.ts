import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay';
import { prisma } from '@/lib/db';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { sendEmail } from '@/lib/email/resend';
import { getPaymentFailedEmailHtml } from '@/lib/email/templates';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_placeholder_dev';

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    // Verify raw webhook HMAC signature
    if (webhookSecret && !webhookSecret.includes('placeholder')) {
      const isValid = verifyRazorpayWebhookSignature({
        rawBody,
        signature,
        secret: webhookSecret,
      });

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;
    const eventType = payload.event;

    // IDEMPOTENCY CHECK: deduplicate webhooks by eventId
    try {
      const existing = await prisma.webhookEvent.findUnique({
        where: { eventId },
      });

      if (existing) {
        // Event already safely processed, return 200 immediately
        return NextResponse.json({ status: 'already_processed', eventId });
      }

      await prisma.webhookEvent.create({
        data: {
          eventId,
          eventType,
          payload,
          processed: true,
        },
      });
    } catch {}

    // Process specific Razorpay Webhook Event Types
    if (eventType === 'order.paid' || eventType === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        try {
          await prisma.payment.updateMany({
            where: { razorpayOrderId },
            data: {
              status: 'PAID',
              razorpayPaymentId,
              updatedAt: new Date(),
            },
          });

          const payment = await prisma.payment.findFirst({
            where: { razorpayOrderId },
          });

          if (payment) {
            await prisma.order.update({
              where: { id: payment.orderId },
              data: {
                paymentStatus: 'PAID',
                orderStatus: 'PROCESSING',
              },
            });
          }
        } catch {}
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const errorDescription = paymentEntity?.error_description || 'Payment transaction failed or timed out';

      if (razorpayOrderId) {
        // Update database if online
        try {
          await prisma.payment.updateMany({
            where: { razorpayOrderId },
            data: {
              status: 'FAILED',
              errorDescription,
            },
          });
        } catch {}

        // Update in-memory mock order
        const mockOrder = MOCK_ORDERS.find(
          (o) => o.payments?.some((p) => p.razorpayOrderId === razorpayOrderId)
        );
        if (mockOrder) {
          mockOrder.paymentStatus = 'FAILED';
          mockOrder.updatedAt = new Date().toISOString();

          // Dispatch recovery email
          try {
            const html = getPaymentFailedEmailHtml(mockOrder, errorDescription);
            sendEmail(
              {
                to: mockOrder.customerEmail,
                subject: `Payment Incomplete for Order #${mockOrder.orderNumber} - Resume Checkout`,
                html,
              },
              'PAYMENT_FAILED'
            ).catch((e) => console.warn('Webhook payment failed email warning:', e));
          } catch (e) {
            console.warn('Webhook email dispatch exception:', e);
          }
        }
      }
    }

    return NextResponse.json({ status: 'success', eventId });
  } catch (err: any) {
    return NextResponse.json({ error: 'Webhook processing error', details: err.message }, { status: 500 });
  }
}
