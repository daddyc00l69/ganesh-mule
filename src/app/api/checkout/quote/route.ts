import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { getLiveProductById } from '@/lib/inventory/store';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { getLiveCouponByCode } from '@/lib/coupons/store';
import {
  calculateDelhiveryShippingCost,
  calculateConsignmentWeightGrams,
  getDelhiverySettings,
} from '@/lib/shipping/delhivery';
import {
  calculateAuthoritativeQuote,
  AuthoritativeQuoteItemInput,
} from '@/lib/finance/engine';

const QuoteRequestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  destinationPin: z.string().optional(),
  destinationState: z.string().optional(),
  shippingMode: z.enum(['Express', 'Surface']).optional().default('Express'),
  couponCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = QuoteRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid quote parameters', details: parsed.error },
        { status: 400 }
      );
    }

    const { items: cartItems, destinationPin, destinationState, shippingMode, couponCode } = parsed.data;
    const dbOnline = await isDatabaseOnline();

    // 1. Authoritative Server-Side Product Price Validation
    const verifiedItems: AuthoritativeQuoteItemInput[] = [];
    let grossSubtotalPaise = 0;

    for (const item of cartItems) {
      let product: any = null;
      if (dbOnline) {
        try {
          product = await prisma.product.findUnique({ where: { id: item.productId } });
        } catch {}
      }
      if (!product) {
        product = getLiveProductById(item.productId) || MOCK_PRODUCTS.find((p) => p.id === item.productId);
      }
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
      }

      const itemTotal = product.price * item.quantity;
      grossSubtotalPaise += itemTotal;

      const weight = product.weight || (product.weightGrams ? `${product.weightGrams}g` : '500g');
      const weightGrams = product.weightGrams || (weight === '1kg' ? 1000 : parseInt(weight, 10) || 500);

      verifiedItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitPricePaise: product.price,
        quantity: item.quantity,
        weight,
        weightGrams,
        hsnCode: '0409',
      });
    }

    // 2. Authoritative Coupon Verification
    let discountPaise = 0;
    let verifiedCouponCode: string | null = null;

    if (couponCode) {
      const normalized = couponCode.trim().toUpperCase();
      let coupon: any = null;

      if (dbOnline) {
        try {
          coupon = await prisma.discountCoupon.findUnique({ where: { code: normalized } });
        } catch {}
      }
      if (!coupon) {
        coupon = getLiveCouponByCode(normalized);
      }

      if (coupon && coupon.isActive) {
        const notExpired = !coupon.expiresAt || new Date(coupon.expiresAt) > new Date();
        const limitNotReached = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
        const minOrderMet = !coupon.minOrderAmount || grossSubtotalPaise >= coupon.minOrderAmount;

        if (notExpired && limitNotReached && minOrderMet) {
          verifiedCouponCode = coupon.code;
          if (coupon.discountType === 'PERCENTAGE') {
            const calculated = Math.round((grossSubtotalPaise * coupon.value) / 100);
            discountPaise =
              coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0
                ? Math.min(calculated, coupon.maxDiscountAmount)
                : calculated;
          } else {
            discountPaise = Math.min(coupon.value, grossSubtotalPaise);
          }
        }
      }
    }

    // 3. Live Delhivery Delivery Freight if 6-digit PIN Provided
    let customDeliveryBasePaise: number | undefined = undefined;
    let customDeliveryTotalPaise: number | undefined = undefined;

    if (destinationPin && destinationPin.length === 6) {
      try {
        const totalGrams = calculateConsignmentWeightGrams(verifiedItems as any);
        const mode = shippingMode || getDelhiverySettings().shippingMode || 'Surface';
        const pricing = await calculateDelhiveryShippingCost({
          destinationPincode: destinationPin,
          weightGrams: totalGrams,
          mode,
        });
        if (pricing && pricing.pricing) {
          customDeliveryBasePaise = Math.round(pricing.pricing.subtotal * 100);
          customDeliveryTotalPaise = pricing.pricing.totalShippingCostPaise;
        }
      } catch (err) {
        console.warn('[QuoteAPI] Delhivery calculation notice:', err);
      }
    }

    // 4. Run authoritative decimal calculation engine
    const quote = await calculateAuthoritativeQuote({
      items: verifiedItems,
      destinationPin,
      destinationState,
      shippingMode,
      customDeliveryBasePaise,
      customDeliveryTotalPaise,
      couponDiscountPaise: discountPaise,
      couponCode: verifiedCouponCode || undefined,
    });

    return NextResponse.json(quote);
  } catch (err: any) {
    console.error('[QuoteAPI] Error generating checkout quote:', err);
    return NextResponse.json(
      { error: 'Failed to calculate authoritative order quote', details: err.message },
      { status: 500 }
    );
  }
}
