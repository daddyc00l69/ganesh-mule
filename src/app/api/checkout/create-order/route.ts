import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Razorpay from 'razorpay';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/server';
import { MOCK_PRODUCTS, MOCK_COUPONS, MOCK_ORDERS } from '@/lib/mock-data';
import { addLiveOrder } from '@/lib/orders/store';
import { getGstStateCode } from '@/lib/constants/india';
import { calculateOrderFees } from '@/lib/config/fee-settings';
import {
  calculateDelhiveryShippingCost,
  calculateConsignmentWeightGrams,
  getDelhiverySettings,
  createDelhiveryShipment,
} from '@/lib/shipping/delhivery';

const CheckoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
  }),
  address: z.object({
    fullName: z.string(),
    phone: z.string(),
    street: z.string().optional(),
    flatBuilding: z.string().optional(),
    areaStreet: z.string().optional(),
    landmark: z.string().optional(),
    city: z.string(),
    state: z.string(),
    stateCode: z.string().optional(),
    postalCode: z.string(),
    country: z.string().default('India'),
  }),
  shippingMode: z.enum(['Express', 'Surface']).optional().default('Express'),
  paymentMethod: z.literal('ONLINE').optional().default('ONLINE'),
  couponCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid checkout parameters', details: parsed.error }, { status: 400 });
    }

    const { items: cartItems, customer, address: rawAddress } = parsed.data;
    const currentUser = await getCurrentUser();

    // Standardize Indian Address formatting
    const flatBuilding = rawAddress.flatBuilding?.trim() || '';
    const areaStreet = rawAddress.areaStreet?.trim() || '';
    const landmark = rawAddress.landmark?.trim() || '';
    const compositeStreet =
      rawAddress.street?.trim() ||
      [flatBuilding, areaStreet, landmark ? `Landmark: ${landmark}` : null]
        .filter(Boolean)
        .join(', ');

    const stateCode = rawAddress.stateCode || getGstStateCode(rawAddress.state);

    const address = {
      ...rawAddress,
      street: compositeStreet || 'Address on file',
      flatBuilding: flatBuilding || undefined,
      areaStreet: areaStreet || undefined,
      landmark: landmark || undefined,
      stateCode,
      country: rawAddress.country || 'India',
    };

    // SERVER-SIDE PRICE AND INVENTORY REVALIDATION
    // Never trust client prices or totals!
    let subtotal = 0;
    const verifiedLineItems: {
      productId: string;
      name: string;
      sku: string;
      price: number;
      quantity: number;
      total: number;
    }[] = [];

    // Check database availability once per request
    const dbOnline = await isDatabaseOnline();

    for (const item of cartItems) {
      let product: any = null;
      if (dbOnline) {
        try {
          product = await prisma.product.findUnique({ where: { id: item.productId } });
        } catch {}
      }

      if (!product) {
        product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
      }

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
      }

      // Check stock
      if (product.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}` },
          { status: 400 }
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      verifiedLineItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    // Server-side Coupon verification & discount deduction
    let discountAmount = 0;
    let appliedCouponCode: string | null = null;
    let appliedManagerName: string | null = null;

    if (parsed.data.couponCode) {
      const normalizedCode = parsed.data.couponCode.trim().toUpperCase();
      const coupon = MOCK_COUPONS.find((c) => c.code.toUpperCase() === normalizedCode);

      if (coupon && coupon.isActive) {
        const notExpired = !coupon.expiresAt || new Date(coupon.expiresAt) > new Date();
        const limitNotReached = !coupon.usageLimit || coupon.usageCount < coupon.usageLimit;
        const minOrderMet = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;

        if (notExpired && limitNotReached && minOrderMet) {
          appliedCouponCode = coupon.code;
          appliedManagerName = coupon.assignedManagerNames?.[0] || null;
          if (coupon.discountType === 'PERCENTAGE') {
            const calculated = Math.round((subtotal * coupon.value) / 100);
            discountAmount =
              coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0
                ? Math.min(calculated, coupon.maxDiscountAmount)
                : calculated;
          } else {
            discountAmount = Math.min(coupon.value, subtotal);
          }
          // Increment coupon usage
          coupon.usageCount += 1;
        }
      }
    }

    // Dynamic Delhivery Freight calculation based on destination PIN and gross glass jar consignment weight
    const totalConsignmentWeightGrams = calculateConsignmentWeightGrams(verifiedLineItems as any);
    const chosenMode = parsed.data.shippingMode || 'Express';
    const delhiveryPricing = await calculateDelhiveryShippingCost({
      destinationPincode: address.postalCode,
      weightGrams: totalConsignmentWeightGrams,
      mode: chosenMode,
    });
    const delhiveryShippingBasePaise = Math.round(delhiveryPricing.pricing.subtotal * 100);

    // Server-side calculation of shipping, platform fees, and statutory GST
    const feeBreakdown = calculateOrderFees(subtotal, discountAmount, undefined, delhiveryShippingBasePaise);
    const shippingCost = feeBreakdown.shippingTotal; // base + 18% GST (or 0 if free)
    const platformFee = feeBreakdown.platformTotal; // base + 18% GST
    const taxAmount = feeBreakdown.totalTax; // products 5% + shipping 18% + platform 18%
    const totalAmount = feeBreakdown.grandTotal;

    const orderNumber = `SG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Initialize Razorpay SDK if keys are configured
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder_dev';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder_dev';

    let razorpayOrderId = `order_${Math.random().toString(36).substring(2, 16)}`;

    if (keyId && keySecret && !keyId.includes('placeholder')) {
      try {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const rzpCall = razorpay.orders.create({
          amount: totalAmount, // minor units (paise)
          currency: 'INR',
          receipt: orderNumber,
          notes: {
            customerName: customer.name,
            customerEmail: customer.email,
          },
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Razorpay request timeout')), 3500)
        );
        const rzpOrder = await Promise.race([rzpCall, timeoutPromise]);
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        console.warn('Razorpay API call failed or timed out, using fallback test order ID:', rzpErr);
      }
    }

    // Persist Order in Database & In-Memory Registry
    let internalOrderId = `ord-${Date.now()}`;
    if (dbOnline) {
      try {
        const order = await prisma.order.create({
          data: {
            orderNumber,
            userId: currentUser?.id || 'usr-guest-checkout',
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            shippingAddress: address as any,
            subtotal,
            shippingCost,
            taxAmount,
            totalAmount,
            orderStatus: 'PENDING',
            paymentStatus: 'CREATED',
            items: {
              create: verifiedLineItems.map((item) => ({
                productId: item.productId,
                productName: item.name,
                sku: item.sku,
                price: item.price,
                quantity: item.quantity,
                total: item.total,
              })),
            },
            payments: {
              create: {
                provider: 'RAZORPAY',
                razorpayOrderId,
                amount: totalAmount,
                currency: 'INR',
                status: 'PENDING',
              },
            },
          },
        });
        internalOrderId = order.id;
      } catch {
        // In-memory fallback if DB is offline
      }
    }

    // Always ensure order is present in in-memory registry for immediate access across app
    const orderRecord: any = {
      id: internalOrderId,
      orderNumber,
      userId: currentUser?.id || 'usr-guest-checkout',
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      shippingAddress: address,
      subtotal,
      shippingCost: feeBreakdown.shippingBase,
      shippingGst: feeBreakdown.shippingGst,
      carrier: chosenMode === 'Surface' ? 'Delhivery One (Surface)' : 'Delhivery One (Air Express)',
      shippingMode: chosenMode,
      shippingZone: delhiveryPricing.zone,
      delhiveryStatus: 'Payment Pending',
      platformFee: feeBreakdown.platformBase,
      platformFeeGst: feeBreakdown.platformGst,
      taxAmount: feeBreakdown.totalTax,
      discountAmount,
      couponCode: appliedCouponCode,
      assignedManagerName: appliedManagerName,
      totalAmount,
      feeBreakdown,
      delhiveryPricing,
      paymentMethod: 'ONLINE',
      orderStatus: 'PENDING',
      paymentStatus: 'CREATED',
      items: verifiedLineItems.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        orderId: internalOrderId,
        productId: item.productId,
        productName: item.name,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
      })),
      payments: [
        {
          id: `pay-${Date.now()}`,
          provider: 'RAZORPAY',
          razorpayOrderId,
          amount: totalAmount,
          currency: 'INR',
          status: 'PENDING',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addLiveOrder(orderRecord);

    return NextResponse.json({
      success: true,
      isCod: false,
      orderId: internalOrderId,
      orderNumber,
      razorpayOrderId,
      amount: totalAmount,
      currency: 'INR',
      keyId,
      customer,
      lineItems: verifiedLineItems,
      discountAmount,
      appliedCouponCode,
      appliedManagerName,
      feeBreakdown,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Checkout order creation failed', details: err.message }, { status: 500 });
  }
}
