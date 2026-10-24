import { createHmac, timingSafeEqual } from 'crypto';

export interface VerifyPaymentSignatureParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secret: string;
}

export interface VerifyWebhookSignatureParams {
  rawBody: string;
  signature: string;
  secret: string;
}

/**
 * Verifies Razorpay Checkout payment signature using official HMAC SHA256 algorithm.
 * Formula: HMAC-SHA256(order_id + "|" + razorpay_payment_id, secret) == signature
 */
export function verifyRazorpayPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  secret,
}: VerifyPaymentSignatureParams): boolean {
  try {
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (expectedSignature.length !== razorpaySignature.length) {
      return false;
    }

    return timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(razorpaySignature, 'utf-8')
    );
  } catch {
    return false;
  }
}

/**
 * Verifies Razorpay Webhook signature against raw request body using HMAC SHA256.
 */
export function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
  secret,
}: VerifyWebhookSignatureParams): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature.length !== signature.length) {
      return false;
    }

    return timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    return false;
  }
}
