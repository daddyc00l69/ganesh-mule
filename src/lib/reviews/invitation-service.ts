import crypto from 'crypto';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { getReviewRewardSettings } from './settings-store';
import { sendEmail } from '@/lib/email/resend';

export interface ScheduleInvitationResult {
  scheduled: boolean;
  invitationId?: string;
  reason?: string;
}

/**
 * Schedules a review invitation for a delivered order.
 * Idempotent: Never schedules duplicate invitations for the same order.
 */
export async function scheduleOrderReviewInvitation(
  orderId: string
): Promise<ScheduleInvitationResult> {
  const dbOnline = await isDatabaseOnline();
  if (!dbOnline) {
    return { scheduled: false, reason: 'Database is offline' };
  }

  const settings = await getReviewRewardSettings();
  if (!settings.isEnabled || !settings.sendInvitationEmails) {
    return { scheduled: false, reason: 'Review invitation emails are disabled in settings' };
  }

  // 1. Fetch order details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true },
      },
      reviewInvitations: true,
    },
  });

  if (!order) {
    return { scheduled: false, reason: 'Order not found' };
  }

  if (order.orderStatus !== 'DELIVERED') {
    return { scheduled: false, reason: 'Invitations are only scheduled for DELIVERED orders' };
  }

  // Check if invitation already exists
  if (order.reviewInvitations && order.reviewInvitations.length > 0) {
    return {
      scheduled: false,
      reason: 'Invitation already scheduled for this order',
      invitationId: order.reviewInvitations[0].id,
    };
  }

  // Generate unique URL-safe cryptographic token (32 hex characters)
  const token = crypto.randomBytes(16).toString('hex');
  const delayMs = Math.max(0, settings.delayDaysAfterDelivery) * 24 * 60 * 60 * 1000;
  const scheduledFor = new Date(Date.now() + delayMs);

  const invitation = await prisma.reviewInvitation.create({
    data: {
      orderId: order.id,
      customerEmail: order.customerEmail.trim().toLowerCase(),
      customerName: order.customerName,
      token,
      status: 'PENDING',
      scheduledFor,
    },
  });

  return { scheduled: true, invitationId: invitation.id };
}

/**
 * Dispatches due pending review invitations.
 * Scans for invitations where status is PENDING and scheduledFor <= now.
 */
export async function dispatchDueReviewInvitations(): Promise<{
  dispatched: number;
  failed: number;
  errors: string[];
}> {
  const dbOnline = await isDatabaseOnline();
  if (!dbOnline) return { dispatched: 0, failed: 0, errors: ['Database offline'] };

  const dueInvitations = await prisma.reviewInvitation.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: new Date() },
    },
    include: {
      order: {
        include: {
          items: {
            include: { product: true },
          },
        },
      },
    },
    take: 25,
  });

  let dispatched = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const inv of dueInvitations) {
    // If order was cancelled or refunded after delivery, cancel invitation
    if (inv.order.orderStatus === 'CANCELLED' || inv.order.paymentStatus === 'REFUNDED') {
      await prisma.reviewInvitation.update({
        where: { id: inv.id },
        data: { status: 'EXPIRED', errorReason: 'Order cancelled or refunded' },
      });
      continue;
    }

    try {
      const emailResult = await sendReviewInvitationEmail({
        to: inv.customerEmail,
        customerName: inv.customerName,
        orderNumber: inv.order.orderNumber,
        token: inv.token,
        items: inv.order.items.map((it) => ({
          orderItemId: it.id,
          productName: it.productName || it.product.name,
          productSlug: it.product.slug,
          weight: it.weight || 'Solid Glass Jar',
        })),
      });

      if (emailResult.success) {
        await prisma.reviewInvitation.update({
          where: { id: inv.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            errorReason: null,
          },
        });
        dispatched++;
      } else {
        await prisma.reviewInvitation.update({
          where: { id: inv.id },
          data: {
            retryCount: { increment: 1 },
            errorReason: emailResult.error || 'Failed to dispatch email',
          },
        });
        failed++;
        errors.push(`Order ${inv.order.orderNumber}: ${emailResult.error}`);
      }
    } catch (err: any) {
      await prisma.reviewInvitation.update({
        where: { id: inv.id },
        data: {
          retryCount: { increment: 1 },
          errorReason: err.message,
        },
      });
      failed++;
      errors.push(`Order ${inv.order.orderNumber}: ${err.message}`);
    }
  }

  return { dispatched, failed, errors };
}

/**
 * Resends a review invitation email (e.g. from Admin or manual trigger).
 */
export async function resendReviewInvitation(invitationId: string) {
  const dbOnline = await isDatabaseOnline();
  if (!dbOnline) throw new Error('Database offline');

  const inv = await prisma.reviewInvitation.findUnique({
    where: { id: invitationId },
    include: {
      order: {
        include: {
          items: {
            include: { product: true },
          },
        },
      },
    },
  });

  if (!inv) throw new Error('Invitation record not found');

  const emailResult = await sendReviewInvitationEmail({
    to: inv.customerEmail,
    customerName: inv.customerName,
    orderNumber: inv.order.orderNumber,
    token: inv.token,
    items: inv.order.items.map((it) => ({
      orderItemId: it.id,
      productName: it.productName || it.product.name,
      productSlug: it.product.slug,
      weight: it.weight || 'Solid Glass Jar',
    })),
  });

  if (emailResult.success) {
    await prisma.reviewInvitation.update({
      where: { id: inv.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        errorReason: null,
      },
    });
  } else {
    throw new Error(emailResult.error || 'Failed to resend invitation email');
  }

  return { success: true };
}

/**
 * Renders and sends the personalized review invitation email.
 */
export async function sendReviewInvitationEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  token: string;
  items: Array<{
    orderItemId: string;
    productName: string;
    productSlug: string;
    weight: string;
  }>;
}) {
  const { to, customerName, orderNumber, token, items } = params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shop-kandalovers.devtushar.uk';

  const productListHtml = items
    .map((item) => {
      const reviewUrl = `${baseUrl}/product/${item.productSlug}?reviewToken=${token}&orderItemId=${item.orderItemId}`;
      return `
        <div style="background: #fafafc; border: 1px solid #e5e5ea; border-radius: 14px; padding: 18px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #1d1d1f;">
              ${item.productName}
            </h4>
            <span style="font-size: 11px; color: #86868b; font-family: monospace;">
              Size: ${item.weight}
            </span>
          </div>
          <div>
            <a href="${reviewUrl}" style="display: inline-block; background-color: #0071e3; color: #ffffff; text-decoration: none; padding: 8px 18px; border-radius: 980px; font-size: 12px; font-weight: 600;">
              Rate &amp; Review ★
            </a>
          </div>
        </div>
      `;
    })
    .join('');

  const accountReviewsUrl = `${baseUrl}/account?tab=REVIEWS_REWARDS`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>How was your Ganesh Honey?</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f7; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #d2d2d7;">
    
    <!-- Header -->
    <div style="background: #1d1d1f; padding: 32px 32px; text-align: center; color: #ffffff;">
      <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #ffb340; margin-bottom: 8px;">
        Ganesh Mule Pure Honey
      </span>
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">
        How was your Ganesh Honey?
      </h1>
      <p style="margin: 8px 0 0; color: #a1a1a6; font-size: 12px; font-family: monospace;">
        Order #${orderNumber} • Delivered
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 32px;">
      <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">
        Hello <strong>${customerName}</strong>,
      </p>
      <p style="margin: 0 0 20px; font-size: 14px; color: #515154; line-height: 1.6;">
        We hope you are enjoying your cold-extracted pure honey! We would love to know what you think about your purchase.
      </p>
      <p style="margin: 0 0 24px; font-size: 13px; color: #0071e3; font-weight: 600;">
        🎁 Bonus Reward: Leave an honest review for your purchased jar to receive an exclusive discount coupon on your next harvest!
      </p>

      <div style="margin-bottom: 24px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #86868b; letter-spacing: 0.1em; display: block; margin-bottom: 10px;">
          Products from your delivered order:
        </span>
        ${productListHtml}
      </div>

      <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #f0f0f2;">
        <a href="${accountReviewsUrl}" style="color: #0071e3; font-size: 12px; font-weight: 600; text-decoration: none;">
          Or review anytime in your Customer Dashboard →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f5f5f7; padding: 20px 32px; text-align: center; border-top: 1px solid #d2d2d7; font-size: 11px; color: #86868b;">
      <p style="margin: 0;">Thank you for supporting artisanal natural apiary beekeeping.</p>
      <p style="margin: 4px 0 0;">Ganesh Mule Pure Honey Team • care@devtushar.uk</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail(
    {
      to,
      subject: 'How was your Ganesh Honey? Share your thoughts & earn a reward.',
      html,
    },
    'REVIEW_INVITATION'
  );
}
