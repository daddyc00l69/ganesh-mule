import {
  ProductItem,
  CategoryItem,
  OrderRecord,
  ManagerAccount,
  InventoryMovementRecord,
  AuditLogRecord,
  DiscountCoupon,
} from '@/types';

export const MOCK_CATEGORIES: CategoryItem[] = [
  {
    "id": "cat-wild-forest",
    "slug": "wild-forest-raw",
    "name": "Wild Forest Raw Honey",
    "description": "Cold-extracted multifloral nectar gathered by wild forest bees in deep alpine and deciduous reserves.",
    "productCount": 3,
    "isVisible": true
  },
  {
    "id": "cat-forest",
    "slug": "forest-honey",
    "name": "Wild Forest Raw Honey",
    "description": "Pure cold-extracted raw honey gathered from wild Apis dorsata cliff bees in pristine deciduous forest canopies. Bottled exclusively in thick, food-grade solid glass to safeguard delicate aromatic polyphenols and active living enzymes.",
    "productCount": 3,
    "isVisible": true
  },
  {
    "id": "cat-sesame",
    "slug": "sesame-honey",
    "name": "Pure Sesame Blossom Honey",
    "description": "Single-origin unheated honey harvested during peak sesame flowering. Naturally high in zinc, calcium minerals, and antioxidant flavonoids.",
    "productCount": 3,
    "isVisible": true
  },
  {
    "id": "cat-ajwain",
    "slug": "ajwain-honey",
    "name": "Organic Ajwain (Carom) Honey",
    "description": "Distinctive raw honey harvested from white carom flowers. Celebrated in Ayurveda for respiratory comfort, gut health, and soothing digestion.",
    "productCount": 3,
    "isVisible": true
  },
  {
    "id": "cat-saunf",
    "slug": "saunf-honey",
    "name": "Raw Saunf (Fennel) Honey",
    "description": "Aromatic unpasteurized raw honey harvested from sweet fennel blooms. Imparts a naturally cooling aftertaste and soothing herbal benefits.",
    "productCount": 3,
    "isVisible": true
  },
  {
    "id": "cat-multiflora",
    "slug": "multiflora-honey",
    "name": "Wild Multiflora Raw Honey",
    "description": "Harmonious multifloral nectar gathered by bees foraging across dozens of seasonal medicinal herbs and seasonal forest blossoms.",
    "productCount": 3,
    "isVisible": true
  },
  {
    "id": "cat-ber",
    "slug": "ber-honey",
    "name": "Raw Ber (Sidr / Jujube) Honey",
    "description": "Revered Sidr honey harvested from thorny desert jujube trees. Uniquely rich in bioactive polyphenols and amber antioxidants.",
    "productCount": 3,
    "isVisible": true
  },
  {
    "id": "cat-sheesham",
    "slug": "sheesham-honey",
    "name": "Raw Sheesham (Rosewood) Honey",
    "description": "Rare single-origin raw honey harvested from blooming North Indian Rosewood canopies. Low glycemic index with a soothing smooth finish.",
    "productCount": 3,
    "isVisible": true
  }
];

export const MOCK_PRODUCTS: ProductItem[] = [
  {
  "id": "prod-forest-honey-250g",
  "slug": "forest-honey-250g",
  "sku": "GM-FOR-250G",
  "name": "Forest Honey (250g)",
  "description": "Pure cold-extracted raw honey gathered from wild Apis dorsata cliff bees in pristine deciduous forest canopies. Bottled exclusively in thick, food-grade solid glass to safeguard delicate aromatic polyphenols and active living enzymes.",
  "price": 19900,
  "compareAtPrice": 27500,
  "costPrice": 9500,
  "categoryId": "cat-forest",
  "category": {
    "id": "cat-forest",
    "slug": "forest-honey",
    "name": "Wild Forest Raw Honey",
    "description": "Pure cold-extracted raw honey gathered from wild Apis dorsata cliff bees in pristine deciduous forest canopies. Bottled exclusively in thick, food-grade solid glass to safeguard delicate aromatic polyphenols and active living enzymes.",
    "isVisible": true
  },
  "stockQuantity": 80,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Flagship Reserve",
  "badgeColor": "amber",
  "rating": 4.9,
  "ratingCount": 600,
  "answeredQuestionsCount": 28,
  "weightGrams": 250,
  "batchNumber": "BATCH-2026-FOR250G",
  "harvestDate": "October 2026",
  "flavour": "Multifloral Forest Blossom with Warm Floral Caramel Finish",
  "origin": "Western Ghats Deciduous Canopies, Maharashtra",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (250G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Multifloral Forest Blossom with Warm Floral Caramel Finish",
    "Net Weight": "250g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-forest-honey-250g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Forest Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-forest-honey-250g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 250g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-forest-honey-250g-1",
      "url": "/images/honey-brand/Forest Honey/250g/image_1_amazon_main.jpg",
      "altText": "Forest Honey 250g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-forest-honey-250g-2",
      "url": "/images/honey-brand/Forest Honey/250g/image_2_lifestyle.jpg",
      "altText": "Forest Honey 250g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-forest-honey-250g-3",
      "url": "/images/honey-brand/Forest Honey/250g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Forest Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-forest-honey-250g-4",
      "url": "/images/honey-brand/Forest Honey/250g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.682Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-forest-honey-500g",
  "slug": "forest-honey-500g",
  "sku": "GM-FOR-500G",
  "name": "Forest Honey (500g)",
  "description": "Pure cold-extracted raw honey gathered from wild Apis dorsata cliff bees in pristine deciduous forest canopies. Bottled exclusively in thick, food-grade solid glass to safeguard delicate aromatic polyphenols and active living enzymes.",
  "price": 39900,
  "compareAtPrice": 54900,
  "costPrice": 17000,
  "categoryId": "cat-forest",
  "category": {
    "id": "cat-forest",
    "slug": "forest-honey",
    "name": "Wild Forest Raw Honey",
    "description": "Pure cold-extracted raw honey gathered from wild Apis dorsata cliff bees in pristine deciduous forest canopies. Bottled exclusively in thick, food-grade solid glass to safeguard delicate aromatic polyphenols and active living enzymes.",
    "isVisible": true
  },
  "stockQuantity": 120,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Most Popular",
  "badgeColor": "amber",
  "rating": 4.9,
  "ratingCount": 783,
  "answeredQuestionsCount": 28,
  "weightGrams": 500,
  "batchNumber": "BATCH-2026-FOR500G",
  "harvestDate": "October 2026",
  "flavour": "Multifloral Forest Blossom with Warm Floral Caramel Finish",
  "origin": "Western Ghats Deciduous Canopies, Maharashtra",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (500G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Multifloral Forest Blossom with Warm Floral Caramel Finish",
    "Net Weight": "500g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-forest-honey-500g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Forest Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-forest-honey-500g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 500g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-forest-honey-500g-1",
      "url": "/images/honey-brand/Forest Honey/500g/image_1_amazon_main.jpg",
      "altText": "Forest Honey 500g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-forest-honey-500g-2",
      "url": "/images/honey-brand/Forest Honey/500g/image_2_lifestyle.jpg",
      "altText": "Forest Honey 500g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-forest-honey-500g-3",
      "url": "/images/honey-brand/Forest Honey/500g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Forest Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-forest-honey-500g-4",
      "url": "/images/honey-brand/Forest Honey/500g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-forest-honey-1kg",
  "slug": "forest-honey-1kg",
  "sku": "GM-FOR-1KG",
  "name": "Forest Honey (1kg)",
  "description": "Pure cold-extracted raw honey gathered from wild Apis dorsata cliff bees in pristine deciduous forest canopies. Bottled exclusively in thick, food-grade solid glass to safeguard delicate aromatic polyphenols and active living enzymes.",
  "price": 74900,
  "compareAtPrice": 99900,
  "costPrice": 31000,
  "categoryId": "cat-forest",
  "category": {
    "id": "cat-forest",
    "slug": "forest-honey",
    "name": "Wild Forest Raw Honey",
    "description": "Pure cold-extracted raw honey gathered from wild Apis dorsata cliff bees in pristine deciduous forest canopies. Bottled exclusively in thick, food-grade solid glass to safeguard delicate aromatic polyphenols and active living enzymes.",
    "isVisible": true
  },
  "stockQuantity": 65,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Best Value",
  "badgeColor": "amber",
  "rating": 4.9,
  "ratingCount": 838,
  "answeredQuestionsCount": 28,
  "weightGrams": 1000,
  "batchNumber": "BATCH-2026-FOR1KG",
  "harvestDate": "October 2026",
  "flavour": "Multifloral Forest Blossom with Warm Floral Caramel Finish",
  "origin": "Western Ghats Deciduous Canopies, Maharashtra",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (1KG)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Multifloral Forest Blossom with Warm Floral Caramel Finish",
    "Net Weight": "1kg",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-forest-honey-1kg-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Forest Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-forest-honey-1kg-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 1kg glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-forest-honey-1kg-1",
      "url": "/images/honey-brand/Forest Honey/1kg/image_1_amazon_main.jpg",
      "altText": "Forest Honey 1kg Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-forest-honey-1kg-2",
      "url": "/images/honey-brand/Forest Honey/1kg/image_2_lifestyle.jpg",
      "altText": "Forest Honey 1kg Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-forest-honey-1kg-3",
      "url": "/images/honey-brand/Forest Honey/1kg/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Forest Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-forest-honey-1kg-4",
      "url": "/images/honey-brand/Forest Honey/1kg/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-sesame-honey-250g",
  "slug": "sesame-honey-250g",
  "sku": "GM-SES-250G",
  "name": "Sesame Honey (250g)",
  "description": "Single-origin unheated honey harvested during peak sesame flowering. Naturally high in zinc, calcium minerals, and antioxidant flavonoids.",
  "price": 19900,
  "compareAtPrice": 27500,
  "costPrice": 9500,
  "categoryId": "cat-sesame",
  "category": {
    "id": "cat-sesame",
    "slug": "sesame-honey",
    "name": "Pure Sesame Blossom Honey",
    "description": "Single-origin unheated honey harvested during peak sesame flowering. Naturally high in zinc, calcium minerals, and antioxidant flavonoids.",
    "isVisible": true
  },
  "stockQuantity": 80,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Mineral Rich",
  "badgeColor": "purple",
  "rating": 4.9,
  "ratingCount": 702,
  "answeredQuestionsCount": 28,
  "weightGrams": 250,
  "batchNumber": "BATCH-2026-SES250G",
  "harvestDate": "October 2026",
  "flavour": "Nutty, Warm Sesame Flora with Mild Sweet Aftertaste",
  "origin": "Solapur & Marathwada Sesame Groves, Maharashtra",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (250G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Nutty, Warm Sesame Flora with Mild Sweet Aftertaste",
    "Net Weight": "250g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-sesame-honey-250g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Sesame Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-sesame-honey-250g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 250g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-sesame-honey-250g-1",
      "url": "/images/honey-brand/Sesame Honey/250g/image_1_amazon_main.jpg",
      "altText": "Sesame Honey 250g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-sesame-honey-250g-2",
      "url": "/images/honey-brand/Sesame Honey/250g/image_2_lifestyle.jpg",
      "altText": "Sesame Honey 250g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-sesame-honey-250g-3",
      "url": "/images/honey-brand/Sesame Honey/250g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Sesame Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-sesame-honey-250g-4",
      "url": "/images/honey-brand/Sesame Honey/250g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-sesame-honey-500g",
  "slug": "sesame-honey-500g",
  "sku": "GM-SES-500G",
  "name": "Sesame Honey (500g)",
  "description": "Single-origin unheated honey harvested during peak sesame flowering. Naturally high in zinc, calcium minerals, and antioxidant flavonoids.",
  "price": 39900,
  "compareAtPrice": 54900,
  "costPrice": 17000,
  "categoryId": "cat-sesame",
  "category": {
    "id": "cat-sesame",
    "slug": "sesame-honey",
    "name": "Pure Sesame Blossom Honey",
    "description": "Single-origin unheated honey harvested during peak sesame flowering. Naturally high in zinc, calcium minerals, and antioxidant flavonoids.",
    "isVisible": true
  },
  "stockQuantity": 120,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Most Popular",
  "badgeColor": "purple",
  "rating": 4.9,
  "ratingCount": 486,
  "answeredQuestionsCount": 28,
  "weightGrams": 500,
  "batchNumber": "BATCH-2026-SES500G",
  "harvestDate": "October 2026",
  "flavour": "Nutty, Warm Sesame Flora with Mild Sweet Aftertaste",
  "origin": "Solapur & Marathwada Sesame Groves, Maharashtra",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (500G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Nutty, Warm Sesame Flora with Mild Sweet Aftertaste",
    "Net Weight": "500g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-sesame-honey-500g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Sesame Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-sesame-honey-500g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 500g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-sesame-honey-500g-1",
      "url": "/images/honey-brand/Sesame Honey/500g/image_1_amazon_main.jpg",
      "altText": "Sesame Honey 500g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-sesame-honey-500g-2",
      "url": "/images/honey-brand/Sesame Honey/500g/image_2_lifestyle.jpg",
      "altText": "Sesame Honey 500g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-sesame-honey-500g-3",
      "url": "/images/honey-brand/Sesame Honey/500g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Sesame Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-sesame-honey-500g-4",
      "url": "/images/honey-brand/Sesame Honey/500g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-sesame-honey-1kg",
  "slug": "sesame-honey-1kg",
  "sku": "GM-SES-1KG",
  "name": "Sesame Honey (1kg)",
  "description": "Single-origin unheated honey harvested during peak sesame flowering. Naturally high in zinc, calcium minerals, and antioxidant flavonoids.",
  "price": 74900,
  "compareAtPrice": 99900,
  "costPrice": 31000,
  "categoryId": "cat-sesame",
  "category": {
    "id": "cat-sesame",
    "slug": "sesame-honey",
    "name": "Pure Sesame Blossom Honey",
    "description": "Single-origin unheated honey harvested during peak sesame flowering. Naturally high in zinc, calcium minerals, and antioxidant flavonoids.",
    "isVisible": true
  },
  "stockQuantity": 65,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Best Value",
  "badgeColor": "purple",
  "rating": 4.9,
  "ratingCount": 528,
  "answeredQuestionsCount": 28,
  "weightGrams": 1000,
  "batchNumber": "BATCH-2026-SES1KG",
  "harvestDate": "October 2026",
  "flavour": "Nutty, Warm Sesame Flora with Mild Sweet Aftertaste",
  "origin": "Solapur & Marathwada Sesame Groves, Maharashtra",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (1KG)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Nutty, Warm Sesame Flora with Mild Sweet Aftertaste",
    "Net Weight": "1kg",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-sesame-honey-1kg-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Sesame Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-sesame-honey-1kg-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 1kg glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-sesame-honey-1kg-1",
      "url": "/images/honey-brand/Sesame Honey/1kg/image_1_amazon_main.jpg",
      "altText": "Sesame Honey 1kg Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-sesame-honey-1kg-2",
      "url": "/images/honey-brand/Sesame Honey/1kg/image_2_lifestyle.jpg",
      "altText": "Sesame Honey 1kg Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-sesame-honey-1kg-3",
      "url": "/images/honey-brand/Sesame Honey/1kg/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Sesame Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-sesame-honey-1kg-4",
      "url": "/images/honey-brand/Sesame Honey/1kg/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-ajwain-honey-250g",
  "slug": "ajwain-honey-250g",
  "sku": "GM-AJW-250G",
  "name": "Ajwain Honey (250g)",
  "description": "Distinctive raw honey harvested from white carom flowers. Celebrated in Ayurveda for respiratory comfort, gut health, and soothing digestion.",
  "price": 19900,
  "compareAtPrice": 27500,
  "costPrice": 9500,
  "categoryId": "cat-ajwain",
  "category": {
    "id": "cat-ajwain",
    "slug": "ajwain-honey",
    "name": "Organic Ajwain (Carom) Honey",
    "description": "Distinctive raw honey harvested from white carom flowers. Celebrated in Ayurveda for respiratory comfort, gut health, and soothing digestion.",
    "isVisible": true
  },
  "stockQuantity": 80,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Ayurvedic Digest",
  "badgeColor": "emerald",
  "rating": 4.9,
  "ratingCount": 451,
  "answeredQuestionsCount": 28,
  "weightGrams": 250,
  "batchNumber": "BATCH-2026-AJW250G",
  "harvestDate": "October 2026",
  "flavour": "Herbal, Pungent & Warm Digestive Carom Notes",
  "origin": "Organic Carom Seed Farms, Rajasthan & Gujarat",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (250G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Herbal, Pungent & Warm Digestive Carom Notes",
    "Net Weight": "250g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-ajwain-honey-250g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Ajwain Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-ajwain-honey-250g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 250g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-ajwain-honey-250g-1",
      "url": "/images/honey-brand/Ajwain Honey/250g/image_1_amazon_main.jpg",
      "altText": "Ajwain Honey 250g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-ajwain-honey-250g-2",
      "url": "/images/honey-brand/Ajwain Honey/250g/image_2_lifestyle.jpg",
      "altText": "Ajwain Honey 250g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-ajwain-honey-250g-3",
      "url": "/images/honey-brand/Ajwain Honey/250g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Ajwain Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-ajwain-honey-250g-4",
      "url": "/images/honey-brand/Ajwain Honey/250g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-ajwain-honey-500g",
  "slug": "ajwain-honey-500g",
  "sku": "GM-AJW-500G",
  "name": "Ajwain Honey (500g)",
  "description": "Distinctive raw honey harvested from white carom flowers. Celebrated in Ayurveda for respiratory comfort, gut health, and soothing digestion.",
  "price": 39900,
  "compareAtPrice": 54900,
  "costPrice": 17000,
  "categoryId": "cat-ajwain",
  "category": {
    "id": "cat-ajwain",
    "slug": "ajwain-honey",
    "name": "Organic Ajwain (Carom) Honey",
    "description": "Distinctive raw honey harvested from white carom flowers. Celebrated in Ayurveda for respiratory comfort, gut health, and soothing digestion.",
    "isVisible": true
  },
  "stockQuantity": 120,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Most Popular",
  "badgeColor": "emerald",
  "rating": 4.9,
  "ratingCount": 436,
  "answeredQuestionsCount": 28,
  "weightGrams": 500,
  "batchNumber": "BATCH-2026-AJW500G",
  "harvestDate": "October 2026",
  "flavour": "Herbal, Pungent & Warm Digestive Carom Notes",
  "origin": "Organic Carom Seed Farms, Rajasthan & Gujarat",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (500G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Herbal, Pungent & Warm Digestive Carom Notes",
    "Net Weight": "500g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-ajwain-honey-500g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Ajwain Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-ajwain-honey-500g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 500g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-ajwain-honey-500g-1",
      "url": "/images/honey-brand/Ajwain Honey/500g/image_1_amazon_main.jpg",
      "altText": "Ajwain Honey 500g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-ajwain-honey-500g-2",
      "url": "/images/honey-brand/Ajwain Honey/500g/image_2_lifestyle.jpg",
      "altText": "Ajwain Honey 500g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-ajwain-honey-500g-3",
      "url": "/images/honey-brand/Ajwain Honey/500g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Ajwain Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-ajwain-honey-500g-4",
      "url": "/images/honey-brand/Ajwain Honey/500g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-ajwain-honey-1kg",
  "slug": "ajwain-honey-1kg",
  "sku": "GM-AJW-1KG",
  "name": "Ajwain Honey (1kg)",
  "description": "Distinctive raw honey harvested from white carom flowers. Celebrated in Ayurveda for respiratory comfort, gut health, and soothing digestion.",
  "price": 74900,
  "compareAtPrice": 99900,
  "costPrice": 31000,
  "categoryId": "cat-ajwain",
  "category": {
    "id": "cat-ajwain",
    "slug": "ajwain-honey",
    "name": "Organic Ajwain (Carom) Honey",
    "description": "Distinctive raw honey harvested from white carom flowers. Celebrated in Ayurveda for respiratory comfort, gut health, and soothing digestion.",
    "isVisible": true
  },
  "stockQuantity": 65,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Best Value",
  "badgeColor": "emerald",
  "rating": 4.9,
  "ratingCount": 885,
  "answeredQuestionsCount": 28,
  "weightGrams": 1000,
  "batchNumber": "BATCH-2026-AJW1KG",
  "harvestDate": "October 2026",
  "flavour": "Herbal, Pungent & Warm Digestive Carom Notes",
  "origin": "Organic Carom Seed Farms, Rajasthan & Gujarat",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (1KG)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Herbal, Pungent & Warm Digestive Carom Notes",
    "Net Weight": "1kg",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-ajwain-honey-1kg-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Ajwain Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-ajwain-honey-1kg-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 1kg glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-ajwain-honey-1kg-1",
      "url": "/images/honey-brand/Ajwain Honey/1kg/image_1_amazon_main.jpg",
      "altText": "Ajwain Honey 1kg Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-ajwain-honey-1kg-2",
      "url": "/images/honey-brand/Ajwain Honey/1kg/image_2_lifestyle.jpg",
      "altText": "Ajwain Honey 1kg Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-ajwain-honey-1kg-3",
      "url": "/images/honey-brand/Ajwain Honey/1kg/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Ajwain Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-ajwain-honey-1kg-4",
      "url": "/images/honey-brand/Ajwain Honey/1kg/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-saunf-honey-250g",
  "slug": "saunf-honey-250g",
  "sku": "GM-SAU-250G",
  "name": "Saunf (Fennel) Honey (250g)",
  "description": "Aromatic unpasteurized raw honey harvested from sweet fennel blooms. Imparts a naturally cooling aftertaste and soothing herbal benefits.",
  "price": 19900,
  "compareAtPrice": 27500,
  "costPrice": 9500,
  "categoryId": "cat-saunf",
  "category": {
    "id": "cat-saunf",
    "slug": "saunf-honey",
    "name": "Raw Saunf (Fennel) Honey",
    "description": "Aromatic unpasteurized raw honey harvested from sweet fennel blooms. Imparts a naturally cooling aftertaste and soothing herbal benefits.",
    "isVisible": true
  },
  "stockQuantity": 80,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Cooling & Calming",
  "badgeColor": "cyan",
  "rating": 4.9,
  "ratingCount": 736,
  "answeredQuestionsCount": 28,
  "weightGrams": 250,
  "batchNumber": "BATCH-2026-SAU250G",
  "harvestDate": "October 2026",
  "flavour": "Sweet Licorice & Refreshing Aniseed Notes",
  "origin": "Fennel Apiaries, Saurashtra, Gujarat",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (250G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Sweet Licorice & Refreshing Aniseed Notes",
    "Net Weight": "250g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-saunf-honey-250g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Saunf (Fennel) Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-saunf-honey-250g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 250g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-saunf-honey-250g-1",
      "url": "/images/honey-brand/Saunf Honey/250g/image_1_amazon_main.jpg",
      "altText": "Saunf (Fennel) Honey 250g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-saunf-honey-250g-2",
      "url": "/images/honey-brand/Saunf Honey/250g/image_2_lifestyle.jpg",
      "altText": "Saunf (Fennel) Honey 250g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-saunf-honey-250g-3",
      "url": "/images/honey-brand/Saunf Honey/250g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Saunf (Fennel) Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-saunf-honey-250g-4",
      "url": "/images/honey-brand/Saunf Honey/250g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-saunf-honey-500g",
  "slug": "saunf-honey-500g",
  "sku": "GM-SAU-500G",
  "name": "Saunf (Fennel) Honey (500g)",
  "description": "Aromatic unpasteurized raw honey harvested from sweet fennel blooms. Imparts a naturally cooling aftertaste and soothing herbal benefits.",
  "price": 39900,
  "compareAtPrice": 54900,
  "costPrice": 17000,
  "categoryId": "cat-saunf",
  "category": {
    "id": "cat-saunf",
    "slug": "saunf-honey",
    "name": "Raw Saunf (Fennel) Honey",
    "description": "Aromatic unpasteurized raw honey harvested from sweet fennel blooms. Imparts a naturally cooling aftertaste and soothing herbal benefits.",
    "isVisible": true
  },
  "stockQuantity": 120,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Most Popular",
  "badgeColor": "cyan",
  "rating": 4.9,
  "ratingCount": 633,
  "answeredQuestionsCount": 28,
  "weightGrams": 500,
  "batchNumber": "BATCH-2026-SAU500G",
  "harvestDate": "October 2026",
  "flavour": "Sweet Licorice & Refreshing Aniseed Notes",
  "origin": "Fennel Apiaries, Saurashtra, Gujarat",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (500G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Sweet Licorice & Refreshing Aniseed Notes",
    "Net Weight": "500g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-saunf-honey-500g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Saunf (Fennel) Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-saunf-honey-500g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 500g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-saunf-honey-500g-1",
      "url": "/images/honey-brand/Saunf Honey/500g/image_1_amazon_main.jpg",
      "altText": "Saunf (Fennel) Honey 500g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-saunf-honey-500g-2",
      "url": "/images/honey-brand/Saunf Honey/500g/image_2_lifestyle.jpg",
      "altText": "Saunf (Fennel) Honey 500g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-saunf-honey-500g-3",
      "url": "/images/honey-brand/Saunf Honey/500g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Saunf (Fennel) Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-saunf-honey-500g-4",
      "url": "/images/honey-brand/Saunf Honey/500g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-saunf-honey-1kg",
  "slug": "saunf-honey-1kg",
  "sku": "GM-SAU-1KG",
  "name": "Saunf (Fennel) Honey (1kg)",
  "description": "Aromatic unpasteurized raw honey harvested from sweet fennel blooms. Imparts a naturally cooling aftertaste and soothing herbal benefits.",
  "price": 74900,
  "compareAtPrice": 99900,
  "costPrice": 31000,
  "categoryId": "cat-saunf",
  "category": {
    "id": "cat-saunf",
    "slug": "saunf-honey",
    "name": "Raw Saunf (Fennel) Honey",
    "description": "Aromatic unpasteurized raw honey harvested from sweet fennel blooms. Imparts a naturally cooling aftertaste and soothing herbal benefits.",
    "isVisible": true
  },
  "stockQuantity": 65,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Best Value",
  "badgeColor": "cyan",
  "rating": 4.9,
  "ratingCount": 477,
  "answeredQuestionsCount": 28,
  "weightGrams": 1000,
  "batchNumber": "BATCH-2026-SAU1KG",
  "harvestDate": "October 2026",
  "flavour": "Sweet Licorice & Refreshing Aniseed Notes",
  "origin": "Fennel Apiaries, Saurashtra, Gujarat",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (1KG)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Sweet Licorice & Refreshing Aniseed Notes",
    "Net Weight": "1kg",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-saunf-honey-1kg-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Saunf (Fennel) Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-saunf-honey-1kg-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 1kg glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-saunf-honey-1kg-1",
      "url": "/images/honey-brand/Saunf Honey/1kg/image_1_amazon_main.jpg",
      "altText": "Saunf (Fennel) Honey 1kg Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-saunf-honey-1kg-2",
      "url": "/images/honey-brand/Saunf Honey/1kg/image_2_lifestyle.jpg",
      "altText": "Saunf (Fennel) Honey 1kg Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-saunf-honey-1kg-3",
      "url": "/images/honey-brand/Saunf Honey/1kg/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Saunf (Fennel) Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-saunf-honey-1kg-4",
      "url": "/images/honey-brand/Saunf Honey/1kg/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-multiflora-honey-250g",
  "slug": "multiflora-honey-250g",
  "sku": "GM-MUL-250G",
  "name": "Multiflora Honey (250g)",
  "description": "Harmonious multifloral nectar gathered by bees foraging across dozens of seasonal medicinal herbs and seasonal forest blossoms.",
  "price": 19900,
  "compareAtPrice": 27500,
  "costPrice": 9500,
  "categoryId": "cat-multiflora",
  "category": {
    "id": "cat-multiflora",
    "slug": "multiflora-honey",
    "name": "Wild Multiflora Raw Honey",
    "description": "Harmonious multifloral nectar gathered by bees foraging across dozens of seasonal medicinal herbs and seasonal forest blossoms.",
    "isVisible": true
  },
  "stockQuantity": 80,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Daily Wellness",
  "badgeColor": "blue",
  "rating": 4.9,
  "ratingCount": 819,
  "answeredQuestionsCount": 28,
  "weightGrams": 250,
  "batchNumber": "BATCH-2026-MUL250G",
  "harvestDate": "October 2026",
  "flavour": "Complex Bouquet of Hundreds of Wild Meadows & Herbs",
  "origin": "Satpura Alpine Meadows & Forest Foothills",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (250G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Complex Bouquet of Hundreds of Wild Meadows & Herbs",
    "Net Weight": "250g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-multiflora-honey-250g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Multiflora Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-multiflora-honey-250g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 250g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-multiflora-honey-250g-1",
      "url": "/images/honey-brand/Multiflora Honey/250g/image_1_amazon_main.jpg",
      "altText": "Multiflora Honey 250g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-multiflora-honey-250g-2",
      "url": "/images/honey-brand/Multiflora Honey/250g/image_2_lifestyle.jpg",
      "altText": "Multiflora Honey 250g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-multiflora-honey-250g-3",
      "url": "/images/honey-brand/Multiflora Honey/250g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Multiflora Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-multiflora-honey-250g-4",
      "url": "/images/honey-brand/Multiflora Honey/250g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-multiflora-honey-500g",
  "slug": "multiflora-honey-500g",
  "sku": "GM-MUL-500G",
  "name": "Multiflora Honey (500g)",
  "description": "Harmonious multifloral nectar gathered by bees foraging across dozens of seasonal medicinal herbs and seasonal forest blossoms.",
  "price": 39900,
  "compareAtPrice": 54900,
  "costPrice": 17000,
  "categoryId": "cat-multiflora",
  "category": {
    "id": "cat-multiflora",
    "slug": "multiflora-honey",
    "name": "Wild Multiflora Raw Honey",
    "description": "Harmonious multifloral nectar gathered by bees foraging across dozens of seasonal medicinal herbs and seasonal forest blossoms.",
    "isVisible": true
  },
  "stockQuantity": 120,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Most Popular",
  "badgeColor": "blue",
  "rating": 4.9,
  "ratingCount": 690,
  "answeredQuestionsCount": 28,
  "weightGrams": 500,
  "batchNumber": "BATCH-2026-MUL500G",
  "harvestDate": "October 2026",
  "flavour": "Complex Bouquet of Hundreds of Wild Meadows & Herbs",
  "origin": "Satpura Alpine Meadows & Forest Foothills",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (500G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Complex Bouquet of Hundreds of Wild Meadows & Herbs",
    "Net Weight": "500g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-multiflora-honey-500g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Multiflora Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-multiflora-honey-500g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 500g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-multiflora-honey-500g-1",
      "url": "/images/honey-brand/Multiflora Honey/500g/image_1_amazon_main.jpg",
      "altText": "Multiflora Honey 500g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-multiflora-honey-500g-2",
      "url": "/images/honey-brand/Multiflora Honey/500g/image_2_lifestyle.jpg",
      "altText": "Multiflora Honey 500g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-multiflora-honey-500g-3",
      "url": "/images/honey-brand/Multiflora Honey/500g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Multiflora Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-multiflora-honey-500g-4",
      "url": "/images/honey-brand/Multiflora Honey/500g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-multiflora-honey-1kg",
  "slug": "multiflora-honey-1kg",
  "sku": "GM-MUL-1KG",
  "name": "Multiflora Honey (1kg)",
  "description": "Harmonious multifloral nectar gathered by bees foraging across dozens of seasonal medicinal herbs and seasonal forest blossoms.",
  "price": 74900,
  "compareAtPrice": 99900,
  "costPrice": 31000,
  "categoryId": "cat-multiflora",
  "category": {
    "id": "cat-multiflora",
    "slug": "multiflora-honey",
    "name": "Wild Multiflora Raw Honey",
    "description": "Harmonious multifloral nectar gathered by bees foraging across dozens of seasonal medicinal herbs and seasonal forest blossoms.",
    "isVisible": true
  },
  "stockQuantity": 65,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Best Value",
  "badgeColor": "blue",
  "rating": 4.9,
  "ratingCount": 794,
  "answeredQuestionsCount": 28,
  "weightGrams": 1000,
  "batchNumber": "BATCH-2026-MUL1KG",
  "harvestDate": "October 2026",
  "flavour": "Complex Bouquet of Hundreds of Wild Meadows & Herbs",
  "origin": "Satpura Alpine Meadows & Forest Foothills",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (1KG)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Complex Bouquet of Hundreds of Wild Meadows & Herbs",
    "Net Weight": "1kg",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-multiflora-honey-1kg-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Multiflora Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-multiflora-honey-1kg-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 1kg glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-multiflora-honey-1kg-1",
      "url": "/images/honey-brand/Multiflora Honey/1kg/image_1_amazon_main.jpg",
      "altText": "Multiflora Honey 1kg Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-multiflora-honey-1kg-2",
      "url": "/images/honey-brand/Multiflora Honey/1kg/image_2_lifestyle.jpg",
      "altText": "Multiflora Honey 1kg Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-multiflora-honey-1kg-3",
      "url": "/images/honey-brand/Multiflora Honey/1kg/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Multiflora Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-multiflora-honey-1kg-4",
      "url": "/images/honey-brand/Multiflora Honey/1kg/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-ber-honey-250g",
  "slug": "ber-honey-250g",
  "sku": "GM-BER-250G",
  "name": "Ber (Sidr) Honey (250g)",
  "description": "Revered Sidr honey harvested from thorny desert jujube trees. Uniquely rich in bioactive polyphenols and amber antioxidants.",
  "price": 19900,
  "compareAtPrice": 27500,
  "costPrice": 9500,
  "categoryId": "cat-ber",
  "category": {
    "id": "cat-ber",
    "slug": "ber-honey",
    "name": "Raw Ber (Sidr / Jujube) Honey",
    "description": "Revered Sidr honey harvested from thorny desert jujube trees. Uniquely rich in bioactive polyphenols and amber antioxidants.",
    "isVisible": true
  },
  "stockQuantity": 80,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Ancient Sidr",
  "badgeColor": "rose",
  "rating": 4.9,
  "ratingCount": 505,
  "answeredQuestionsCount": 28,
  "weightGrams": 250,
  "batchNumber": "BATCH-2026-BER250G",
  "harvestDate": "October 2026",
  "flavour": "Rich, Butterscotch & Molasses-like Velvety Sweetness",
  "origin": "Wild Jujube Forests, Bikaner & Thar Border",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (250G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Rich, Butterscotch & Molasses-like Velvety Sweetness",
    "Net Weight": "250g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-ber-honey-250g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Ber (Sidr) Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-ber-honey-250g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 250g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-ber-honey-250g-1",
      "url": "/images/honey-brand/Ber Honey/250g/image_1_amazon_main.jpg",
      "altText": "Ber (Sidr) Honey 250g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-ber-honey-250g-2",
      "url": "/images/honey-brand/Ber Honey/250g/image_2_lifestyle.jpg",
      "altText": "Ber (Sidr) Honey 250g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-ber-honey-250g-3",
      "url": "/images/honey-brand/Ber Honey/250g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Ber (Sidr) Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-ber-honey-250g-4",
      "url": "/images/honey-brand/Ber Honey/250g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-ber-honey-500g",
  "slug": "ber-honey-500g",
  "sku": "GM-BER-500G",
  "name": "Ber (Sidr) Honey (500g)",
  "description": "Revered Sidr honey harvested from thorny desert jujube trees. Uniquely rich in bioactive polyphenols and amber antioxidants.",
  "price": 39900,
  "compareAtPrice": 54900,
  "costPrice": 17000,
  "categoryId": "cat-ber",
  "category": {
    "id": "cat-ber",
    "slug": "ber-honey",
    "name": "Raw Ber (Sidr / Jujube) Honey",
    "description": "Revered Sidr honey harvested from thorny desert jujube trees. Uniquely rich in bioactive polyphenols and amber antioxidants.",
    "isVisible": true
  },
  "stockQuantity": 120,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Most Popular",
  "badgeColor": "rose",
  "rating": 4.9,
  "ratingCount": 510,
  "answeredQuestionsCount": 28,
  "weightGrams": 500,
  "batchNumber": "BATCH-2026-BER500G",
  "harvestDate": "October 2026",
  "flavour": "Rich, Butterscotch & Molasses-like Velvety Sweetness",
  "origin": "Wild Jujube Forests, Bikaner & Thar Border",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (500G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Rich, Butterscotch & Molasses-like Velvety Sweetness",
    "Net Weight": "500g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-ber-honey-500g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Ber (Sidr) Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-ber-honey-500g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 500g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-ber-honey-500g-1",
      "url": "/images/honey-brand/Ber Honey/500g/image_1_amazon_main.jpg",
      "altText": "Ber (Sidr) Honey 500g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-ber-honey-500g-2",
      "url": "/images/honey-brand/Ber Honey/500g/image_2_lifestyle.jpg",
      "altText": "Ber (Sidr) Honey 500g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-ber-honey-500g-3",
      "url": "/images/honey-brand/Ber Honey/500g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Ber (Sidr) Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-ber-honey-500g-4",
      "url": "/images/honey-brand/Ber Honey/500g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-ber-honey-1kg",
  "slug": "ber-honey-1kg",
  "sku": "GM-BER-1KG",
  "name": "Ber (Sidr) Honey (1kg)",
  "description": "Revered Sidr honey harvested from thorny desert jujube trees. Uniquely rich in bioactive polyphenols and amber antioxidants.",
  "price": 74900,
  "compareAtPrice": 99900,
  "costPrice": 31000,
  "categoryId": "cat-ber",
  "category": {
    "id": "cat-ber",
    "slug": "ber-honey",
    "name": "Raw Ber (Sidr / Jujube) Honey",
    "description": "Revered Sidr honey harvested from thorny desert jujube trees. Uniquely rich in bioactive polyphenols and amber antioxidants.",
    "isVisible": true
  },
  "stockQuantity": 65,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Best Value",
  "badgeColor": "rose",
  "rating": 4.9,
  "ratingCount": 685,
  "answeredQuestionsCount": 28,
  "weightGrams": 1000,
  "batchNumber": "BATCH-2026-BER1KG",
  "harvestDate": "October 2026",
  "flavour": "Rich, Butterscotch & Molasses-like Velvety Sweetness",
  "origin": "Wild Jujube Forests, Bikaner & Thar Border",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (1KG)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Rich, Butterscotch & Molasses-like Velvety Sweetness",
    "Net Weight": "1kg",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-ber-honey-1kg-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Ber (Sidr) Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-ber-honey-1kg-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 1kg glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-ber-honey-1kg-1",
      "url": "/images/honey-brand/Ber Honey/1kg/image_1_amazon_main.jpg",
      "altText": "Ber (Sidr) Honey 1kg Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-ber-honey-1kg-2",
      "url": "/images/honey-brand/Ber Honey/1kg/image_2_lifestyle.jpg",
      "altText": "Ber (Sidr) Honey 1kg Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-ber-honey-1kg-3",
      "url": "/images/honey-brand/Ber Honey/1kg/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Ber (Sidr) Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-ber-honey-1kg-4",
      "url": "/images/honey-brand/Ber Honey/1kg/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-sheesham-honey-250g",
  "slug": "sheesham-honey-250g",
  "sku": "GM-SHF-250G",
  "name": "Sheesham Honey (250g)",
  "description": "Rare single-origin raw honey harvested from blooming North Indian Rosewood canopies. Low glycemic index with a soothing smooth finish.",
  "price": 19900,
  "compareAtPrice": 27500,
  "costPrice": 9500,
  "categoryId": "cat-sheesham",
  "category": {
    "id": "cat-sheesham",
    "slug": "sheesham-honey",
    "name": "Raw Sheesham (Rosewood) Honey",
    "description": "Rare single-origin raw honey harvested from blooming North Indian Rosewood canopies. Low glycemic index with a soothing smooth finish.",
    "isVisible": true
  },
  "stockQuantity": 80,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Single Origin",
  "badgeColor": "amber",
  "rating": 4.9,
  "ratingCount": 760,
  "answeredQuestionsCount": 28,
  "weightGrams": 250,
  "batchNumber": "BATCH-2026-SHF250G",
  "harvestDate": "October 2026",
  "flavour": "Delicate Woody, Mild Vanilla & Golden Amber Undertones",
  "origin": "Dalbergia Sissoo Forest Reserves, Northern Foothills",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (250G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Delicate Woody, Mild Vanilla & Golden Amber Undertones",
    "Net Weight": "250g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-sheesham-honey-250g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Sheesham Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-sheesham-honey-250g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 250g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-sheesham-honey-250g-1",
      "url": "/images/honey-brand/Sheesham Honey/250g/image_1_amazon_main.jpg",
      "altText": "Sheesham Honey 250g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-sheesham-honey-250g-2",
      "url": "/images/honey-brand/Sheesham Honey/250g/image_2_lifestyle.jpg",
      "altText": "Sheesham Honey 250g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-sheesham-honey-250g-3",
      "url": "/images/honey-brand/Sheesham Honey/250g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Sheesham Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-sheesham-honey-250g-4",
      "url": "/images/honey-brand/Sheesham Honey/250g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-sheesham-honey-500g",
  "slug": "sheesham-honey-500g",
  "sku": "GM-SHF-500G",
  "name": "Sheesham Honey (500g)",
  "description": "Rare single-origin raw honey harvested from blooming North Indian Rosewood canopies. Low glycemic index with a soothing smooth finish.",
  "price": 39900,
  "compareAtPrice": 54900,
  "costPrice": 17000,
  "categoryId": "cat-sheesham",
  "category": {
    "id": "cat-sheesham",
    "slug": "sheesham-honey",
    "name": "Raw Sheesham (Rosewood) Honey",
    "description": "Rare single-origin raw honey harvested from blooming North Indian Rosewood canopies. Low glycemic index with a soothing smooth finish.",
    "isVisible": true
  },
  "stockQuantity": 120,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Most Popular",
  "badgeColor": "amber",
  "rating": 4.9,
  "ratingCount": 906,
  "answeredQuestionsCount": 28,
  "weightGrams": 500,
  "batchNumber": "BATCH-2026-SHF500G",
  "harvestDate": "October 2026",
  "flavour": "Delicate Woody, Mild Vanilla & Golden Amber Undertones",
  "origin": "Dalbergia Sissoo Forest Reserves, Northern Foothills",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (500G)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Delicate Woody, Mild Vanilla & Golden Amber Undertones",
    "Net Weight": "500g",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-sheesham-honey-500g-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Sheesham Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-sheesham-honey-500g-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 500g glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-sheesham-honey-500g-1",
      "url": "/images/honey-brand/Sheesham Honey/500g/image_1_amazon_main.jpg",
      "altText": "Sheesham Honey 500g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-sheesham-honey-500g-2",
      "url": "/images/honey-brand/Sheesham Honey/500g/image_2_lifestyle.jpg",
      "altText": "Sheesham Honey 500g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-sheesham-honey-500g-3",
      "url": "/images/honey-brand/Sheesham Honey/500g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Sheesham Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-sheesham-honey-500g-4",
      "url": "/images/honey-brand/Sheesham Honey/500g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-sheesham-honey-1kg",
  "slug": "sheesham-honey-1kg",
  "sku": "GM-SHF-1KG",
  "name": "Sheesham Honey (1kg)",
  "description": "Rare single-origin raw honey harvested from blooming North Indian Rosewood canopies. Low glycemic index with a soothing smooth finish.",
  "price": 74900,
  "compareAtPrice": 99900,
  "costPrice": 31000,
  "categoryId": "cat-sheesham",
  "category": {
    "id": "cat-sheesham",
    "slug": "sheesham-honey",
    "name": "Raw Sheesham (Rosewood) Honey",
    "description": "Rare single-origin raw honey harvested from blooming North Indian Rosewood canopies. Low glycemic index with a soothing smooth finish.",
    "isVisible": true
  },
  "stockQuantity": 65,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "badge": "Best Value",
  "badgeColor": "amber",
  "rating": 4.9,
  "ratingCount": 867,
  "answeredQuestionsCount": 28,
  "weightGrams": 1000,
  "batchNumber": "BATCH-2026-SHF1KG",
  "harvestDate": "October 2026",
  "flavour": "Delicate Woody, Mild Vanilla & Golden Amber Undertones",
  "origin": "Dalbergia Sissoo Forest Reserves, Northern Foothills",
  "packageType": "Heavy Food-Safe Solid Glass Jar with Airtight Seal",
  "speciality": [
    "100% Raw & Unheated",
    "NMR Lab Tested (0% Sugar Syrup)",
    "Unpasteurized & Coarsely Filtered",
    "Preserved Live Bee Pollen",
    "Heavy Solid Glass (Microplastic-Free)"
  ],
  "aboutItems": [
    "【100% COLD-EXTRACTED RAW HONEY】: Single-origin raw honey harvested without heating above hive temperature (38°C), safeguarding living bio-enzymes.",
    "【GERMAN NMR 400MHz PURITY TESTED】: Molecularly fingerprinted to guarantee 0% adulteration, zero C3/C4 corn syrup, and zero antibiotics.",
    "【SOLID GLASS PACKAGING (1KG)】: Bottled exclusively in inert food-grade solid flint glass to prevent chemical leaching and protect volatile aromas.",
    "【NATURAL POLLEN & ENZYMES】: Retains beneficial natural floral pollen, propolis, and bio-available polyphenols.",
    "【LEGAL METROLOGY & FSSAI COMPLIANT】: Sealed with tamper-evident band, batch-level testing QR code, and standard net weight."
  ],
  "technicalDetails": {
    "Brand": "Ganesh Mule Pure Honey",
    "Flavour": "Delicate Woody, Mild Vanilla & Golden Amber Undertones",
    "Net Weight": "1kg",
    "Package Information": "Heavy Food-Grade Solid Glass Jar",
    "Item Form": "Raw Liquid with Natural Micro-Crystallization",
    "Diastase Activity": "High Active Enzyme Viability (>12 Schade)",
    "Moisture Content": "<18% (Compliant with FSSAI Honey Standards)",
    "Specialty": "Cold Extracted, Unheated, No Added Sugar, Zero Preservatives",
    "Country of Origin": "India",
    "Shelf Life": "24 Months (Indefinite if kept dry and sealed)"
  },
  "customerReviews": [
    {
      "id": "rev-sheesham-honey-1kg-1",
      "author": "Arun Kulkarni",
      "rating": 5,
      "title": "Exceptional aroma and authentic raw Sheesham Honey",
      "date": "12 November 2026",
      "verifiedPurchase": true,
      "content": "You can instantly taste the floral notes and natural goodness. The solid glass jar packaging arrived completely safe in protective cushioning. Highly recommended!",
      "helpfulCount": 34
    },
    {
      "id": "rev-sheesham-honey-1kg-2",
      "author": "Meera Sengupta",
      "rating": 5,
      "title": "True raw honey that naturally micro-crystallizes",
      "date": "04 November 2026",
      "verifiedPurchase": true,
      "content": "Delighted to find authentic Indian honey that isn't boiled or ultra-filtered sugar water. Great value in the 1kg glass jar.",
      "helpfulCount": 21
    }
  ],
  "qAndA": [
    {
      "question": "Is this honey heated or pasteurized during bottling?",
      "answer": "Never. Our honey is cold-extracted and coarsely strained through stainless mesh. It is never heated above ambient hive temperature to keep all active enzymes alive.",
      "votes": 45
    },
    {
      "question": "Is the glass jar safe during courier shipping?",
      "answer": "Yes! Every jar is shipped in 5-ply engineered shock-proof honeycomb kraft cushioning with a zero-breakage guarantee.",
      "votes": 38
    }
  ],
  "images": [
    {
      "id": "img-sheesham-honey-1kg-1",
      "url": "/images/honey-brand/Sheesham Honey/1kg/image_1_amazon_main.jpg",
      "altText": "Sheesham Honey 1kg Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-sheesham-honey-1kg-2",
      "url": "/images/honey-brand/Sheesham Honey/1kg/image_2_lifestyle.jpg",
      "altText": "Sheesham Honey 1kg Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-sheesham-honey-1kg-3",
      "url": "/images/honey-brand/Sheesham Honey/1kg/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Sheesham Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-sheesham-honey-1kg-4",
      "url": "/images/honey-brand/Sheesham Honey/1kg/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-wild-forest-300g",
  "slug": "wild-forest-raw-honey-300g",
  "sku": "HNY-WLD-300G",
  "name": "Wild Forest Raw Honey (300g)",
  "description": "Pure cold-extracted raw honey gathered from wild cliff bees in pristine deciduous forest canopies.",
  "price": 44900,
  "compareAtPrice": 59900,
  "costPrice": 24000,
  "categoryId": "cat-wild-forest",
  "stockQuantity": 65,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "weightGrams": 300,
  "images": [
    {
      "id": "img-forest-honey-250g-1",
      "url": "/images/honey-brand/Forest Honey/250g/image_1_amazon_main.jpg",
      "altText": "Forest Honey 250g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-forest-honey-250g-2",
      "url": "/images/honey-brand/Forest Honey/250g/image_2_lifestyle.jpg",
      "altText": "Forest Honey 250g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-forest-honey-250g-3",
      "url": "/images/honey-brand/Forest Honey/250g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Forest Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-forest-honey-250g-4",
      "url": "/images/honey-brand/Forest Honey/250g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-wild-forest-500g",
  "slug": "wild-forest-raw-honey-500g",
  "sku": "HNY-WLD-500G",
  "name": "Wild Forest Raw Honey (500g)",
  "description": "Flagship cold-extracted raw honey in solid glass jar.",
  "price": 39900,
  "compareAtPrice": 54900,
  "costPrice": 17000,
  "categoryId": "cat-wild-forest",
  "stockQuantity": 90,
  "reservedQuantity": 0,
  "lowStockThreshold": 15,
  "isPublished": true,
  "weightGrams": 500,
  "images": [
    {
      "id": "img-forest-honey-500g-1",
      "url": "/images/honey-brand/Forest Honey/500g/image_1_amazon_main.jpg",
      "altText": "Forest Honey 500g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-forest-honey-500g-2",
      "url": "/images/honey-brand/Forest Honey/500g/image_2_lifestyle.jpg",
      "altText": "Forest Honey 500g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-forest-honey-500g-3",
      "url": "/images/honey-brand/Forest Honey/500g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Forest Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-forest-honey-500g-4",
      "url": "/images/honey-brand/Forest Honey/500g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-wild-forest-750g",
  "slug": "wild-forest-raw-honey-750g",
  "sku": "HNY-WLD-750G",
  "name": "Wild Forest Raw Honey (750g)",
  "description": "Flagship cold-extracted raw honey in solid glass jar.",
  "price": 89900,
  "compareAtPrice": 119900,
  "costPrice": 48000,
  "categoryId": "cat-wild-forest",
  "stockQuantity": 92,
  "reservedQuantity": 0,
  "lowStockThreshold": 15,
  "isPublished": true,
  "weightGrams": 750,
  "images": [
    {
      "id": "img-forest-honey-500g-1",
      "url": "/images/honey-brand/Forest Honey/500g/image_1_amazon_main.jpg",
      "altText": "Forest Honey 500g Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-forest-honey-500g-2",
      "url": "/images/honey-brand/Forest Honey/500g/image_2_lifestyle.jpg",
      "altText": "Forest Honey 500g Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-forest-honey-500g-3",
      "url": "/images/honey-brand/Forest Honey/500g/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Forest Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-forest-honey-500g-4",
      "url": "/images/honey-brand/Forest Honey/500g/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
},
  {
  "id": "prod-wild-forest-1050g",
  "slug": "wild-forest-raw-honey-1050g",
  "sku": "HNY-WLD-1050G",
  "name": "Wild Forest Raw Honey (1050g)",
  "description": "Grand Harvest Reserve in heavy handcrafted solid glass.",
  "price": 119900,
  "compareAtPrice": 159900,
  "costPrice": 62000,
  "categoryId": "cat-wild-forest",
  "stockQuantity": 44,
  "reservedQuantity": 0,
  "lowStockThreshold": 10,
  "isPublished": true,
  "weightGrams": 1050,
  "images": [
    {
      "id": "img-forest-honey-1kg-1",
      "url": "/images/honey-brand/Forest Honey/1kg/image_1_amazon_main.jpg",
      "altText": "Forest Honey 1kg Amazon Main Studio Shot in Solid Glass",
      "position": 0
    },
    {
      "id": "img-forest-honey-1kg-2",
      "url": "/images/honey-brand/Forest Honey/1kg/image_2_lifestyle.jpg",
      "altText": "Forest Honey 1kg Lifestyle Photography on Teak Wood with Dipper",
      "position": 1
    },
    {
      "id": "img-forest-honey-1kg-3",
      "url": "/images/honey-brand/Forest Honey/1kg/image_3_texture.jpg",
      "altText": "Raw Unpasteurized Forest Honey Slow Micro-Drizzle Macro Texture",
      "position": 2
    },
    {
      "id": "img-forest-honey-1kg-4",
      "url": "/images/honey-brand/Forest Honey/1kg/image_6_size_comparison.jpg",
      "altText": "Ganesh Mule Raw Honey Trio Size Comparison (250g, 500g, 1kg)",
      "position": 3
    }
  ],
  "createdAt": "2026-11-20T14:28:59.683Z",
  "updatedAt": "2026-11-20T14:28:59.683Z"
}
];

export const MOCK_MANAGERS: ManagerAccount[] = [];

export const MOCK_ORDERS: OrderRecord[] = [];

export const MOCK_INVENTORY_MOVEMENTS: InventoryMovementRecord[] = [
  {
    id: 'mov-init-1',
    productId: 'prod-wild-forest-750g',
    productName: 'Wild Forest Raw Honey (750g)',
    sku: 'HNY-WLD-750G',
    delta: 92,
    quantityAfter: 92,
    reason: 'RESTOCK',
    referenceId: 'HARVEST-VALLEY-B26',
    actorId: 'usr-admin-1',
    actorName: 'Admin System',
    notes: 'Freshly bottled forest apiary harvest received in packaging facility',
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
];

export const MOCK_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'log-1',
    actorId: 'usr-admin-1',
    actorName: 'Super Administrator',
    actorEmail: 'admin@ganeshmule.com',
    action: 'INVENTORY_AUDIT_VERIFIED',
    entityType: 'Product',
    entityId: 'prod-wild-forest-750g',
    metadata: { batch: 'BATCH-2026-WF750', purityTest: 'NMR 100% Passed', status: 'Clean inventory baseline verified' },
    ipAddress: '192.168.1.10',
    createdAt: new Date().toISOString(),
  },
];

export const MOCK_ANALYTICS_REVENUE = [
  { day: 'Mon', revenue: 0, orders: 0 },
  { day: 'Tue', revenue: 0, orders: 0 },
  { day: 'Wed', revenue: 0, orders: 0 },
  { day: 'Thu', revenue: 0, orders: 0 },
  { day: 'Fri', revenue: 0, orders: 0 },
  { day: 'Sat', revenue: 0, orders: 0 },
  { day: 'Sun', revenue: 0, orders: 0 },
];

export const MOCK_COUPONS: DiscountCoupon[] = [
  {
    id: 'coup-royal-20',
    code: 'ROYAL20',
    description: '20% Executive Connoisseur Discount on orders above ₹1,999',
    discountType: 'PERCENTAGE',
    value: 20,
    minOrderAmount: 199900, // ₹1,999.00
    maxDiscountAmount: 100000, // Up to ₹1,000.00
    expiresAt: '2027-12-31T23:59:59Z',
    usageLimit: 200,
    usageCount: 0,
    isActive: true,
    isPublic: true, // Visible to shoppers on Refresh/View Offers
    assignedManagerIds: ['usr-mgr-1', 'usr-mgr-2'],
    assignedManagerNames: ['Vikram Mehta', 'Priya Sharma'],
    createdById: 'usr-admin-1',
    createdAt: '2026-01-20T09:00:00Z',
    updatedAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'coup-amber-10',
    code: 'AMBER10',
    description: '10% Welcome Discount on 100% Raw Forest Honey (Min ₹499)',
    discountType: 'PERCENTAGE',
    value: 10,
    minOrderAmount: 49900, // ₹499.00
    maxDiscountAmount: 30000, // Up to ₹300.00
    expiresAt: '2027-12-31T23:59:59Z',
    usageLimit: 1000,
    usageCount: 0,
    isActive: true,
    isPublic: true, // Visible to shoppers on Refresh/View Offers
    assignedManagerIds: ['usr-mgr-1', 'usr-mgr-2', 'usr-mgr-3'],
    assignedManagerNames: ['Vikram Mehta', 'Priya Sharma', 'Karan Patel'],
    createdById: 'usr-admin-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'coup-harvest-50',
    code: 'HARVEST50',
    description: 'Flat ₹50.00 Off Seasonal Harvest Courtesy (Min ₹499)',
    discountType: 'FIXED_AMOUNT',
    value: 5000, // ₹50.00
    minOrderAmount: 49900,
    maxDiscountAmount: null,
    expiresAt: '2027-12-31T23:59:59Z',
    usageLimit: 250,
    usageCount: 0,
    isActive: true,
    isPublic: true, // Visible to shoppers on Refresh/View Offers
    assignedManagerIds: ['usr-mgr-1'],
    assignedManagerNames: ['Vikram Mehta'],
    createdById: 'usr-admin-1',
    createdAt: '2026-03-01T14:00:00Z',
    updatedAt: '2026-03-01T14:00:00Z',
  },
  {
    id: 'coup-vikram-15',
    code: 'VIKRAM15',
    description: '15% Off VIP Customer Courtesy (Exclusive Direct Code)',
    discountType: 'PERCENTAGE',
    value: 15,
    minOrderAmount: 99900, // ₹999.00
    maxDiscountAmount: 50000, // Up to ₹500.00
    expiresAt: '2027-12-31T23:59:59Z',
    usageLimit: 500,
    usageCount: 0,
    isActive: true,
    isPublic: false, // Hidden - direct promo code only
    assignedManagerIds: ['usr-mgr-1'],
    assignedManagerNames: ['Vikram Mehta'],
    createdById: 'usr-admin-1',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-03-15T12:00:00Z',
  },
  {
    id: 'coup-priya-200',
    code: 'PRIYA200',
    description: 'Flat ₹200.00 Off on Artisanal Honey Reserves (Exclusive Direct Code)',
    discountType: 'FIXED_AMOUNT',
    value: 20000, // ₹200.00
    minOrderAmount: 129900, // ₹1,299.00
    maxDiscountAmount: null,
    expiresAt: '2027-12-31T23:59:59Z',
    usageLimit: 300,
    usageCount: 0,
    isActive: true,
    isPublic: false, // Hidden - direct promo code only
    assignedManagerIds: ['usr-mgr-2'],
    assignedManagerNames: ['Priya Sharma'],
    createdById: 'usr-admin-1',
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-03-20T15:30:00Z',
  },
];
