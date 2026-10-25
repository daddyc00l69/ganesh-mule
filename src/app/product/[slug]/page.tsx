'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StoreProvider } from '@/components/storefront/store-provider';
import { ProductCard } from '@/components/storefront/product-card';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/lib/cart/cart-context';
import {
  Star,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  Check,
  ArrowLeft,
  Sparkles,
  Award,
  ShoppingBag,
  Leaf,
  FileCheck2,
  Clock,
  RotateCcw,
  Share2,
  ThumbsUp,
  Download,
  CheckCircle2,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { addToCart, setIsCartOpen } = useCart();

  const product =
    MOCK_PRODUCTS.find((p) => p.slug === slug) || MOCK_PRODUCTS[0];

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'STORY' | 'SPECS' | 'PURITY' | 'QA'>('STORY');
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Variant volume selection and dynamic pricing
  // Variant volume selection matching the 3 flagship weights (300g, 750g, 1050g)
  const defaultVariant = product.weightGrams ? `${product.weightGrams}g` : '750g';
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);

  const variantOptions = [
    {
      label: '300g Solid Glass Jar',
      weight: '300g',
      weightGrams: 300,
      slug: 'wild-forest-raw-honey-300g',
      id: 'prod-wild-forest-300g',
      price: 44900,
      compareAtPrice: 59900,
    },
    {
      label: '750g Solid Glass Jar',
      weight: '750g',
      weightGrams: 750,
      slug: 'wild-forest-raw-honey-750g',
      id: 'prod-wild-forest-750g',
      price: 89900,
      compareAtPrice: 119900,
    },
    {
      label: '1050g Grand Reserve Jar',
      weight: '1050g',
      weightGrams: 1050,
      slug: 'wild-forest-raw-honey-1050g',
      id: 'prod-wild-forest-1050g',
      price: 119900,
      compareAtPrice: 159900,
    },
  ];

  const currentVariantObj =
    variantOptions.find((v) => v.weight === selectedVariant) ||
    variantOptions.find((v) => v.weight === defaultVariant) ||
    variantOptions[1];

  const activePrice = currentVariantObj.price;
  const activeCompareAtPrice = currentVariantObj.compareAtPrice;

  const discountPercent = activeCompareAtPrice
    ? Math.round(((activeCompareAtPrice - activePrice) / activeCompareAtPrice) * 100)
    : 0;

  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold;

  const rating = product.rating || 4.9;
  const ratingCount = product.ratingCount || 1420;

  const relatedProducts = MOCK_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);

  // Monitor scroll for sticky bottom bar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddToCart = () => {
    // Resolve dedicated product or build unique variant item so every weight shows as its own distinct item in cart
    const matched =
      MOCK_PRODUCTS.find((p) => p.slug === currentVariantObj.slug) ||
      MOCK_PRODUCTS.find((p) => p.id === currentVariantObj.id);

    const customizedItem: any = matched
      ? {
          ...matched,
          price: activePrice,
          compareAtPrice: activeCompareAtPrice,
        }
      : {
          ...product,
          id: currentVariantObj.id || `${product.id}-${currentVariantObj.weight}`,
          sku: `${product.sku}-${currentVariantObj.weight.toUpperCase()}`,
          name: `${product.name.replace(/\(\d+g\)/, '').trim()} (${currentVariantObj.label})`,
          price: activePrice,
          compareAtPrice: activeCompareAtPrice,
          weightGrams: currentVariantObj.weightGrams || product.weightGrams,
        };

    addToCart(customizedItem, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setIsCartOpen(true);
  };

  const handleUpvoteReview = (reviewId: string, currentCount: number) => {
    if (votedIds[reviewId]) return;
    setVotedIds((prev) => ({ ...prev, [reviewId]: true }));
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] ?? currentCount) + 1,
    }));
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <StoreProvider>
      <div className="bg-[#f5f5f7] min-h-screen pb-24 text-[#1d1d1f] selection:bg-[#0071e3]/20">
        
        {/* Apple Sub-Navbar Breadcrumb & Share */}
        <div className="border-b border-[#d2d2d7]/40 bg-white/70 backdrop-blur-md sticky top-11 sm:top-12 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-[#1d1d1f] hover:text-[#0071e3] font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to The Shop</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-[#86868b]">
                <Link href="/" className="hover:text-[#1d1d1f]">Store</Link>
                <span>/</span>
                <Link href="/shop" className="hover:text-[#1d1d1f]">Harvests</Link>
                <span>/</span>
                <span className="text-[#1d1d1f] font-medium truncate max-w-xs">{product.name}</span>
              </div>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7] text-xs font-medium cursor-pointer shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Studio Product Showcase (Apple Store 2-Col Split) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Gallery Column (6 Cols) */}
            <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-28">
              <div className="relative aspect-square rounded-[28px] overflow-hidden bg-white border border-[#d2d2d7]/50 flex items-center justify-center p-8 sm:p-12 shadow-sm group">
                {product.images[selectedImage] ? (
                  <img
                    src={product.images[selectedImage].url}
                    alt={product.images[selectedImage].altText || product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out drop-shadow-md"
                  />
                ) : (
                  <div className="text-[#86868b] font-mono">{product.sku}</div>
                )}

                {/* Apple Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {product.badge && (
                    <span className={`text-[11px] font-semibold tracking-wide px-3 py-1 rounded-full border shadow-2xs backdrop-blur-md flex items-center gap-1.5 ${
                      product.badgeColor === 'amber'
                        ? 'bg-amber-500/20 text-amber-950 border-amber-500/40'
                        : product.badgeColor === 'cyan'
                        ? 'bg-cyan-500/20 text-cyan-950 border-cyan-500/40'
                        : product.badgeColor === 'purple'
                        ? 'bg-purple-500/20 text-purple-950 border-purple-500/40'
                        : product.badgeColor === 'emerald'
                        ? 'bg-emerald-500/20 text-emerald-950 border-emerald-500/40'
                        : product.badgeColor === 'rose'
                        ? 'bg-rose-500/20 text-rose-950 border-rose-500/40'
                        : 'bg-blue-500/20 text-blue-950 border-blue-500/40'
                    }`}>
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>{product.badge}</span>
                    </span>
                  )}
                  <span className="bg-[#1d1d1f] text-white text-[11px] font-medium tracking-wider px-3 py-1 rounded-full shadow-2xs">
                    {product.batchNumber || 'FLAGSHIP HARVEST'}
                  </span>
                  <span className="bg-white/95 text-[#1d1d1f] text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-[#d2d2d7] flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0071e3]" />
                    NMR Certified Pure
                  </span>
                </div>

                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] text-[#6e6e73] border border-[#d2d2d7]/60 shadow-2xs">
                  {selectedImage + 1} of {product.images.length}
                </div>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-20 h-20 rounded-[18px] overflow-hidden border-2 bg-white p-2 cursor-pointer transition-all shrink-0 ${
                        selectedImage === idx
                          ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 shadow-xs'
                          : 'border-[#d2d2d7]/60 hover:border-[#86868b] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Purchase & Configurator Column (6 Cols) */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#0071e3] flex-wrap">
                  {product.badge && (
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-normal ${
                      product.badgeColor === 'amber'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : product.badgeColor === 'cyan'
                        ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                        : product.badgeColor === 'purple'
                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                        : product.badgeColor === 'emerald'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : product.badgeColor === 'rose'
                        ? 'bg-rose-100 text-rose-900 border-rose-300'
                        : 'bg-blue-100 text-blue-900 border-blue-300'
                    }`}>
                      {product.badge}
                    </span>
                  )}
                  <span>{product.category?.name || 'Raw Wild Honey'}</span>
                  <span>•</span>
                  <span>{product.origin || 'Western Ghats'}</span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] mt-1.5 leading-tight tracking-tight">
                  {product.name}
                </h1>

                {/* Rating & Tested Tag */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-[#d2d2d7] text-xs font-semibold text-[#1d1d1f] shadow-2xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{rating}</span>
                    <span className="text-[#86868b] font-normal">({ratingCount} reviews)</span>
                  </div>
                  <span className="text-xs text-[#d2d2d7]">•</span>
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Batch {product.batchNumber || '2026'} NMR Passed
                  </span>
                </div>
              </div>

              {/* Price Presentation */}
              <div className="pt-2 border-t border-[#d2d2d7]/40 space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
                    {formatCurrency(activePrice)}
                  </span>
                  {activeCompareAtPrice && (
                    <span className="text-base text-[#86868b] line-through">
                      {formatCurrency(activeCompareAtPrice)}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6e6e73]">
                  Inclusive of all taxes. Free express delivery across India on orders over ₹999.
                </p>
              </div>

              {/* Sensory 4-Tile Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 rounded-[20px] bg-white border border-[#d2d2d7]/50 text-xs shadow-2xs">
                <div>
                  <span className="text-[#86868b] block text-[10px] uppercase font-semibold">Flora</span>
                  <span className="font-semibold text-[#1d1d1f] line-clamp-1">{product.flavour?.split(' ')[0] || 'Wild'} Bloom</span>
                </div>
                <div>
                  <span className="text-[#86868b] block text-[10px] uppercase font-semibold">Heat</span>
                  <span className="font-semibold text-[#1d1d1f]">0.0% Cold</span>
                </div>
                <div>
                  <span className="text-[#86868b] block text-[10px] uppercase font-semibold">Enzymes</span>
                  <span className="font-semibold text-emerald-700">100% Active</span>
                </div>
                <div>
                  <span className="text-[#86868b] block text-[10px] uppercase font-semibold">Glass</span>
                  <span className="font-semibold text-[#1d1d1f]">Solid Flint</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                {product.description}
              </p>

              {/* Apple Storage/Volume Selector */}
              <div className="space-y-2.5 pt-1">
                <label className="text-xs font-semibold text-[#1d1d1f] block">
                  Select Volume: <span className="text-[#0071e3] font-medium">{currentVariantObj.label}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {variantOptions.map((opt) => {
                    const isSelected = selectedVariant === opt.weight;
                    const optPrice = opt.price;
                    return (
                      <button
                        key={opt.weight}
                        type="button"
                        onClick={() => setSelectedVariant(opt.weight)}
                        className={`p-3.5 text-left rounded-[16px] border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 bg-white shadow-xs'
                            : 'border-[#d2d2d7] bg-[#f5f5f7]/60 text-[#1d1d1f] hover:border-[#86868b]'
                        }`}
                      >
                        <div className="text-xs font-semibold text-[#1d1d1f]">{opt.label}</div>
                        <div className={`text-xs mt-0.5 font-medium ${isSelected ? 'text-[#0071e3]' : 'text-[#6e6e73]'}`}>
                          {formatCurrency(optPrice)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Stepper & Apple Action Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between border border-[#d2d2d7] rounded-full bg-white px-3 py-2 w-32 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-1 text-[#1d1d1f] hover:text-[#0071e3] transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-semibold text-xs text-[#1d1d1f]">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                      className="p-1 text-[#1d1d1f] hover:text-[#0071e3] transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Bag */}
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className={`flex-1 py-3 px-6 rounded-full font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98 ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : isOutOfStock
                        ? 'bg-[#e5e5e7] text-[#86868b] cursor-not-allowed'
                        : 'border border-[#1d1d1f] text-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white bg-white'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Added to Bag</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Bag</span>
                      </>
                    )}
                  </button>

                  {/* Instant Buy (Apple Blue) */}
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className="py-3 px-6 rounded-full font-medium text-xs sm:text-sm bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white transition-all cursor-pointer shadow-sm active:scale-98"
                  >
                    Instant Buy
                  </button>
                </div>

                {/* Stock & Express Freight Notification */}
                <div className="p-3.5 rounded-[16px] bg-white border border-[#d2d2d7]/50 flex items-center justify-between text-xs text-[#6e6e73] shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-medium text-[#1d1d1f]">In Stock ({product.stockQuantity} jars ready)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#0071e3] font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Dispatches in 24 hours</span>
                  </div>
                </div>
              </div>

              {/* Apple Service Strip */}
              <div className="pt-4 border-t border-[#d2d2d7]/40 grid grid-cols-2 gap-3 text-xs text-[#6e6e73]">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#0071e3] shrink-0" />
                  <span>Free insured air freight over ₹999</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0071e3] shrink-0" />
                  <span>100% Zero-breakage glass guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#0071e3] shrink-0" />
                  <span>NMR Spectroscopy tested pure</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#0071e3] shrink-0" />
                  <span>7-Day seamless replacement</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Extended Interactive Information Section */}
        <section className="bg-white border-t border-[#d2d2d7]/50 py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            {/* Apple Segmented Nav Tabs */}
            <div className="flex items-center justify-center gap-2 border-b border-[#d2d2d7]/40 pb-4 flex-wrap">
              {[
                { id: 'STORY', label: 'The Harvest & Origin' },
                { id: 'SPECS', label: 'Technical Specifications' },
                { id: 'PURITY', label: `NMR Lab Report (${product.batchNumber || 'Batch 2026'})` },
                { id: 'QA', label: `Customer Q&A (${product.qAndA?.length || 3})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-4 py-2 text-xs font-medium rounded-full transition-all cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-[#1d1d1f] text-white shadow-2xs'
                      : 'bg-[#f5f5f7] border border-[#d2d2d7] text-[#6e6e73] hover:text-[#1d1d1f]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Story */}
            {activeTab === 'STORY' && (
              <div className="bg-[#f5f5f7] rounded-[24px] border border-[#d2d2d7]/50 p-8 space-y-6 shadow-2xs animate-in fade-in">
                <h3 className="text-xl font-semibold text-[#1d1d1f]">
                  Ethically Harvested by Indigenous Forest Beekeepers
                </h3>
                <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                  Unlike commercial beekeeping operations where hives are fed sugar syrup and treated with synthetic antibiotics, our raw honey is collected directly from wild bee colonies in remote bio-reserves. We partner directly with tribal beekeeper collectives using non-destructive traditional smoke methods that keep colonies safe.
                </p>

                {product.aboutItems && (
                  <div className="space-y-3 pt-2">
                    {product.aboutItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1d1d1f]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#d2d2d7]/40">
                  <div className="p-5 rounded-[18px] bg-white border border-[#d2d2d7]/40 space-y-1">
                    <span className="text-xs font-semibold text-[#1d1d1f]">Never Boiled / Heated</span>
                    <p className="text-xs text-[#6e6e73]">Extracted cold below 38°C to keep enzymes and beneficial bacteria alive.</p>
                  </div>
                  <div className="p-5 rounded-[18px] bg-white border border-[#d2d2d7]/40 space-y-1">
                    <span className="text-xs font-semibold text-[#1d1d1f]">Unfiltered Pollen</span>
                    <p className="text-xs text-[#6e6e73]">Coarsely strained so microscopic wildflower bee pollen remains intact.</p>
                  </div>
                  <div className="p-5 rounded-[18px] bg-white border border-[#d2d2d7]/40 space-y-1">
                    <span className="text-xs font-semibold text-[#1d1d1f]">Solid Glass Jars</span>
                    <p className="text-xs text-[#6e6e73]">Inert glass eliminates microplastic contamination forever.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Specs */}
            {activeTab === 'SPECS' && (
              <div className="bg-[#f5f5f7] rounded-[24px] border border-[#d2d2d7]/50 p-8 shadow-2xs animate-in fade-in space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-[#1d1d1f]">Technical Specifications</h3>
                  <span className="text-xs font-mono text-[#86868b]">SKU: {product.sku}</span>
                </div>
                
                <div className="rounded-[18px] border border-[#d2d2d7]/50 overflow-hidden text-xs bg-white">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-[#d2d2d7]/30">
                      {Object.entries(
                        product.technicalDetails || {
                          'Brand': 'Ganesh Mule Pure Honey',
                          'Flavour': product.flavour || 'Wild Forest Multifloral',
                          'Origin': product.origin || 'Western Ghats',
                          'Packaging': 'Heavy Solid Glass Jar',
                          'Shelf Life': '24 Months',
                        }
                      ).map(([key, val], idx) => (
                        <tr key={key} className={idx % 2 === 0 ? 'bg-[#f5f5f7]/40' : 'bg-white'}>
                          <td className="py-3 px-4 font-semibold text-[#6e6e73] w-1/3">{key}</td>
                          <td className="py-3 px-4 text-[#1d1d1f] font-medium">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-[16px] bg-white border border-[#d2d2d7]/40 text-xs text-[#6e6e73] leading-relaxed">
                  <span className="font-semibold text-[#1d1d1f] block mb-1">Dietary Information:</span>
                  100% natural and vegetarian. Naturally free from gluten, dairy, artificial preservatives, additives, and refined sugars. Not recommended for infants under 12 months.
                </div>
              </div>
            )}

            {/* Tab 3: Purity & NMR */}
            {activeTab === 'PURITY' && (
              <div className="bg-[#f5f5f7] rounded-[24px] border border-[#d2d2d7]/50 p-8 shadow-2xs animate-in fade-in space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-semibold text-[#1d1d1f]">NMR Spectroscopy Batch Analysis</h3>
                    <span className="text-xs text-[#6e6e73] font-mono">Apiary Identifier: {product.batchNumber || 'BATCH-2026-WF04'}</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit">
                    PASSED • 100% PURE RAW HONEY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-[18px] bg-white border border-[#d2d2d7]/40 space-y-1.5 text-center">
                    <span className="text-xs text-[#86868b] font-medium">Diastase Activity</span>
                    <p className="text-2xl font-semibold text-[#1d1d1f]">14.2 Schade</p>
                    <p className="text-[11px] text-[#6e6e73]">Standard &gt; 8. Confirms zero heat exposure.</p>
                  </div>
                  <div className="p-5 rounded-[18px] bg-white border border-[#d2d2d7]/40 space-y-1.5 text-center">
                    <span className="text-xs text-[#86868b] font-medium">C3 / C4 Added Sugars</span>
                    <p className="text-2xl font-semibold text-emerald-700">0.0% (Zero)</p>
                    <p className="text-[11px] text-[#6e6e73]">Zero corn syrup, rice syrup, or cane sugar.</p>
                  </div>
                  <div className="p-5 rounded-[18px] bg-white border border-[#d2d2d7]/40 space-y-1.5 text-center">
                    <span className="text-xs text-[#86868b] font-medium">Moisture Density</span>
                    <p className="text-2xl font-semibold text-[#1d1d1f]">17.6%</p>
                    <p className="text-[11px] text-[#6e6e73]">Naturally capped honeycomb ripeness.</p>
                  </div>
                </div>

                <div className="p-5 rounded-[18px] border border-[#d2d2d7]/40 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-[#6e6e73]">
                    <span className="font-semibold text-[#1d1d1f] block">Certificate of Authenticity Available</span>
                    Testing conducted in accordance with German NMR and Codex Alimentarius honey purity standards.
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Certificate for ${product.batchNumber || 'Batch 2026'} downloaded successfully (Simulated PDF).`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#e8e8ed] text-xs font-medium cursor-pointer shadow-2xs shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0071e3]" />
                    <span>Download Report</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Q&A */}
            {activeTab === 'QA' && (
              <div className="bg-[#f5f5f7] rounded-[24px] border border-[#d2d2d7]/50 p-8 shadow-2xs animate-in fade-in space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-[#1d1d1f]">Questions &amp; Answers</h3>
                  <span className="text-xs text-[#86868b]">{product.qAndA?.length || 3} questions answered</span>
                </div>

                <div className="space-y-4">
                  {(product.qAndA || [
                    {
                      question: 'Does this raw honey crystallize in cold weather?',
                      answer: 'Yes! Natural crystallization is physical proof that the honey is 100% raw and has not been subjected to high-temperature commercial pasteurization.',
                      votes: 24,
                    },
                    {
                      question: 'How should I store this honey once opened?',
                      answer: 'Store at room temperature with the solid glass jar lid closed tightly. Never refrigerate honey, as cold speeds up crystallization.',
                      votes: 18,
                    },
                  ]).map((item, idx) => (
                    <div key={idx} className="p-5 rounded-[18px] bg-white border border-[#d2d2d7]/40 space-y-2">
                      <div className="text-xs font-semibold text-[#1d1d1f] flex items-start gap-2">
                        <span className="text-[#0071e3] font-bold">Q:</span>
                        <span>{item.question}</span>
                      </div>
                      <div className="text-xs text-[#6e6e73] leading-relaxed pl-4 border-l-2 border-[#0071e3]/40">
                        {item.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section className="py-16 bg-[#f5f5f7] border-t border-[#d2d2d7]/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0071e3]">
                  Verified Experiences
                </span>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] mt-1">
                  Customer Ratings &amp; Reviews
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#6e6e73] font-medium">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-[#1d1d1f] text-sm">{rating}</span>
                <span>out of 5 ({ratingCount} verified customers)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(product.customerReviews || [
                {
                  id: 'rev-1',
                  author: 'Dr. Rajesh Deshmukh',
                  rating: 5,
                  title: 'Remarkable authenticity and depth',
                  date: '14 October 2026',
                  verifiedPurchase: true,
                  content: 'A world of difference compared to commercial supermarket honey. The floral complexity and natural velvet micro-crystals prove this is genuine raw honey.',
                  helpfulCount: 42,
                },
                {
                  id: 'rev-2',
                  author: 'Ananya Sharma',
                  rating: 5,
                  title: 'Batch NMR report verified',
                  date: '28 September 2026',
                  verifiedPurchase: true,
                  content: 'Arrived in sturdy protective packaging. Beautiful glass jar and wonderful caramel notes. I take one spoon daily for morning wellness.',
                  helpfulCount: 19,
                },
                {
                  id: 'rev-3',
                  author: 'Vikram Sengupta',
                  rating: 5,
                  title: 'Flawless glass freight delivery',
                  date: '02 September 2026',
                  verifiedPurchase: true,
                  content: 'Was skeptical about glass freight, but it was cushioned impeccably. The taste is pure, unadulterated forest nectar.',
                  helpfulCount: 8,
                },
              ]).map((rev) => {
                const currentHelpful = helpfulVotes[rev.id] ?? rev.helpfulCount;
                const hasVoted = votedIds[rev.id];

                return (
                  <div key={rev.id} className="p-6 rounded-[20px] bg-white border border-[#d2d2d7]/50 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Verified Purchase
                      </span>
                    </div>
                    <h4 className="font-semibold text-[#1d1d1f] text-sm">{rev.title}</h4>
                    <p className="text-xs text-[#6e6e73] leading-relaxed italic">
                      "{rev.content}"
                    </p>
                    <div className="pt-2 border-t border-[#d2d2d7]/30 flex items-center justify-between text-[11px] text-[#86868b]">
                      <div>
                        <span className="font-medium text-[#1d1d1f] block">{rev.author}</span>
                        <span>{rev.date}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpvoteReview(rev.id, rev.helpfulCount)}
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          hasVoted
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-medium'
                            : 'border-[#d2d2d7] bg-white text-[#6e6e73] hover:text-[#1d1d1f]'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{currentHelpful}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Floating Sticky Quick-Add Bar (Apple Store Style) */}
        {showStickyBar && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-md border-t border-[#d2d2d7]/50 shadow-xl z-40 py-3 px-4 transition-all animate-in slide-in-from-bottom">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]/60 overflow-hidden shrink-0 hidden sm:flex items-center justify-center">
                  <img
                    src={product.images[0]?.url}
                    alt=""
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#1d1d1f] truncate max-w-xs sm:max-w-sm">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#6e6e73]">
                    <span>{currentVariantObj.label}</span>
                    <span>•</span>
                    <span className="font-semibold text-[#1d1d1f]">{formatCurrency(activePrice)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`py-2 px-5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'border border-[#1d1d1f] text-[#1d1d1f] bg-white hover:bg-[#1d1d1f] hover:text-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="py-2 px-5 rounded-full text-xs font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Instant Buy
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </StoreProvider>
  );
}
