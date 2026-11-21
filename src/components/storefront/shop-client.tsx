'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/lib/cart/cart-context';
import {
  Search,
  X,
  Star,
  ShieldCheck,
  Droplets,
  Package,
  Check,
  ShoppingBag,
} from 'lucide-react';

export interface HoneyShopItem {
  id: string;
  slug: string;
  name: string;
  cleanTitle: string;
  floralOrigin: string;
  description: string;
  imageUrl: string;
  rating: number;
  ratingCount: number;
  startingPrice: number;
  compareAtPrice: number;
  discountPercent: number;
  availableSizes: string[];
  flavourNotes: string;
  categoryTag: 'HONEY' | 'COMB' | 'GIFT';
  isOutOfStock?: boolean;
}

export interface VariantOption {
  weight: string;
  price: number;
  compareAtPrice: number;
  discountPercent: number;
  imageUrl?: string;
}

export function getProductVariants(p: HoneyShopItem): VariantOption[] {
  if (p.slug === '6-flavour-honey-gift-box') {
    return [
      {
        weight: '6 × 250g (1.5kg)',
        price: 119900,
        compareAtPrice: 165000,
        discountPercent: 27,
        imageUrl: '/images/products/6-flavour-honey-gift-box.jpg',
      },
    ];
  }
  if (p.slug === '4-flavour-honey-gift-box') {
    return [
      {
        weight: '4 × 250g (1kg)',
        price: 79900,
        compareAtPrice: 110000,
        discountPercent: 27,
        imageUrl: '/images/products/4-flavour-honey-gift-box.jpg',
      },
    ];
  }
  if (p.slug === 'raw-honey-comb') {
    return [
      {
        weight: '500g',
        price: 49900,
        compareAtPrice: 65000,
        discountPercent: 23,
        imageUrl: '/images/products/raw-honey-comb.jpg',
      },
      {
        weight: '1kg',
        price: 89900,
        compareAtPrice: 119900,
        discountPercent: 25,
        imageUrl: '/images/products/raw-honey-comb.jpg',
      },
    ];
  }
  if (p.slug === 'honey-with-comb') {
    return [
      {
        weight: '500g',
        price: 44900,
        compareAtPrice: 59900,
        discountPercent: 25,
        imageUrl: '/images/products/honey-with-comb.jpg',
      },
      {
        weight: '1kg',
        price: 84900,
        compareAtPrice: 109900,
        discountPercent: 23,
        imageUrl: '/images/products/honey-with-comb.jpg',
      },
    ];
  }

  // Standard Monofloral Honeys
  const brandFolderMap: Record<string, string> = {
    'multiflora-honey': 'Multiflora Honey',
    'forest-honey': 'Forest Honey',
    'sesame-honey': 'Sesame Honey',
    'ajwain-honey': 'Ajwain Honey',
    'saunf-honey': 'Saunf Honey',
    'ber-honey': 'Ber Honey',
  };
  const folder = brandFolderMap[p.slug] || 'Forest Honey';

  return [
    {
      weight: '250g',
      price: 19900,
      compareAtPrice: 27500,
      discountPercent: 28,
      imageUrl: `/images/honey-brand/${folder}/250g/image_1_amazon_main.jpg`,
    },
    {
      weight: '500g',
      price: 39900,
      compareAtPrice: 54900,
      discountPercent: 27,
      imageUrl: `/images/honey-brand/${folder}/500g/image_1_amazon_main.jpg`,
    },
    {
      weight: '1kg',
      price: 74900,
      compareAtPrice: 99900,
      discountPercent: 25,
      imageUrl: `/images/honey-brand/${folder}/1kg/image_1_amazon_main.jpg`,
    },
  ];
}

// Interactive Dynamic Mobile Card (auto-scales with mobile font size like Amazon)
function MobileShopCard({ product }: { product: HoneyShopItem }) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const variants = useMemo(() => getProductVariants(product), [product]);
  // Default to 500g if available (most popular), else first variant
  const defaultVariant = variants.find((v) => v.weight === '500g') || variants[0];
  const [selectedVariant, setSelectedVariant] = useState<VariantOption>(defaultVariant);

  const displayImage = selectedVariant.imageUrl || product.imageUrl;
  const isMultiSize = variants.length > 1;

  // Destination URL with selected size query parameter
  const productUrl = `/product/${product.slug}?size=${encodeURIComponent(selectedVariant.weight)}`;

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.isOutOfStock) return;

    const weightGrams =
      selectedVariant.weight === '250g'
        ? 250
        : selectedVariant.weight === '500g'
        ? 500
        : selectedVariant.weight === '1kg'
        ? 1000
        : selectedVariant.weight.includes('1.5kg')
        ? 1500
        : 1000;

    const cartProduct = {
      id: `${product.id}-${selectedVariant.weight}`,
      name: `${product.cleanTitle} (${selectedVariant.weight})`,
      slug: product.slug,
      sku: `GM-${product.slug.substring(0, 3).toUpperCase()}-${selectedVariant.weight.toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
      price: selectedVariant.price,
      compareAtPrice: selectedVariant.compareAtPrice,
      stockQuantity: 50,
      images: [{ url: selectedVariant.imageUrl || product.imageUrl, alt: product.name }],
      weightGrams,
    };

    addToCart(cartProduct as any, 1, true);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <article className="p-3 sm:p-3.5 rounded-2xl bg-white border border-[#d2d2d7]/70 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex gap-3 sm:gap-3.5 items-stretch overflow-hidden transition-all">
      {/* Left: Product Image Container (Dynamic jar photo updating on size switch) */}
      <Link
        href={productUrl}
        className="w-24 sm:w-28 shrink-0 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]/50 relative overflow-hidden flex items-center justify-center p-1.5 group self-start aspect-square"
      >
        <Image
          src={displayImage}
          alt={`${product.name} ${selectedVariant.weight}`}
          fill
          sizes="112px"
          className="object-contain p-1 group-hover:scale-105 transition-all duration-300"
        />
        {product.isOutOfStock && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-2 py-0.5 rounded-full bg-stone-900/85 text-white text-[9px] font-bold tracking-wider uppercase shadow-xs">
              Sold Out
            </span>
          </div>
        )}
      </Link>

      {/* Right Column: Dynamic Content that scales naturally with mobile font size */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
        <div className="space-y-1">
          {/* Origin / Type */}
          <p className="text-[11px] font-medium text-[#86868b] truncate leading-tight">
            {product.floralOrigin}
          </p>

          {/* Title */}
          <Link href={productUrl} className="block">
            <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] leading-snug line-clamp-2 hover:text-[#0071e3] transition-colors">
              {product.cleanTitle}
            </h2>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-0.5 font-semibold text-[#1d1d1f]">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{product.rating}</span>
              <span className="text-[#86868b] font-normal text-[10px]">({product.ratingCount})</span>
            </span>
            <span className="text-[#d2d2d7]">·</span>
            <span className="text-[11px] text-[#86868b] truncate font-medium">
              {product.categoryTag === 'GIFT'
                ? 'Gift Hamper'
                : product.categoryTag === 'COMB'
                ? 'Raw Comb'
                : 'Solid Glass'}
            </span>
          </div>

          {/* Dynamic Interactive Size Selector Chips */}
          {isMultiSize && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-[#86868b] font-medium">Size:</span>
              {variants.map((v) => {
                const isSelected = selectedVariant.weight === v.weight;
                return (
                  <button
                    key={v.weight}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedVariant(v);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1d1d1f] text-white shadow-2xs'
                        : 'bg-[#f5f5f7] text-[#515154] hover:bg-[#e8e8ed] border border-[#d2d2d7]/60'
                    }`}
                  >
                    {v.weight}
                  </button>
                );
              })}
            </div>
          )}

          {/* Flavour / Aroma Snippet */}
          <p className="text-[11px] text-[#6e6e73] line-clamp-1 leading-tight">
            {product.flavourNotes}
          </p>
        </div>

        {/* Bottom Row: Dynamic Pricing & Compact Buy Button */}
        <div className="pt-1.5 flex items-end justify-between gap-2 border-t border-[#f5f5f7]">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-[#1d1d1f] tracking-tight">
                {formatCurrency(selectedVariant.price)}
              </span>
              {selectedVariant.compareAtPrice > selectedVariant.price && (
                <span className="text-[11px] text-[#86868b] line-through">
                  {formatCurrency(selectedVariant.compareAtPrice)}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] font-semibold truncate ${
                product.isOutOfStock ? 'text-amber-800' : 'text-[#1b5e20]'
              }`}
            >
              {product.isOutOfStock
                ? 'Out of Stock'
                : `Save ${selectedVariant.discountPercent}% · Solid Glass`}
            </span>
          </div>

          {product.isOutOfStock ? (
            <span className="px-3.5 py-1.5 rounded-full bg-stone-100 text-stone-500 text-[11px] font-semibold border border-stone-200 shrink-0 select-none">
              Sold Out
            </span>
          ) : (
            <button
              type="button"
              onClick={handleBuy}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white'
              }`}
              title={`Buy ${product.cleanTitle} (${selectedVariant.weight})`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Added</span>
                </>
              ) : (
                <span>Buy</span>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// Exactly the 10 products requested in the requested order
export const SHOP_PRODUCTS: HoneyShopItem[] = [
  {
    id: 'prod-multiflora',
    slug: 'multiflora-honey',
    name: 'Wild Multiflora Raw Honey',
    cleanTitle: 'Multiflora Honey',
    floralOrigin: 'Biodiverse Alpine Foothills',
    description:
      'Harmonious multifloral nectar gathered by bees foraging across dozens of seasonal medicinal herbs and seasonal forest blossoms. Smooth, well-rounded flavour ideal for daily nutrition.',
    imageUrl: '/images/honey-brand/Multiflora Honey/500g/image_1_amazon_main.jpg',
    rating: 4.8,
    ratingCount: 389,
    startingPrice: 19900,
    compareAtPrice: 27500,
    discountPercent: 28,
    availableSizes: ['250g', '500g', '1kg'],
    flavourNotes: 'Rich botanical bouquet with golden nectar finish',
    categoryTag: 'HONEY',
    isOutOfStock: false,
  },
  {
    id: 'prod-raw-honey-comb',
    slug: 'raw-honey-comb',
    name: 'Raw Honey Comb',
    cleanTitle: 'Raw Honey Comb',
    floralOrigin: 'Direct Apiary Fresh Comb Extraction',
    description:
      '100% pure raw unprocessed honeycomb harvested whole with wax cells full of living botanical nectar & raw bee pollen. Chew directly or enjoy over warm artisanal bread.',
    imageUrl: '/images/products/raw-honey-comb.jpg',
    rating: 5.0,
    ratingCount: 184,
    startingPrice: 49900,
    compareAtPrice: 65000,
    discountPercent: 23,
    availableSizes: ['500g', '1kg'],
    flavourNotes: 'Intact beeswax cells packed with pure living nectar & raw bee pollen',
    categoryTag: 'COMB',
    isOutOfStock: false,
  },
  {
    id: 'prod-honey-with-comb',
    slug: 'honey-with-comb',
    name: 'Honey with Comb',
    cleanTitle: 'Honey with Comb',
    floralOrigin: 'Western Ghats Apiary Reserve',
    description:
      'Cold-extracted single-origin raw honey bottled with an intact fresh natural raw honeycomb slab submerged inside heavy solid glass. Liquid nectar and chewable comb in every jar.',
    imageUrl: '/images/products/honey-with-comb.jpg',
    rating: 4.9,
    ratingCount: 210,
    startingPrice: 44900,
    compareAtPrice: 59900,
    discountPercent: 25,
    availableSizes: ['500g', '1kg'],
    flavourNotes: 'Velvety wildflower liquid honey with a chewy raw comb core',
    categoryTag: 'COMB',
    isOutOfStock: false,
  },
  {
    id: 'prod-6-flavour-gift-box',
    slug: '6-flavour-honey-gift-box',
    name: '6 Flavour Honey Gift Box',
    cleanTitle: '6 Flavour Honey Gift Box',
    floralOrigin: 'Curated Heritage Monofloral Collection',
    description:
      'Luxury rigid presentation hamper containing six 250g solid glass jars: Wild Forest, Sesame, Ajwain, Multiflora, Saunf & Sheesham honey. The ultimate connoisseur health gift.',
    imageUrl: '/images/products/6-flavour-honey-gift-box.jpg',
    rating: 5.0,
    ratingCount: 342,
    startingPrice: 119900,
    compareAtPrice: 165000,
    discountPercent: 27,
    availableSizes: ['6 × 250g (1.5kg)'],
    flavourNotes: '6 Distinct Single-Origin Monofloral Profiles (250g each)',
    categoryTag: 'GIFT',
    isOutOfStock: false,
  },
  {
    id: 'prod-4-flavour-gift-box',
    slug: '4-flavour-honey-gift-box',
    name: '4 Flavour Honey Gift Box',
    cleanTitle: '4 Flavour Honey Gift Box',
    floralOrigin: 'Signature Artisanal Honey Assortment',
    description:
      'Elegant gift box featuring four 250g solid glass jars: Wild Forest, Sesame Blossom, Ajwain Carom & Wild Multiflora honey. Handcrafted with eco-luxury protective inserts.',
    imageUrl: '/images/products/4-flavour-honey-gift-box.jpg',
    rating: 4.9,
    ratingCount: 276,
    startingPrice: 79900,
    compareAtPrice: 110000,
    discountPercent: 27,
    availableSizes: ['4 × 250g (1kg)'],
    flavourNotes: '4 Premium Single-Origin Monofloral Profiles (250g each)',
    categoryTag: 'GIFT',
    isOutOfStock: false,
  },
  {
    id: 'prod-forest',
    slug: 'forest-honey',
    name: 'Wild Forest Raw Honey',
    cleanTitle: 'Forest Honey',
    floralOrigin: 'Western Ghats Deciduous Canopies',
    description:
      'Pure cold-extracted raw honey gathered from wild Apis dorsata cliff bees in deep deciduous forests. Rich caramel depth with living bio-enzymes and micro-pollen.',
    imageUrl: '/images/honey-brand/Forest Honey/500g/image_1_amazon_main.jpg',
    rating: 4.9,
    ratingCount: 783,
    startingPrice: 19900,
    compareAtPrice: 27500,
    discountPercent: 28,
    availableSizes: ['250g', '500g', '1kg'],
    flavourNotes: 'Multifloral blossom with warm floral caramel finish',
    categoryTag: 'HONEY',
    isOutOfStock: false,
  },
  {
    id: 'prod-sesame',
    slug: 'sesame-honey',
    name: 'Pure Sesame Blossom Honey',
    cleanTitle: 'Sesame Honey',
    floralOrigin: 'Organic Sesame Plains, Maharashtra',
    description:
      'Single-origin unheated honey harvested during peak sesame flowering. Naturally high in bio-available zinc, calcium minerals, and antioxidant flavonoids.',
    imageUrl: '/images/honey-brand/Sesame Honey/500g/image_1_amazon_main.jpg',
    rating: 4.9,
    ratingCount: 312,
    startingPrice: 19900,
    compareAtPrice: 27500,
    discountPercent: 28,
    availableSizes: ['250g', '500g', '1kg'],
    flavourNotes: 'Warm nutty undertones with delicate amber sweetness',
    categoryTag: 'HONEY',
    isOutOfStock: false,
  },
  {
    id: 'prod-ajwain',
    slug: 'ajwain-honey',
    name: 'Organic Ajwain (Carom) Honey',
    cleanTitle: 'Ajwain Honey',
    floralOrigin: 'Carom Flowering Fields, Rajasthan',
    description:
      'Distinctive raw monofloral honey harvested from white carom flowers. Celebrated in Ayurveda for respiratory comfort, gut health, and soothing digestion.',
    imageUrl: '/images/honey-brand/Ajwain Honey/500g/image_1_amazon_main.jpg',
    rating: 4.9,
    ratingCount: 420,
    startingPrice: 19900,
    compareAtPrice: 27500,
    discountPercent: 28,
    availableSizes: ['250g', '500g', '1kg'],
    flavourNotes: 'Herbal, pungent & warm digestive carom notes',
    categoryTag: 'HONEY',
    isOutOfStock: false,
  },
  {
    id: 'prod-saunf',
    slug: 'saunf-honey',
    name: 'Pure Saunf (Fennel) Honey',
    cleanTitle: 'Saunf (Fennel) Honey',
    floralOrigin: 'Aromatic Fennel Meadows, Rajasthan',
    description:
      'Single-origin raw honey gathered during peak winter fennel flowering. Naturally sweet licorice-anise finish with cooling digestion properties and soothing floral aroma.',
    imageUrl: '/images/honey-brand/Saunf Honey/500g/image_1_amazon_main.jpg',
    rating: 4.9,
    ratingCount: 340,
    startingPrice: 19900,
    compareAtPrice: 27500,
    discountPercent: 28,
    availableSizes: ['250g', '500g', '1kg'],
    flavourNotes: 'Sweet herbal licorice-anise finish with digestive cooling aroma',
    categoryTag: 'HONEY',
    isOutOfStock: false,
  },
  {
    id: 'prod-ber',
    slug: 'ber-honey',
    name: 'Raw Ber (Sidr / Jujube) Honey',
    cleanTitle: 'Ber Honey',
    floralOrigin: 'Arid Jujube Woodlands, Rajasthan',
    description:
      'Revered ancient Sidr honey harvested from thorny desert jujube trees. Uniquely dense in bio-active polyphenols and amber antioxidants. (Currently Out of Stock)',
    imageUrl: '/images/honey-brand/Ber Honey/500g/image_1_amazon_main.jpg',
    rating: 4.9,
    ratingCount: 295,
    startingPrice: 19900,
    compareAtPrice: 27500,
    discountPercent: 28,
    availableSizes: ['250g', '500g', '1kg'],
    flavourNotes: 'Thick butterscotch aroma with deep lingering sweetness',
    categoryTag: 'HONEY',
    isOutOfStock: true, // Ber Honey - Out of Stock price will same
  },
];

export function ShopClient() {
  const [products] = useState<HoneyShopItem[]>(SHOP_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'HONEY' | 'COMB' | 'GIFT'>('ALL');

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeFilter !== 'ALL') {
      list = list.filter((p) => p.categoryTag === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.cleanTitle.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.floralOrigin.toLowerCase().includes(q) ||
          p.flavourNotes.toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, searchQuery, activeFilter]);

  return (
    <div className="bg-[#f5f5f7] min-h-screen text-[#1d1d1f]">
      
      {/* ────────────────────────────────────────────────────────────
          1. CLEAN APPLE MOBILE SEARCH & FILTER BAR (< 768px)
         ──────────────────────────────────────────────────────────── */}
      <section className="md:hidden bg-white/95 backdrop-blur-md px-4 pt-3.5 pb-2.5 border-b border-[#d2d2d7]/70 sticky top-0 z-20 shadow-2xs">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search honey, combs, gift boxes..."
            className="w-full h-10 pl-9 pr-9 text-sm rounded-full bg-[#f5f5f7] border border-[#d2d2d7]/80 text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:bg-white focus:border-[#0071e3] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-[#1d1d1f] text-white shadow-xs'
                : 'bg-white text-[#1d1d1f] border border-[#d2d2d7] hover:bg-[#f5f5f7]'
            }`}
          >
            All Products (10)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('HONEY')}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'HONEY'
                ? 'bg-[#1d1d1f] text-white shadow-xs'
                : 'bg-white text-[#1d1d1f] border border-[#d2d2d7] hover:bg-[#f5f5f7]'
            }`}
          >
            Pure Honey
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('COMB')}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'COMB'
                ? 'bg-[#1d1d1f] text-white shadow-xs'
                : 'bg-white text-[#1d1d1f] border border-[#d2d2d7] hover:bg-[#f5f5f7]'
            }`}
          >
            Raw Honeycomb
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('GIFT')}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'GIFT'
                ? 'bg-[#1d1d1f] text-white shadow-xs'
                : 'bg-white text-[#1d1d1f] border border-[#d2d2d7] hover:bg-[#f5f5f7]'
            }`}
          >
            Gift Boxes
          </button>
        </div>
      </section>

      {/* Results Header on Mobile */}
      <div className="md:hidden px-4 py-2 flex items-center justify-between text-xs text-[#86868b]">
        <span>
          Showing <strong className="text-[#1d1d1f]">{filteredProducts.length}</strong> products
        </span>
        <span className="flex items-center gap-1 text-[#1b5e20] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>100% NMR Pure</span>
        </span>
      </div>

      {/* ────────────────────────────────────────────────────────────
          2. DESKTOP EDITORIAL HEADER (>= 768px)
         ──────────────────────────────────────────────────────────── */}
      <section className="hidden md:block max-w-6xl mx-auto px-6 pt-16 pb-6 border-b border-[#d2d2d7]/60">
        <div className="flex items-end justify-between gap-6 pb-2">
          <div className="max-w-xl space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#d2d2d7] text-[#1d1d1f] text-xs font-semibold shadow-2xs">
              <Droplets className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
              <span>Complete Artisanal Catalogue · 2026 Collection</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-[#1d1d1f] leading-[1.08]">
              Artisanal Honey,{' '}
              <span className="font-normal text-[#86868b]">Combs &amp; Gift Sets.</span>
            </h1>

            <p className="text-sm text-[#6e6e73] leading-relaxed">
              Explore our single-origin monofloral harvests, fresh raw honeycomb slabs, and luxury presentation gift boxes. Cold-extracted below 38°C and tested by 400MHz German NMR spectroscopy.
            </p>
          </div>

          <div className="relative w-80 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by variety or product..."
              className="w-full h-11 pl-10 pr-8 text-sm rounded-full border border-[#d2d2d7] bg-white text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#0071e3] transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Unified Category Anchors */}
        <div className="pt-6 border-t border-[#d2d2d7]/50 flex items-center justify-between text-xs text-[#86868b]">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#1d1d1f]">Browse:</span>
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-[#1d1d1f] text-white shadow-xs'
                  : 'bg-white text-[#1d1d1f] border border-[#d2d2d7] hover:bg-[#f5f5f7]'
              }`}
            >
              All 10 Products
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('HONEY')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeFilter === 'HONEY'
                  ? 'bg-[#1d1d1f] text-white shadow-xs'
                  : 'bg-white text-[#1d1d1f] border border-[#d2d2d7] hover:bg-[#f5f5f7]'
              }`}
            >
              Monofloral Honeys
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('COMB')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeFilter === 'COMB'
                  ? 'bg-[#1d1d1f] text-white shadow-xs'
                  : 'bg-white text-[#1d1d1f] border border-[#d2d2d7] hover:bg-[#f5f5f7]'
              }`}
            >
              Fresh Honeycombs
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('GIFT')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeFilter === 'GIFT'
                  ? 'bg-[#1d1d1f] text-white shadow-xs'
                  : 'bg-white text-[#1d1d1f] border border-[#d2d2d7] hover:bg-[#f5f5f7]'
              }`}
            >
              Luxury Gift Boxes
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[#1b5e20] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% German NMR Certified Pure</span>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          3. BULLETPROOF APPLE-STYLE MOBILE CARDS (< 768px)
             Zero-overflow layout with perfectly fitting classic Buy button
         ──────────────────────────────────────────────────────────── */}
      <section className="md:hidden px-3.5 py-2.5 space-y-3 pb-28 sm:pb-36">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3 bg-white rounded-2xl border border-[#d2d2d7]/70">
            <p className="text-base font-bold text-[#1d1d1f]">No products match your search</p>
            <p className="text-xs text-[#86868b]">Try searching for multiflora, comb, gift box, or ajwain.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
              className="mt-2 px-5 py-2 rounded-full bg-[#0071e3] text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              View All 10 Products
            </button>
          </div>
        ) : (
          filteredProducts.map((p) => (
            <MobileShopCard key={p.id} product={p} />
          ))
        )}
      </section>

      {/* ────────────────────────────────────────────────────────────
          4. DESKTOP PRODUCT GRID (>= 768px)
             Classic Apple Grid displaying all 10 products
         ──────────────────────────────────────────────────────────── */}
      <section className="hidden md:block max-w-6xl mx-auto px-6 py-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#d2d2d7]/70 p-8 space-y-3">
            <p className="text-lg font-bold text-[#1d1d1f]">No products match your search</p>
            <p className="text-xs text-[#86868b]">Try searching for multiflora, comb, gift box, or ajwain.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
              className="mt-2 px-6 py-2.5 rounded-full bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] transition-colors cursor-pointer"
            >
              View All 10 Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((p) => (
              <article
                key={p.id}
                className="bg-white border border-[#d2d2d7]/70 hover:border-[#86868b] rounded-[24px] p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] hover:-translate-y-1 group relative overflow-hidden"
              >
                {p.isOutOfStock && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1 rounded-full bg-stone-900/90 text-white text-xs font-semibold shadow-xs">
                      Out of Stock
                    </span>
                  </div>
                )}

                <div>
                  <Link href={`/product/${p.slug}`} className="block">
                    <div className="w-full aspect-square rounded-[20px] bg-[#f5f5f7]/60 relative mb-5 overflow-hidden flex items-center justify-center p-4">
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 360px"
                        className="object-contain group-hover:scale-106 transition-transform duration-700 ease-out p-2"
                      />
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#86868b]">
                      <span className="truncate max-w-[180px]">{p.floralOrigin}</span>
                      <span className="inline-flex items-center gap-1 font-medium text-[#1d1d1f] shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{p.rating}</span>
                        <span className="text-[#86868b] font-normal text-[11px]">({p.ratingCount})</span>
                      </span>
                    </div>

                    <Link href={`/product/${p.slug}`} className="block">
                      <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">
                        {p.cleanTitle}
                      </h2>
                    </Link>

                    <p className="text-xs text-[#6e6e73] line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>

                    {/* Available Sizes Indicator */}
                    <div className="pt-2 flex items-center gap-2 text-xs text-[#86868b]">
                      <span>Available:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.availableSizes.map((size) => (
                          <span
                            key={size}
                            className="px-2 py-0.5 rounded-md bg-[#f5f5f7] text-[#1d1d1f] text-[11px] font-medium"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Pricing & Small Classic Apple Blue Buy Button */}
                <div className="pt-4 mt-5 border-t border-[#d2d2d7]/50 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-normal text-[#86868b]">From</span>
                      <span className="text-xl font-bold text-[#1d1d1f] tracking-tight">
                        {formatCurrency(p.startingPrice)}
                      </span>
                      {p.compareAtPrice > p.startingPrice && (
                        <span className="text-xs text-[#86868b] line-through">
                          {formatCurrency(p.compareAtPrice)}
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] font-semibold block ${p.isOutOfStock ? 'text-amber-800' : 'text-[#1b5e20]'}`}>
                      {p.isOutOfStock ? 'Sold Out · Next Extraction' : `Save ${p.discountPercent}% · Solid Glass`}
                    </span>
                  </div>

                  {p.isOutOfStock ? (
                    <span className="px-5 py-2 rounded-full bg-stone-100 text-stone-500 text-xs font-semibold border border-stone-200 select-none shrink-0">
                      Out of Stock
                    </span>
                  ) : (
                    <Link
                      href={`/product/${p.slug}`}
                      className="px-5 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white text-xs sm:text-sm font-medium transition-all flex items-center justify-center cursor-pointer shadow-sm group-hover:shadow-md shrink-0"
                    >
                      <span>Buy</span>
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Minimal Editorial Purity Banner */}
        <div className="mt-16 p-8 sm:p-12 rounded-[28px] bg-white border border-[#d2d2d7]/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-[#1d1d1f]">100% Unheated Raw Honey</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Extracted below hive temperature (38°C) without artificial boiling, keeping invertase and diastase enzymes viable.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-[#1d1d1f]">400MHz German NMR Verified</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Every single batch is molecularly fingerprinted to verify 0.0% inverted sugar syrup and zero synthetic syrups.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-[#1d1d1f]">Insured Solid Glass Freight</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Packed with 5-ply shock-absorbing honeycomb cushions. Full replacement guarantee against transit breakage.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
