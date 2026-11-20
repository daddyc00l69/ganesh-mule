import { PrismaClient } from '@prisma/client';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt${'$'}${salt}${'$'}${derivedKey.toString('hex')}`;
}

const varieties = [
  {
    id: 'cat-forest',
    slug: 'forest-honey',
    name: 'Forest Honey',
    categoryName: 'Wild Forest Raw Honey',
    folderName: 'Forest Honey',
    skuPrefix: 'GM-FOR',
    flavour: 'Multifloral Forest Blossom with Warm Floral Caramel Finish',
    origin: 'Western Ghats Deciduous Canopies, Maharashtra',
    description: 'Pure cold-extracted raw honey gathered from wild Apis dorsata cliff bees in pristine deciduous forest canopies. Bottled exclusively in thick, food-grade solid glass to safeguard delicate aromatic polyphenols and active living enzymes.',
  },
  {
    id: 'cat-sesame',
    slug: 'sesame-honey',
    name: 'Sesame Honey',
    categoryName: 'Pure Sesame Blossom Honey',
    folderName: 'Sesame Honey',
    skuPrefix: 'GM-SES',
    flavour: 'Nutty, Warm Sesame Flora with Mild Sweet Aftertaste',
    origin: 'Solapur & Marathwada Sesame Groves, Maharashtra',
    description: 'Single-origin unheated honey harvested during peak sesame flowering. Naturally high in zinc, calcium minerals, and antioxidant flavonoids.',
  },
  {
    id: 'cat-ajwain',
    slug: 'ajwain-honey',
    name: 'Ajwain Honey',
    categoryName: 'Organic Ajwain (Carom) Honey',
    folderName: 'Ajwain Honey',
    skuPrefix: 'GM-AJW',
    flavour: 'Herbal, Pungent & Warm Digestive Carom Notes',
    origin: 'Organic Carom Seed Farms, Rajasthan & Gujarat',
    description: 'Distinctive raw honey harvested from white carom flowers. Celebrated in Ayurveda for respiratory comfort, gut health, and soothing digestion.',
  },
  {
    id: 'cat-saunf',
    slug: 'saunf-honey',
    name: 'Saunf (Fennel) Honey',
    categoryName: 'Raw Saunf (Fennel) Honey',
    folderName: 'Saunf Honey',
    skuPrefix: 'GM-SAU',
    flavour: 'Sweet Licorice & Refreshing Aniseed Notes',
    origin: 'Fennel Apiaries, Saurashtra, Gujarat',
    description: 'Aromatic unpasteurized raw honey harvested from sweet fennel blooms. Imparts a naturally cooling aftertaste and soothing herbal benefits.',
  },
  {
    id: 'cat-multiflora',
    slug: 'multiflora-honey',
    name: 'Multiflora Honey',
    categoryName: 'Wild Multiflora Raw Honey',
    folderName: 'Multiflora Honey',
    skuPrefix: 'GM-MUL',
    flavour: 'Complex Bouquet of Hundreds of Wild Meadows & Herbs',
    origin: 'Satpura Alpine Meadows & Forest Foothills',
    description: 'Harmonious multifloral nectar gathered by bees foraging across dozens of seasonal medicinal herbs and seasonal forest blossoms.',
  },
  {
    id: 'cat-ber',
    slug: 'ber-honey',
    name: 'Ber (Sidr) Honey',
    categoryName: 'Raw Ber (Sidr / Jujube) Honey',
    folderName: 'Ber Honey',
    skuPrefix: 'GM-BER',
    flavour: 'Rich, Butterscotch & Molasses-like Velvety Sweetness',
    origin: 'Wild Jujube Forests, Bikaner & Thar Border',
    description: 'Revered Sidr honey harvested from thorny desert jujube trees. Uniquely rich in bioactive polyphenols and amber antioxidants.',
  },
  {
    id: 'cat-sheesham',
    slug: 'sheesham-honey',
    name: 'Sheesham Honey',
    categoryName: 'Raw Sheesham (Rosewood) Honey',
    folderName: 'Sheesham Honey',
    skuPrefix: 'GM-SHF',
    flavour: 'Delicate Woody, Mild Vanilla & Golden Amber Undertones',
    origin: 'Dalbergia Sissoo Forest Reserves, Northern Foothills',
    description: 'Rare single-origin raw honey harvested from blooming North Indian Rosewood canopies. Low glycemic index with a soothing smooth finish.',
  },
];

const packageSizes = [
  {
    weight: '250g',
    price: 19900,
    compareAtPrice: 27500,
    costPrice: 9500,
    skuSuffix: '250G',
    stock: 80,
  },
  {
    weight: '500g',
    price: 39900,
    compareAtPrice: 54900,
    costPrice: 17000,
    skuSuffix: '500G',
    stock: 120,
  },
  {
    weight: '1kg',
    price: 74900,
    compareAtPrice: 99900,
    costPrice: 31000,
    skuSuffix: '1KG',
    stock: 65,
  },
];

async function main() {
  console.log('🌱 Starting Ganesh Mule Raw Honey Database Seed...');

  // 1. Initial Store Settings
  await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    update: {
      storeName: 'Ganesh Mule Pure Honey',
      currency: 'INR',
      currencySymbol: '₹',
      supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@devtushar.uk',
      taxRatePercent: 5.0, // 5% GST for raw natural honey in India
      shippingFlatRate: 4900, // ₹49.00
      freeShippingAbove: 99900, // Free delivery above ₹999
      chatwootEnabled: true,
    },
    create: {
      id: 'singleton',
      storeName: 'Ganesh Mule Pure Honey',
      currency: 'INR',
      currencySymbol: '₹',
      supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@devtushar.uk',
      taxRatePercent: 5.0,
      shippingFlatRate: 4900,
      freeShippingAbove: 99900,
      chatwootEnabled: true,
    },
  });
  console.log('✔ Initialized Ganesh Mule Store Settings');

  // 2. Super Admin Account
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@devtushar.uk').toLowerCase();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456';
  const adminHash = await hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: adminEmail,
      name: 'Tushar (Super Administrator)',
      passwordHash: adminHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✔ Seeded Admin account: ${admin.email}`);

  // 3. Store Manager Account
  const managerEmail = 'manager@devtushar.uk';
  const managerPassword = 'Manager@123456';
  const managerHash = await hashPassword(managerPassword);

  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {
      role: 'MANAGER',
      isActive: true,
    },
    create: {
      email: managerEmail,
      name: 'Operations Manager',
      passwordHash: managerHash,
      role: 'MANAGER',
      isActive: true,
      managerProfile: {
        create: {
          department: 'Fulfillment & Operations',
          permissions: [
            'orders.read',
            'orders.update',
            'inventory.read',
            'inventory.update',
            'coupons.read',
            'coupons.manage',
            'support.manage',
            'reports.view',
          ],
          notes: 'Lead warehouse and logistics operations supervisor',
        },
      },
    },
  });
  console.log(`✔ Seeded Manager account: ${manager.email}`);

  // 4. Categories (7 Honey Varieties + Legacy Category)
  const legacyCat = await prisma.category.upsert({
    where: { slug: 'wild-forest-raw' },
    update: {
      name: 'Wild Forest Raw Honey',
      description: 'Cold-extracted multifloral nectar gathered by wild forest bees in deep alpine and deciduous reserves.',
      isVisible: true,
    },
    create: {
      id: 'cat-wild-forest',
      slug: 'wild-forest-raw',
      name: 'Wild Forest Raw Honey',
      description: 'Cold-extracted multifloral nectar gathered by wild forest bees in deep alpine and deciduous reserves.',
      isVisible: true,
    },
  });

  const categoryMap = new Map();
  categoryMap.set('cat-wild-forest', legacyCat);

  for (const v of varieties) {
    const cat = await prisma.category.upsert({
      where: { slug: v.slug },
      update: {
        name: v.categoryName,
        description: v.description,
        isVisible: true,
      },
      create: {
        id: v.id,
        slug: v.slug,
        name: v.categoryName,
        description: v.description,
        isVisible: true,
      },
    });
    categoryMap.set(v.id, cat);
  }
  console.log(`✔ Seeded ${varieties.length + 1} Categories`);

  // 5. Seed 21 Products (7 Varieties × 3 Sizes)
  let productCount = 0;
  for (const v of varieties) {
    for (const s of packageSizes) {
      const slug = `${v.slug}-${s.weight}`;
      const sku = `${v.skuPrefix}-${s.skuSuffix}`;
      const name = `${v.name} (${s.weight})`;

      const prod = await prisma.product.upsert({
        where: { sku },
        update: {
          name,
          slug,
          description: v.description,
          price: s.price,
          compareAtPrice: s.compareAtPrice,
          costPrice: s.costPrice,
          categoryId: v.id,
          stockQuantity: s.stock,
          isPublished: true,
        },
        create: {
          id: `prod-${v.slug}-${s.weight}`,
          name,
          slug,
          sku,
          description: v.description,
          price: s.price,
          compareAtPrice: s.compareAtPrice,
          costPrice: s.costPrice,
          categoryId: v.id,
          stockQuantity: s.stock,
          isPublished: true,
        },
      });

      // Images
      const imgUrls = [
        { url: `/images/honey-brand/${v.folderName}/${s.weight}/image_1_amazon_main.jpg`, alt: `${name} Amazon Main` },
        { url: `/images/honey-brand/${v.folderName}/${s.weight}/image_2_lifestyle.jpg`, alt: `${name} Lifestyle` },
        { url: `/images/honey-brand/${v.folderName}/${s.weight}/image_3_texture.jpg`, alt: `${name} Texture Macro` },
        { url: `/images/honey-brand/${v.folderName}/${s.weight}/image_6_size_comparison.jpg`, alt: `${name} Size Comparison` },
      ];

      for (let i = 0; i < imgUrls.length; i++) {
        const item = imgUrls[i];
        const existing = await prisma.productImage.findFirst({
          where: { productId: prod.id, position: i },
        });
        if (!existing) {
          await prisma.productImage.create({
            data: {
              productId: prod.id,
              url: item.url,
              altText: item.alt,
              position: i,
            },
          });
        }
      }
      productCount++;
    }
  }

  // 6. Seed Legacy products for compatibility
  const legacyProducts = [
    {
      id: 'prod-wild-forest-300g',
      slug: 'wild-forest-raw-honey-300g',
      sku: 'HNY-WLD-300G',
      name: 'Wild Forest Raw Honey (300g)',
      description: 'Pure cold-extracted raw honey in solid glass jar.',
      price: 44900,
      compareAtPrice: 59900,
      costPrice: 24000,
      categoryId: 'cat-wild-forest',
      stockQuantity: 65,
    },
    {
      id: 'prod-wild-forest-750g',
      slug: 'wild-forest-raw-honey-750g',
      sku: 'HNY-WLD-750G',
      name: 'Wild Forest Raw Honey (750g)',
      description: 'Flagship cold-extracted raw honey in solid glass jar.',
      price: 89900,
      compareAtPrice: 119900,
      costPrice: 48000,
      categoryId: 'cat-wild-forest',
      stockQuantity: 92,
    },
    {
      id: 'prod-wild-forest-1050g',
      slug: 'wild-forest-raw-honey-1050g',
      sku: 'HNY-WLD-1050G',
      name: 'Wild Forest Raw Honey (1050g)',
      description: 'Grand Harvest Reserve in solid glass.',
      price: 119900,
      compareAtPrice: 159900,
      costPrice: 62000,
      categoryId: 'cat-wild-forest',
      stockQuantity: 44,
    },
  ];

  for (const lp of legacyProducts) {
    await prisma.product.upsert({
      where: { sku: lp.sku },
      update: lp,
      create: {
        ...lp,
        isPublished: true,
      },
    });
  }

  console.log(`✔ Seeded ${productCount} Ganesh Mule Honey Products across 7 Varieties (250g, 500g, 1kg)!`);
  console.log('✅ Ganesh Mule Database Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
