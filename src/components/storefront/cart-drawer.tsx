'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart/cart-context';
import { formatCurrency } from '@/lib/utils';
import { calculateOrderFees } from '@/lib/config/fee-settings';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { items, removeFromCart, updateQuantity, clearCart, subtotal, totalItems, isCartOpen, setIsCartOpen } = useCart();
  const [isRendered, setIsRendered] = useState(isCartOpen);
  const [isVisible, setIsVisible] = useState(isCartOpen);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // Apple-smooth Open and Close animation states
  useEffect(() => {
    if (isCartOpen) {
      setIsRendered(true);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [isCartOpen]);

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

  // Animated item removal handler
  const handleRemoveItem = (productId: string) => {
    setRemovingIds((prev) => new Set(prev).add(productId));
    setTimeout(() => {
      removeFromCart(productId);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }, 300);
  };

  if (!isRendered) return null;

  const freeShippingThreshold = 99900; // ₹999.00
  const freeShippingNeeded = Math.max(0, freeShippingThreshold - subtotal);
  const total = subtotal;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden overscroll-contain">
      {/* Frosted Apple Backdrop with smooth fade in/out */}
      <div
        onClick={() => setIsCartOpen(false)}
        className={`absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300 ease-out touch-none ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 overscroll-contain pointer-events-none">
        <div
          className={`w-screen max-w-md bg-white text-[#1d1d1f] flex flex-col shadow-2xl border-l border-[#d2d2d7] overscroll-contain pointer-events-auto transform transition-transform duration-300 ease-out ${
            isVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Apple Bag Header */}
          <div className="p-5 sm:p-6 border-b border-[#d2d2d7]/80 flex items-center justify-between bg-[#f5f5f7]/80 backdrop-blur-sm">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">
                Review your Bag.
              </h2>
              <p className="text-xs text-[#86868b] mt-0.5">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} • Cold-extracted &amp; NMR Pure
              </p>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearCart()}
                  className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-full font-medium transition-colors flex items-center gap-1 cursor-pointer border border-rose-200/60"
                  title="Empty Bag"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Empty Bag</span>
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-black/5 text-[#1d1d1f] hover:bg-black/10 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close bag"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Free Delivery Banner */}
          {items.length > 0 && (
            <div className="px-5 py-3 bg-[#f5f5f7] border-b border-[#d2d2d7]/60 text-xs">
              {freeShippingNeeded === 0 ? (
                <div className="flex items-center gap-2 text-[#1d1d1f] font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Truck className="w-3 h-3" />
                  </div>
                  <span>You qualify for free express delivery across India.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[#86868b]">
                    <span className="flex items-center gap-1.5 text-[#1d1d1f]">
                      <Truck className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span>Add {formatCurrency(freeShippingNeeded)} for free delivery</span>
                    </span>
                    <span className="font-medium text-[#1d1d1f]">
                      {Math.round((subtotal / freeShippingThreshold) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0071e3] transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bag Items List with Apple-Smooth Removal Animation */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto text-[#86868b]">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-[#1d1d1f]">Your Bag is empty.</p>
                  <p className="text-xs text-[#86868b] max-w-xs mx-auto">
                    Shop pure wild forest raw honey, monofloral reserves, and cut honeycombs.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="px-6 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : (
              items.map((item) => {
                const isRemoving = removingIds.has(item.productId);
                return (
                  <div
                    key={item.productId}
                    style={{
                      maxHeight: isRemoving ? '0px' : '160px',
                      opacity: isRemoving ? 0 : 1,
                      transform: isRemoving ? 'translateX(24px) scale(0.96)' : 'translateX(0) scale(1)',
                      marginBottom: isRemoving ? '0px' : undefined,
                      paddingTop: isRemoving ? '0px' : undefined,
                      paddingBottom: isRemoving ? '0px' : undefined,
                      overflow: 'hidden',
                    }}
                    className="rounded-[18px] border border-[#d2d2d7]/70 bg-white flex gap-4 items-center shadow-xs hover:border-[#86868b] transition-all duration-300 ease-out p-4"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#f5f5f7] shrink-0 border border-[#d2d2d7]/60 flex items-center justify-center">
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
                      <p className="text-xs text-[#86868b] mt-0.5">
                        {formatCurrency(item.price)} each
                      </p>

                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex items-center border border-[#d2d2d7] rounded-full overflow-hidden bg-[#f5f5f7]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="px-2.5 py-1 text-[#1d1d1f] hover:bg-black/10 transition-colors"
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
                            className="px-2.5 py-1 text-[#1d1d1f] hover:bg-black/10 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-[#86868b] hover:text-rose-600 transition-colors p-1 cursor-pointer"
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
                );
              })
            )}
          </div>

          {/* Apple Store Bag Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-[#d2d2d7]/80 bg-[#f5f5f7] space-y-3.5">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#86868b]">
                  <span>Items Subtotal (incl. 5% GST)</span>
                  <span className="font-medium text-[#1d1d1f]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#86868b]">
                  <span>Courier Shipping</span>
                  <span className="font-normal text-[#86868b] text-[11px]">
                    Calculated at Checkout
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold text-[#1d1d1f] pt-2.5 border-t border-[#d2d2d7]">
                  <span>Bag Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <p className="text-[10px] text-[#86868b] text-right">
                  Dynamic shipping &amp; statutory GST added at checkout
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
