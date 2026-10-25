'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart/cart-context';
import { formatCurrency } from '@/lib/utils';
import { calculateOrderFees } from '@/lib/config/fee-settings';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, Droplets } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { items, removeFromCart, updateQuantity, subtotal, totalItems, isCartOpen, setIsCartOpen } = useCart();

  // Lock main page body scroll when cart drawer is active
  useEffect(() => {
    if (!isCartOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const fees = calculateOrderFees(subtotal);
  const freeShippingThreshold = 99900; // ₹999.00
  const freeShippingNeeded = Math.max(0, freeShippingThreshold - subtotal);
  const shippingCost = fees.shippingTotal; // ₹70 + 18% GST (₹82.60) or 0 if free
  const estimatedTax = fees.productGst; // 5% GST on honey products
  const total = fees.grandTotal;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden overscroll-contain">
      {/* Frosted Apple Backdrop with touch & gesture containment */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity animate-in fade-in touch-none"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 overscroll-contain">
        <div className="w-screen max-w-md bg-white text-[#1d1d1f] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 border-l border-[#d2d2d7]/50 overscroll-contain">
          {/* Apple Bag Header */}
          <div className="p-5 sm:p-6 border-b border-[#d2d2d7]/40 flex items-center justify-between bg-[#f5f5f7]/60 backdrop-blur-sm">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">
                Review your Bag.
              </h2>
              <p className="text-xs text-[#6e6e73] mt-0.5">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} • Cold-extracted &amp; NMR Pure
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-[#e8e8ed] text-[#1d1d1f] hover:bg-[#d2d2d7] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close bag"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Free Delivery Banner */}
          {items.length > 0 && (
            <div className="px-5 py-3 bg-[#f5f5f7] border-b border-[#d2d2d7]/40 text-xs">
              {freeShippingNeeded === 0 ? (
                <div className="flex items-center gap-2 text-[#1d1d1f] font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Truck className="w-3 h-3" />
                  </div>
                  <span>You qualify for free express delivery across India.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[#6e6e73]">
                    <span className="flex items-center gap-1.5 text-[#1d1d1f]">
                      <Truck className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span>Add {formatCurrency(freeShippingNeeded)} for free delivery</span>
                    </span>
                    <span className="font-medium text-[#1d1d1f]">
                      {Math.round((subtotal / freeShippingThreshold) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#d2d2d7]/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0071e3] transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bag Items List */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto text-[#86868b]">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-semibold text-[#1d1d1f]">Your Bag is empty.</p>
                  <p className="text-xs text-[#6e6e73] max-w-xs mx-auto">
                    Shop pure wild forest raw honey, monofloral reserves, and cut honeycombs.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="px-6 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="p-4 rounded-[16px] border border-[#d2d2d7]/50 bg-white flex gap-4 items-center shadow-xs hover:border-[#d2d2d7] transition-all"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#f5f5f7] shrink-0 border border-[#e5e5e7] flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-[10px] text-[#86868b] font-mono">
                        {item.sku}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-[#1d1d1f] truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-[#6e6e73] mt-0.5">
                      {formatCurrency(item.price)} each
                    </p>

                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="flex items-center border border-[#d2d2d7] rounded-full overflow-hidden bg-[#f5f5f7]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-2.5 py-1 text-[#1d1d1f] hover:bg-[#e8e8ed] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-[#1d1d1f]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-2.5 py-1 text-[#1d1d1f] hover:bg-[#e8e8ed] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-[#86868b] hover:text-[#e30000] transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold text-[#1d1d1f]">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Apple Store Bag Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-[#d2d2d7]/50 bg-[#f5f5f7] space-y-3.5">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#6e6e73]">
                  <span>Items Subtotal (incl. 5% GST)</span>
                  <span className="font-medium text-[#1d1d1f]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6e6e73]">
                  <span>Courier Shipping (incl. 18% GST)</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-700 font-semibold">FREE</span>
                    ) : (
                      formatCurrency(shippingCost)
                    )}
                  </span>
                </div>
                {fees.platformTotal > 0 && (
                  <div className="flex justify-between text-[#6e6e73]">
                    <span>Platform Fee (incl. 18% GST)</span>
                    <span className="font-medium text-[#1d1d1f]">{formatCurrency(fees.platformTotal)}</span>
                  </div>
                )}
                {fees.pgTotal > 0 && (
                  <div className="flex justify-between text-[#6e6e73]">
                    <span>Payment Gateway (incl. 18% GST)</span>
                    <span className="font-medium text-[#1d1d1f]">{formatCurrency(fees.pgTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold text-[#1d1d1f] pt-2.5 border-t border-[#d2d2d7]/60">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <p className="text-[10px] text-[#86868b] text-right">
                  Transparent statutory GST breakdown on checkout
                </p>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3.5 px-6 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all text-center cursor-pointer"
              >
                <span>Check Out</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
