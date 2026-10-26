import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay';
import { prisma } from '@/lib/db';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { getLiveOrders, updateLiveOrderStatus, addLiveOrder } from '@/lib/orders/store';
import { decrementProductStock } from '@/lib/inventory/store';
import { sendEmail, ADMIN_NOTIFICATION_EMAIL } from '@/lib/email/resend';
import { getPaymentFailedEmailHtml, getOrderConfirmationEmailHtml, getNewOrderAdminAlertEmailHtml } from '@/lib/email/templates';
import { getDelhiverySettings, createDelhiveryShipment } from '@/lib/shipping/delhivery';
import { OrderRecord } from '@/types';

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
        let dbOrderId: string | null = null;
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
            dbOrderId = payment.orderId;
            await prisma.order.update({
              where: { id: payment.orderId },
              data: {
                paymentStatus: 'PAID',
                orderStatus: 'PROCESSING',
              },
            });
          }
        } catch {}

        // Resolve or populate Live Order record
        const liveOrders = getLiveOrders();
        let orderRecord = liveOrders.find(
          (o) => o.payments?.some((p) => p.razorpayOrderId === razorpayOrderId)
        );

        if (!orderRecord && dbOrderId) {
          try {
            const dbOrder = await prisma.order.findUnique({
              where: { id: dbOrderId },
              include: { items: true, payments: true },
            });
            if (dbOrder) {
              const loadedRecord: any = {
                id: dbOrder.id,
                orderNumber: dbOrder.orderNumber,
                userId: dbOrder.userId,
                customerName: dbOrder.customerName,
                customerEmail: dbOrder.customerEmail,
                customerPhone: dbOrder.customerPhone || '',
                shippingAddress: (dbOrder.shippingAddress as any) || {
                  fullName: dbOrder.customerName,
                  phone: dbOrder.customerPhone || '',
                  street: 'Customer Delivery Address',
                  city: 'Mumbai',
                  state: 'Maharashtra',
                  postalCode: '400001',
                  country: 'India',
                },
                subtotal: dbOrder.subtotal,
                shippingCost: dbOrder.shippingCost,
                taxAmount: dbOrder.taxAmount,
                discountAmount: dbOrder.discountAmount,
                totalAmount: dbOrder.totalAmount,
                orderStatus: 'PROCESSING',
                paymentStatus: 'PAID',
                carrier: dbOrder.carrier || 'Delhivery One (Surface)',
                trackingNumber: dbOrder.trackingNumber || undefined,
                delhiveryWaybill: dbOrder.trackingNumber || undefined,
                items: dbOrder.items.map((it) => ({
                  id: it.id,
                  orderId: dbOrder.id,
                  productId: it.productId,
                  productName: it.productName,
                  sku: it.sku,
                  price: it.price,
                  quantity: it.quantity,
                  total: it.total,
                })),
                payments: dbOrder.payments.map((p) => ({
                  id: p.id,
                  provider: p.provider,
                  razorpayOrderId: p.razorpayOrderId || undefined,
                  razorpayPaymentId: p.razorpayPaymentId || undefined,
                  amount: p.amount,
                  currency: p.currency,
                  status: p.status,
                })),
                createdAt: dbOrder.createdAt.toISOString(),
                updatedAt: new Date().toISOString(),
              };
              orderRecord = loadedRecord;
              addLiveOrder(loadedRecord);
            }
          } catch {}
        }

        if (orderRecord) {
          orderRecord.paymentStatus = 'PAID';
          orderRecord.orderStatus = 'PROCESSING';
          if (!orderRecord.payments) orderRecord.payments = [];
          if (orderRecord.payments.length > 0) {
            orderRecord.payments[0] = {
              ...orderRecord.payments[0],
              razorpayPaymentId,
              status: 'PAID',
            };
          } else {
            orderRecord.payments.push({
              id: `pay-${Date.now()}`,
              provider: 'RAZORPAY',
              razorpayOrderId,
              razorpayPaymentId,
              status: 'PAID',
            });
          }

          updateLiveOrderStatus(orderRecord.orderNumber, {
            paymentStatus: 'PAID',
            orderStatus: 'PROCESSING',
            payments: orderRecord.payments,
          });

          // Decrement inventory stock
          if (orderRecord.items && orderRecord.items.length > 0) {
            for (const item of orderRecord.items) {
              try {
                decrementProductStock(item.productId, item.quantity, orderRecord.orderNumber);
              } catch (stkErr) {
                console.warn('[Webhook Stock Decrement Error]', stkErr);
              }
            }
          }

          // AUTOMATIC LIVE COURIER BOOKING ON DELHIVERY ONE (100% Automated upon payment)
          const isLiveAwb = Boolean(orderRecord.trackingNumber && !orderRecord.trackingNumber.startsWith('143'));
          if (!isLiveAwb) {
            try {
              const mode: 'Express' | 'Surface' =
                (orderRecord as any).shippingMode ||
                (orderRecord.carrier?.toLowerCase().includes('air') ? 'Express' : 'Surface');

              const shipmentResult = await createDelhiveryShipment(orderRecord, {
                mode,
                forceRegenerate: true,
              });
              console.log(`[Webhook Delhivery Auto-Ship] Auto-booked AWB ${shipmentResult.waybill} for Order #${orderRecord.orderNumber}`);

              try {
                await prisma.order.updateMany({
                  where: { orderNumber: orderRecord.orderNumber },
                  data: {
                    trackingNumber: shipmentResult.waybill,
                    carrier: shipmentResult.carrier,
                    orderStatus: 'PROCESSING',
                    paymentStatus: 'PAID',
                  },
                });
              } catch {}
            } catch (shipErr) {
              console.error('[Webhook Delhivery Auto-Ship Error]', shipErr);
            }
          }

          // Automatically dispatch confirmation and admin alert emails
          try {
            const customerHtml = getOrderConfirmationEmailHtml(orderRecord);
            sendEmail(
              {
                to: orderRecord.customerEmail,
                subject: `Confirmed: Ganesh Mule Order #${orderRecord.orderNumber}`,
                html: customerHtml,
              },
              'ORDER_CONFIRMATION'
            ).catch((e) => console.warn('Webhook customer email warning:', e));

            const adminHtml = getNewOrderAdminAlertEmailHtml(orderRecord);
            sendEmail(
              {
                to: ADMIN_NOTIFICATION_EMAIL,
                subject: `[New Order Alert] ₹${(orderRecord.totalAmount / 100).toFixed(2)} - #${orderRecord.orderNumber}`,
                html: adminHtml,
              },
              'ADMIN_ORDER_ALERT'
            ).catch((e) => console.warn('Webhook admin alert warning:', e));
          } catch (emailErr) {
            console.warn('[Webhook Email Dispatch Exception]', emailErr);
          }
        }
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
