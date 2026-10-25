'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, ProductItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: ProductItem, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sg_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {}
    setIsLoaded(true);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sg_cart') {
        try {
          if (!e.newValue || e.newValue === '[]') {
            setItems([]);
          } else {
            setItems(JSON.parse(e.newValue));
          }
        } catch {}
      }
    };
    const handleCartCleared = () => {
      setItems([]);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('cart-cleared', handleCartCleared);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cart-cleared', handleCartCleared);
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('sg_cart', JSON.stringify(items));
      } catch {}
    }
  }, [items, isLoaded]);

  const addToCart = (product: ProductItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const nextQty = Math.min(product.stockQuantity, existing.quantity + quantity);
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: nextQty } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          slug: product.slug,
          sku: product.sku,
          price: product.price,
          quantity: Math.min(product.stockQuantity, quantity),
          imageUrl: product.images[0]?.url,
          stockAvailable: product.stockQuantity,
          weight: product.weightGrams ? `${product.weightGrams}g` : undefined,
          weightGrams: product.weightGrams,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(i.stockAvailable, quantity) }
          : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem('sg_cart');
      localStorage.setItem('sg_cart', '[]');
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('cart-cleared'));
    } catch {}
  };

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
