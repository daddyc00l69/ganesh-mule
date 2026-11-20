'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { StoreProvider } from '@/components/storefront/store-provider';
import { ProductCard } from '@/components/storefront/product-card';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/lib/mock-data';
import { ProductItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/lib/cart/cart-context';
import { guessCityStateFromPin } from '@/lib/constants/india';
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
  RotateCcw,
  Share2,
  ThumbsUp,
  Download,
  CheckCircle2,
  MapPin,
  Zap,
  Clock,
} from 'lucide-react';

// Resolves category metadata from either category slug (/product/forest-honey) or variant slug (/product/forest-honey-500g)
function resolveCategoryFromSlug(slug: string) {
  const clean = slug ? slug.replace(/-(250g|500g|1kg|300g|750g|1050g)$/, '') : 'forest-honey';

  if (clean === 'forest-honey' || clean === 'wild-forest-raw-honey' || clean === 'wild-forest-raw') {
    return {
      categoryId: 'cat-forest',
      baseSlug: 'forest-honey',
      varietyName: 'Wild Forest Raw Honey',
      folderName: 'Forest Honey',
      floralOrigin: 'Western Ghats Deciduous Canopies, Maharashtra',
      flavourNotes: 'Multifloral blossom with warm floral caramel finish',
      description:
        'Pure cold-extracted raw honey gathered from wild Apis dorsata cliff bees in deep deciduous forest canopies. Bottled exclusively in thick, food-grade solid glass to safeguard delicate aromatic polyphenols and active living enzymes.',
    };
  }
  if (clean === 'sesame-honey') {
    return {
      categoryId: 'cat-sesame',
      baseSlug: 'sesame-honey',
      varietyName: 'Pure Sesame Blossom Honey',
      folderName: 'Sesame Honey',
      floralOrigin: 'Organic Sesame Plains, Maharashtra',
      flavourNotes: 'Warm nutty undertones with delicate amber sweetness',
      description:
        'Single-origin unheated honey harvested during peak sesame flowering. Naturally high in bio-available zinc, calcium minerals, and antioxidant flavonoids.',
    };
  }
  if (clean === 'ajwain-honey') {
    return {
      categoryId: 'cat-ajwain',
      baseSlug: 'ajwain-honey',
      varietyName: 'Organic Ajwain (Carom) Honey',
      folderName: 'Ajwain Honey',
      floralOrigin: 'Carom Flowering Fields, Rajasthan',
      flavourNotes: 'Herbal, pungent & warm digestive carom notes',
      description:
        'Distinctive raw monofloral honey harvested from white carom flowers. Celebrated in Ayurveda for respiratory comfort, gut health, and soothing digestion.',
    };
  }
  if (clean === 'multiflora-honey') {
    return {
      categoryId: 'cat-multiflora',
      baseSlug: 'multiflora-honey',
      varietyName: 'Wild Multiflora Raw Honey',
      folderName: 'Multiflora Honey',
      floralOrigin: 'Biodiverse Alpine Foothills',
      flavourNotes: 'Rich botanical bouquet with golden nectar finish',
      description:
        'Harmonious multifloral nectar gathered by bees foraging across dozens of seasonal medicinal herbs and seasonal forest blossoms.',
    };
  }
  if (clean === 'ber-honey') {
    return {
      categoryId: 'cat-ber',
      baseSlug: 'ber-honey',
      varietyName: 'Raw Ber (Sidr / Jujube) Honey',
      folderName: 'Ber Honey',
      floralOrigin: 'Arid Jujube Woodlands, Rajasthan',
      flavourNotes: 'Thick butterscotch aroma with deep lingering sweetness',
      description:
        'Revered ancient Sidr honey harvested from thorny desert jujube trees. Uniquely dense in bio-active polyphenols and amber antioxidants.',
    };
  }
  if (clean === 'sheesham-honey') {
    return {
      categoryId: 'cat-sheesham',
      baseSlug: 'sheesham-honey',
      varietyName: 'Raw Sheesham (Rosewood) Honey',
      folderName: 'Sheesham Honey',
      floralOrigin: 'Rosewood River Valleys, North India',
      flavourNotes: 'Mild floral notes with subtle woody sweetness',
      description:
        'Rare single-origin raw honey harvested from blooming North Indian Rosewood canopies. Low glycemic index with a silky, smooth finish.',
    };
  }

  return {
    categoryId: 'cat-forest',
    baseSlug: 'forest-honey',
    varietyName: 'Wild Forest Raw Honey',
    folderName: 'Forest Honey',
    floralOrigin: 'Western Ghats Deciduous Canopies, Maharashtra',
    flavourNotes: 'Multifloral blossom with warm floral caramel finish',
    description:
      'Pure cold-extracted raw honey gathered from wild Apis dorsata cliff bees in deep deciduous forest canopies. Bottled exclusively in thick, food-grade solid glass to safeguard delicate aromatic polyphenols and active living enzymes.',
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const rawSlug = (params?.slug as string) || 'forest-honey';
  const router = useRouter();
  const { addToCart, setIsCartOpen } = useCart();

  const categoryMeta = useMemo(() => resolveCategoryFromSlug(rawSlug), [rawSlug]);

  // Clean variety title without "(500g)" or "(250g)"
  const cleanName = categoryMeta.varietyName.replace(/ Raw Honey| Blossom Honey/g, ' Honey');

  // Database-backed variant records
  const [dbVariants, setDbVariants] = useState<ProductItem[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(true);

  // Initial selected weight determination from URL
  const initialWeight = rawSlug.includes('250g')
    ? '250g'
    : rawSlug.includes('1kg')
    ? '1kg'
    : '500g';
  const [selectedWeight, setSelectedWeight] = useState<'250g' | '500g' | '1kg'>(initialWeight);

  // Fetch size options directly from Database via /api/products
  useEffect(() => {
    let isMounted = true;
    async function fetchDatabaseVariants() {
      setIsLoadingVariants(true);
      try {
        const res = await fetch(`/api/products?categoryId=${categoryMeta.categoryId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.products && Array.isArray(data.products) && data.products.length > 0) {
            const activeOnly = data.products.filter((p: any) => p.isPublished !== false);
            if (activeOnly.length > 0 && isMounted) {
              setDbVariants(activeOnly);
              setIsLoadingVariants(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Falling back to authoritative local products', err);
      }

      // Authoritative Fallback from MOCK_PRODUCTS if offline or loading
      if (isMounted) {
        const fallback = MOCK_PRODUCTS.filter(
          (p) => p.categoryId === categoryMeta.categoryId && p.isPublished !== false
        );
        setDbVariants(fallback);
        setIsLoadingVariants(false);
      }
    }

    fetchDatabaseVariants();
    return () => {
      isMounted = false;
    };
  }, [categoryMeta.categoryId]);

  // Build the 3 Selectable Size Configurations from the Database
  const sizeOptions = useMemo(() => {
    const findVariant = (targetWeight: number, defaultSlugSuffix: string) => {
      return (
        dbVariants.find((p) => p.weightGrams === targetWeight) ||
        MOCK_PRODUCTS.find(
          (p) =>
            p.categoryId === categoryMeta.categoryId &&
            (p.weightGrams === targetWeight || p.slug.endsWith(defaultSlugSuffix))
        )
      );
    };

    const v250 = findVariant(250, '250g');
    const v500 = findVariant(500, '500g');
    const v1kg = findVariant(1000, '1kg');

    return [
      {
        weight: '250g' as const,
        label: 'Glass Sampler',
        badge: null,
        description: 'Ideal for first-time taste trials, tea sweeteners, or gourmet gifting.',
        weightGrams: 250,
        price: v250?.price ?? 19900,
        compareAtPrice: v250?.compareAtPrice ?? 27500,
        stockQuantity: v250?.stockQuantity ?? 80,
        lowStockThreshold: v250?.lowStockThreshold ?? 10,
        sku: v250?.sku ?? `GM-${categoryMeta.baseSlug.substring(0, 3).toUpperCase()}-250G`,
        productRecord: v250,
        pricePerKg: '₹796 / kg',
        discountPercent: 28,
        savingsText: 'Save ₹76',
      },
      {
        weight: '500g' as const,
        label: 'Solid Glass Standard Jar',
        badge: 'Most Popular · Daily Routine',
        description:
          'Perfect 30-day supply for morning warm lemon water, Ayurvedic digestive therapy & daily immunity.',
        weightGrams: 500,
        price: v500?.price ?? 39900,
        compareAtPrice: v500?.compareAtPrice ?? 54900,
        stockQuantity: v500?.stockQuantity ?? 120,
        lowStockThreshold: v500?.lowStockThreshold ?? 15,
        sku: v500?.sku ?? `GM-${categoryMeta.baseSlug.substring(0, 3).toUpperCase()}-500G`,
        productRecord: v500,
        pricePerKg: '₹798 / kg',
        discountPercent: 27,
        savingsText: 'Save ₹150',
      },
      {
        weight: '1kg' as const,
        label: 'Grand Reserve Jar',
        badge: 'Best Value · Lowest Rate',
        description:
          'Heavy solid glass reserve jar. Maximum family economy for full Ayurvedic therapies & natural baking.',
        weightGrams: 1000,
        price: v1kg?.price ?? 74900,
        compareAtPrice: v1kg?.compareAtPrice ?? 99900,
        stockQuantity: v1kg?.stockQuantity ?? 65,
        lowStockThreshold: v1kg?.lowStockThreshold ?? 10,
        sku: v1kg?.sku ?? `GM-${categoryMeta.baseSlug.substring(0, 3).toUpperCase()}-1KG`,
        productRecord: v1kg,
        pricePerKg: '₹749 / kg (Lowest Rate)',
        discountPercent: 25,
        savingsText: 'Save ₹250',
      },
    ];
  }, [dbVariants, categoryMeta]);

  // Current active variant based on customer selection
  const currentOption =
    sizeOptions.find((opt) => opt.weight === selectedWeight) || sizeOptions[1];

  // Dynamic Image Gallery switching based on selected size
  const galleryImages = useMemo(() => {
    const folder = categoryMeta.folderName;
    const size = selectedWeight;
    return [
      {
        id: 'img-1',
        url: `/images/honey-brand/${folder}/${size}/image_1_amazon_main.jpg`,
        altText: `${cleanName} ${size} Solid Glass Jar Front View`,
      },
      {
        id: 'img-2',
        url: `/images/honey-brand/${folder}/${size}/image_2_lifestyle.jpg`,
        altText: `${cleanName} ${size} Pure Honey Lifestyle Pour`,
      },
      {
        id: 'img-3',
        url: `/images/honey-brand/${folder}/${size}/image_3_texture.jpg`,
        altText: `${cleanName} Micro-Texture and Golden Consistency`,
      },
      {
        id: 'img-4',
        url: `/images/honey-brand/${folder}/${size}/image_6_size_comparison.jpg`,
        altText: `Ganesh Mule Solid Glass Tri-Pack Size Comparison`,
      },
    ];
  }, [categoryMeta.folderName, selectedWeight, cleanName]);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'STORY' | 'SPECS' | 'PURITY' | 'QA'>('STORY');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Delhivery Pincode Checker State
  const [pincode, setPincode] = useState('');
  const [pinCity, setPinCity] = useState('');
  const [pinState, setPinState] = useState('');
  const [pinChecked, setPinChecked] = useState(false);

  // Stock status from database
  const isOutOfStock = currentOption.stockQuantity <= 0;
  const isLowStock =
    currentOption.stockQuantity > 0 &&
    currentOption.stockQuantity <= currentOption.lowStockThreshold;

  // Monitor scroll for sticky bottom bar
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 480);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddToCart = () => {
    const itemToAdd = currentOption.productRecord
      ? {
          ...currentOption.productRecord,
          name: `${cleanName} (${currentOption.weight})`,
          price: currentOption.price,
          compareAtPrice: currentOption.compareAtPrice,
          weightGrams: currentOption.weightGrams,
        }
      : {
          id: `prod-${categoryMeta.baseSlug}-${currentOption.weight}`,
          slug: `${categoryMeta.baseSlug}-${currentOption.weight}`,
          sku: currentOption.sku,
          name: `${cleanName} (${currentOption.weight})`,
          price: currentOption.price,
          compareAtPrice: currentOption.compareAtPrice,
          categoryId: categoryMeta.categoryId,
          category: {
            id: categoryMeta.categoryId,
            slug: categoryMeta.baseSlug,
            name: categoryMeta.varietyName,
            isVisible: true,
          },
          stockQuantity: currentOption.stockQuantity,
          weightGrams: currentOption.weightGrams,
          images: galleryImages,
        };

    addToCart(itemToAdd as any, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setIsCartOpen(false);
    router.push('/checkout');
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      const resolved = guessCityStateFromPin(pincode);
      setPinCity(resolved?.city || 'Metro Delivery Hub');
      setPinState(resolved?.state || 'India');
      setPinChecked(true);
    }
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
      <div className="bg-[#FAF9F5] min-h-screen pb-24 text-stone-900 selection:bg-amber-500/20 selection:text-amber-900">
        
        {/* Apple-Style Minimalist Breadcrumb Bar */}
        <div className="border-b border-stone-200/70 bg-[#FCFBF7]/90 backdrop-blur-md sticky top-11 sm:top-12 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-stone-700 hover:text-amber-900 font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to The 6 Harvests</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-stone-500">
                <Link href="/" className="hover:text-stone-950">Store</Link>
                <span>/</span>
                <Link href="/shop" className="hover:text-stone-950">Harvests</Link>
                <span>/</span>
                <span className="text-stone-900 font-medium truncate max-w-xs">{cleanName}</span>
              </div>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 text-xs font-medium cursor-pointer shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-800" />
                <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Studio Product Configuration (Apple Store 2-Col Experience) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Gallery Column (6 Cols) */}
            <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-28">
              <div className="relative aspect-square rounded-[32px] overflow-hidden bg-white border border-stone-200/80 flex items-center justify-center p-8 sm:p-12 shadow-sm group">
                <Image
                  src={galleryImages[selectedImage]?.url || galleryImages[0].url}
                  alt={galleryImages[selectedImage]?.altText || cleanName}
                  fill
                  sizes="(max-width: 1024px) 100vw, 540px"
                  priority
                  className="object-contain group-hover:scale-105 transition-transform duration-700 ease-out drop-shadow-md p-6"
                />

                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  <span className="bg-stone-900 text-white text-[11px] font-medium tracking-wider px-3 py-1 rounded-full shadow-2xs">
                    {currentOption.weight} Solid Glass Jar
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    NMR Certified Pure
                  </span>
                </div>

                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] text-stone-500 border border-stone-200 shadow-2xs">
                  {selectedImage + 1} of {galleryImages.length}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 bg-white p-2 cursor-pointer transition-all shrink-0 relative ${
                      selectedImage === idx
                        ? 'border-amber-800 ring-2 ring-amber-800/20 shadow-xs'
                        : 'border-stone-200 hover:border-stone-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Configuration Column (6 Cols) */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Product Header */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-800 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-normal bg-amber-100 text-amber-900 border-amber-300">
                    Flagship Harvest
                  </span>
                  <span>{categoryMeta.varietyName}</span>
                  <span>•</span>
                  <span>{categoryMeta.floralOrigin}</span>
                </div>
                
                {/* Clean Product Name without baked-in 500g */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-950 mt-2 leading-tight tracking-tight">
                  {cleanName}
                </h1>

                {/* Rating & Tested Tag */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-900 shadow-2xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>4.9</span>
                    <span className="text-stone-500 font-normal">(783 verified reviews)</span>
                  </div>
                  <span className="text-xs text-stone-300">•</span>
                  <span className="text-xs text-emerald-800 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    NMR Batch Verified
                  </span>
                </div>
              </div>

              {/* Dynamic Price Display */}
              <div className="pt-2 border-t border-stone-200/80 space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-bold text-stone-950 tracking-tight">
                    {formatCurrency(currentOption.price)}
                  </span>
                  <span className="text-base text-stone-400 line-through">
                    MRP: {formatCurrency(currentOption.compareAtPrice)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {currentOption.discountPercent}% OFF
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-700">
                  {currentOption.savingsText} ·{' '}
                  <span className="text-stone-600 font-normal">{currentOption.pricePerKg}</span>
                </p>
                <p className="text-xs text-stone-500">
                  Inclusive of all taxes. Free express air delivery on orders over ₹999.
                </p>
              </div>

              {/* Sensory 4-Tile Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 rounded-2xl bg-white border border-stone-200/80 text-xs shadow-2xs">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Flora</span>
                  <span className="font-semibold text-stone-900 line-clamp-1">{cleanName.split(' ')[0]} Bloom</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Heat</span>
                  <span className="font-semibold text-stone-900">0.0% Cold</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Enzymes</span>
                  <span className="font-semibold text-emerald-700">100% Active</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Glass</span>
                  <span className="font-semibold text-stone-900">Solid Flint</span>
                </div>
              </div>

              {/* Short Description */}
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {categoryMeta.description}
              </p>

              {/* CRITICAL FEATURE: "Choose your preferred size" (Apple-Style Configuration) */}
              <div className="space-y-3 pt-3 border-t border-stone-200/80">
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      Configuration
                    </span>
                    <span className="text-xs font-medium text-stone-600">
                      Selected: <strong className="text-stone-950 font-bold">{currentOption.weight}</strong> ({currentOption.label})
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-stone-950">
                    Choose your preferred size
                  </h3>
                  <p className="text-xs text-stone-500">
                    Sourced directly from live apiary inventory. All options bottled in thick solid glass.
                  </p>
                </div>

                {/* 3 Selectable Size Cards */}
                <div className="grid grid-cols-1 gap-3 pt-1">
                  {sizeOptions.map((opt) => {
                    const isSelected = selectedWeight === opt.weight;
                    const isOptOutOfStock = opt.stockQuantity <= 0;

                    return (
                      <button
                        key={opt.weight}
                        type="button"
                        disabled={isOptOutOfStock}
                        onClick={() => {
                          setSelectedWeight(opt.weight);
                          setSelectedImage(0);
                        }}
                        className={`p-4 sm:p-5 text-left rounded-2xl border transition-all cursor-pointer relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-stone-950 ring-2 ring-stone-950/20 bg-amber-50/40 shadow-sm'
                            : isOptOutOfStock
                            ? 'border-stone-200 bg-stone-50/50 text-stone-400 cursor-not-allowed opacity-60'
                            : 'border-stone-200 bg-white hover:border-stone-400 text-stone-700 hover:shadow-2xs'
                        }`}
                      >
                        {opt.badge && (
                          <span
                            className={`absolute -top-2.5 left-4 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-2xs ${
                              opt.weight === '500g'
                                ? 'bg-amber-800 text-white'
                                : 'bg-emerald-800 text-white'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}

                        <div className="flex items-start gap-3.5">
                          {/* Radio Checkmark Circle */}
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? 'border-stone-950 bg-stone-950 text-white'
                                : 'border-stone-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-serif font-bold text-stone-950">
                                {opt.weight}
                              </span>
                              <span className="text-xs font-semibold text-stone-700">
                                {opt.label}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 max-w-sm leading-relaxed">
                              {opt.description}
                            </p>
                            <div className="text-[11px] font-mono text-stone-400 pt-0.5">
                              SKU: {opt.sku}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100 shrink-0 pl-8 sm:pl-0">
                          <div className="text-xl font-bold text-stone-950">
                            {formatCurrency(opt.price)}
                          </div>
                          <div className="text-xs text-stone-400 line-through">
                            MRP: {formatCurrency(opt.compareAtPrice)}
                          </div>
                          <div className="text-[11px] font-semibold text-emerald-700">
                            {opt.discountPercent}% OFF · {opt.savingsText}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            {opt.pricePerKg}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Stepper & Action Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between border border-stone-200 rounded-full bg-white px-3 py-2 w-32 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-1 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-semibold text-xs text-stone-950">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(currentOption.stockQuantity, q + 1))}
                      className="p-1 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className={`flex-1 py-3 px-6 rounded-full font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98 ${
                      isAdded
                        ? 'bg-emerald-700 text-white'
                        : isOutOfStock
                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        : 'border border-stone-300 bg-white hover:bg-stone-100 text-stone-900'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart ({currentOption.weight})</span>
                      </>
                    )}
                  </button>

                  {/* Instant Buy */}
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className="py-3 px-6 rounded-full font-semibold text-xs sm:text-sm bg-stone-900 hover:bg-amber-800 active:bg-amber-900 text-white transition-all cursor-pointer shadow-sm active:scale-98"
                  >
                    Instant Buy ({currentOption.weight})
                  </button>
                </div>

                {/* Stock Availability from Database */}
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-between text-xs text-stone-600 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOutOfStock
                          ? 'bg-rose-500'
                          : isLowStock
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-emerald-500 animate-pulse'
                      }`}
                    />
                    <span className="font-medium text-stone-900">
                      {isOutOfStock
                        ? 'Out of Stock'
                        : isLowStock
                        ? `Only ${currentOption.stockQuantity} jars remaining in stock`
                        : `In Stock (${currentOption.stockQuantity} jars ready for dispatch)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-900 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Dispatches in 24 hours</span>
                  </div>
                </div>
              </div>

              {/* Service Badges */}
              <div className="pt-4 border-t border-stone-200/80 grid grid-cols-2 gap-3 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>Free insured air freight over ₹999</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>100% Zero-breakage glass guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>NMR Spectroscopy tested pure</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-stone-700 shrink-0" />
                  <span>7-Day seamless replacement</span>
                </div>
              </div>

              {/* Interactive Delhivery Pincode Checker */}
              <div className="pt-4 border-t border-stone-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900">
                  <MapPin className="w-3.5 h-3.5 text-amber-800" />
                  <span>Check Delivery Date &amp; Pincode Serviceability</span>
                </div>
                <form onSubmit={handleCheckPincode} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '');
                      setPincode(v);
                      if (v.length === 6) {
                        const resolved = guessCityStateFromPin(v);
                        setPinCity(resolved?.city || 'Metro Delivery Hub');
                        setPinState(resolved?.state || 'India');
                        setPinChecked(true);
                      } else {
                        setPinChecked(false);
                      }
                    }}
                    placeholder="Enter 6-digit Pincode (e.g. 400001)"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-700"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-900 text-white hover:bg-amber-800 transition-colors cursor-pointer"
                  >
                    Check
                  </button>
                </form>
                {pinChecked && pinCity && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-semibold">Express Delivery Available to {pinCity}, {pinState}</span>
                      <p className="text-[10px] text-emerald-700">Dispatched within 24h via Delhivery Air · Free shipping on orders over ₹999</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Extended Information Section */}
        <section className="bg-white border-t border-stone-200/70 py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            {/* Segmented Nav Tabs */}
            <div className="flex items-center justify-center gap-2 border-b border-stone-200 pb-4 flex-wrap">
              {[
                { id: 'STORY', label: 'The Harvest & Origin' },
                { id: 'SPECS', label: 'Technical Specifications' },
                { id: 'PURITY', label: `NMR Lab Report (Batch 2026)` },
                { id: 'QA', label: 'Customer Q&A (3)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-4 py-2 text-xs font-medium rounded-full transition-all cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-stone-50 border border-stone-200 text-stone-600 hover:text-stone-950'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Story */}
            {activeTab === 'STORY' && (
              <div className="bg-[#FAF9F5] rounded-3xl border border-stone-200/80 p-8 space-y-6 shadow-2xs animate-in fade-in">
                <h3 className="text-xl font-serif font-bold text-stone-950">
                  Ethically Harvested by Indigenous Forest Beekeepers
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Unlike commercial beekeeping operations where hives are fed sugar syrup and treated with synthetic antibiotics, our raw honey is collected directly from wild bee colonies in remote bio-reserves. We partner directly with tribal beekeeper collectives using non-destructive traditional smoke methods that keep colonies safe.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    '【100% COLD-EXTRACTED RAW HONEY】: Harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.',
                    '【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.',
                    '【SOLID GLASS PACKAGING】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.',
                    '【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-stone-200">
                  <div className="p-5 rounded-2xl bg-white border border-stone-200/70 space-y-1">
                    <span className="text-xs font-semibold text-stone-950">Never Boiled / Heated</span>
                    <p className="text-xs text-stone-500">Extracted cold below 38°C to keep enzymes and beneficial bacteria alive.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-stone-200/70 space-y-1">
                    <span className="text-xs font-semibold text-stone-950">Unfiltered Pollen</span>
                    <p className="text-xs text-stone-500">Coarsely strained so microscopic wildflower bee pollen remains intact.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-stone-200/70 space-y-1">
                    <span className="text-xs font-semibold text-stone-950">Solid Glass Jars</span>
                    <p className="text-xs text-stone-500">Inert solid glass eliminates microplastic contamination forever.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Specs */}
            {activeTab === 'SPECS' && (
              <div className="bg-[#FAF9F5] rounded-3xl border border-stone-200/80 p-8 shadow-2xs animate-in fade-in space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-serif font-bold text-stone-950">Technical Specifications</h3>
                  <span className="text-xs font-mono text-stone-500">SKU: {currentOption.sku}</span>
                </div>
                
                <div className="rounded-2xl border border-stone-200/80 overflow-hidden text-xs bg-white">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-stone-100">
                      {[
                        ['Brand', 'Ganesh Mule Pure Honey'],
                        ['Flavour', categoryMeta.flavourNotes],
                        ['Origin', categoryMeta.floralOrigin],
                        ['Packaging', 'Heavy Food-Grade Solid Glass Jar'],
                        ['Selected Net Weight', currentOption.weight],
                        ['Shelf Life', '24 Months (Indefinite if kept dry)'],
                        ['Moisture Content', '< 18% (FSSAI Compliant)'],
                        ['Diastase Activity', '> 12 Schade (Active Live Enzymes)'],
                      ].map(([key, val], idx) => (
                        <tr key={key} className={idx % 2 === 0 ? 'bg-stone-50/50' : 'bg-white'}>
                          <td className="py-3 px-4 font-semibold text-stone-600 w-1/3">{key}</td>
                          <td className="py-3 px-4 text-stone-900 font-medium">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-stone-200/70 text-xs text-stone-600 leading-relaxed">
                  <span className="font-semibold text-stone-950 block mb-1">Dietary Information:</span>
                  100% natural and vegetarian. Naturally free from gluten, dairy, artificial preservatives, additives, and refined sugars. Not recommended for infants under 12 months.
                </div>
              </div>
            )}

            {/* Tab 3: Purity & NMR */}
            {activeTab === 'PURITY' && (
              <div className="bg-[#FAF9F5] rounded-3xl border border-stone-200/80 p-8 shadow-2xs animate-in fade-in space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-stone-950">NMR Spectroscopy Batch Analysis</h3>
                    <span className="text-xs text-stone-500 font-mono">Apiary Identifier: BATCH-2026-WF04</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit">
                    PASSED • 100% PURE RAW HONEY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-white border border-stone-200/70 space-y-1.5 text-center">
                    <span className="text-xs text-stone-500 font-medium">Diastase Activity</span>
                    <p className="text-2xl font-bold text-stone-950">14.2 Schade</p>
                    <p className="text-[11px] text-stone-500">Standard &gt; 8. Confirms zero heat exposure.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-stone-200/70 space-y-1.5 text-center">
                    <span className="text-xs text-stone-500 font-medium">C3 / C4 Added Sugars</span>
                    <p className="text-2xl font-bold text-emerald-700">0.0% (Zero)</p>
                    <p className="text-[11px] text-stone-500">Zero corn syrup, rice syrup, or cane sugar.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-stone-200/70 space-y-1.5 text-center">
                    <span className="text-xs text-stone-500 font-medium">Moisture Density</span>
                    <p className="text-2xl font-bold text-stone-950">17.6%</p>
                    <p className="text-[11px] text-stone-500">Naturally capped honeycomb ripeness.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-stone-200/70 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-stone-600">
                    <span className="font-semibold text-stone-950 block">Certificate of Authenticity Available</span>
                    Testing conducted in accordance with German NMR and Codex Alimentarius honey purity standards.
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Certificate for BATCH-2026 downloaded successfully (Simulated PDF).`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-50 border border-stone-200 text-stone-900 hover:bg-stone-100 text-xs font-semibold cursor-pointer shadow-2xs shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-800" />
                    <span>Download Report</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Q&A */}
            {activeTab === 'QA' && (
              <div className="bg-[#FAF9F5] rounded-3xl border border-stone-200/80 p-8 shadow-2xs animate-in fade-in space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-serif font-bold text-stone-950">Questions &amp; Answers</h3>
                  <span className="text-xs text-stone-500">3 questions answered</span>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      question: 'Does this raw honey crystallize in cold weather?',
                      answer: 'Yes! Natural crystallization is physical proof that the honey is 100% raw and has not been subjected to high-temperature commercial pasteurization.',
                    },
                    {
                      question: 'How should I store this honey once opened?',
                      answer: 'Store at room temperature with the solid glass jar lid closed tightly. Never refrigerate honey, as cold speeds up crystallization.',
                    },
                    {
                      question: 'Why do you pack in solid glass instead of squeeze bottles?',
                      answer: 'Honey is mildly acidic (pH ~3.9). Plastic containers leach microplastics under warm temperatures. Inert solid glass protects purity and enzymes forever.',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-white border border-stone-200/70 space-y-2">
                      <div className="text-xs font-semibold text-stone-950 flex items-start gap-2">
                        <span className="text-amber-800 font-bold">Q:</span>
                        <span>{item.question}</span>
                      </div>
                      <div className="text-xs text-stone-600 leading-relaxed pl-4 border-l-2 border-amber-800/40">
                        {item.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Floating Sticky Quick-Add Bar */}
        {showStickyBar && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#FCFBF7]/95 backdrop-blur-md border-t border-stone-200/80 shadow-xl z-40 py-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all animate-in slide-in-from-bottom">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0 hidden sm:flex items-center justify-center relative">
                  <Image
                    src={galleryImages[0].url}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-stone-950 truncate max-w-xs sm:max-w-sm">
                    {cleanName}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500">
                    <span className="font-semibold text-stone-800">{currentOption.weight}</span>
                    <span>•</span>
                    <span className="font-bold text-stone-950">{formatCurrency(currentOption.price)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`py-2 px-5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                    isAdded
                      ? 'bg-emerald-700 text-white'
                      : isOutOfStock
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      : 'border border-stone-300 text-stone-900 bg-white hover:bg-stone-100'
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
                      <span>Add to Cart ({currentOption.weight})</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="py-2 px-5 rounded-full text-xs font-semibold bg-stone-900 hover:bg-amber-800 text-white transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  Instant Buy ({currentOption.weight})
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </StoreProvider>
  );
}
