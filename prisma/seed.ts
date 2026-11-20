import { PrismaClient } from '@prisma/client';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

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

  // 4. Categories
  const category = await prisma.category.upsert({
    where: { slug: 'wild-forest-raw' },
    update: {
      name: 'Wild Forest Raw Honey',
      description:
        'Cold-extracted multifloral nectar gathered by wild forest bees in deep alpine and deciduous reserves.',
      isVisible: true,
    },
    create: {
      id: 'cat-wild-forest',
      slug: 'wild-forest-raw',
      name: 'Wild Forest Raw Honey',
      description:
        'Cold-extracted multifloral nectar gathered by wild forest bees in deep alpine and deciduous reserves.',
      isVisible: true,
    },
  });
  console.log(`✔ Seeded Category: ${category.name}`);

  // 5. Products in Heavy Solid Glass
  const products = [
    {
      id: 'prod-wild-forest-300g',
      slug: 'wild-forest-raw-honey-300g',
      sku: 'HNY-WLD-300G',
      name: 'Wild Forest Raw Honey (300g)',
      description:
        'Pure cold-extracted raw honey gathered from wild Apis dorsata cliff bees in pristine deciduous forest canopies. Bottled exclusively in thick, food-grade solid glass to safeguard delicate aromatic polyphenols and active living enzymes.',
      price: 44900, // ₹449.00
      compareAtPrice: 59900,
      costPrice: 24000,
      categoryId: category.id,
      stockQuantity: 65,
      reservedQuantity: 0,
      lowStockThreshold: 10,
      isPublished: true,
      imageUrl: '/images/products/wild-forest-honey.jpg',
    },
    {
      id: 'prod-wild-forest-750g',
      slug: 'wild-forest-raw-honey-750g',
      sku: 'HNY-WLD-750G',
      name: 'Wild Forest Raw Honey (750g)',
      description:
        'Our flagship harvest. Unpasteurized, unfiltered, cold-extracted raw honey gathered from wild Apis dorsata cliff bees in pristine deciduous forest canopies. Rich in natural bio-active enzymes, pollen, and propolis with a warm floral body and deep butterscotch finish in solid glass packaging.',
      price: 89900, // ₹899.00
      compareAtPrice: 119900,
      costPrice: 48000,
      categoryId: category.id,
      stockQuantity: 92,
      reservedQuantity: 0,
      lowStockThreshold: 15,
      isPublished: true,
      imageUrl: '/images/products/himalayan-acacia-honey.jpg',
    },
    {
      id: 'prod-wild-forest-1050g',
      slug: 'wild-forest-raw-honey-1050g',
      sku: 'HNY-WLD-1050G',
      name: 'Wild Forest Raw Honey (1050g)',
      description:
        'Grand Harvest Reserve (1.05 kg) in heavy handcrafted solid glass. Perfect for daily family Ayurvedic wellness, tea, and warm morning elixirs. Coarsely strained through cheesecloth to retain living bio-enzymes, polyphenols, and wildflower pollen.',
      price: 119900, // ₹1,199.00
      compareAtPrice: 159900,
      costPrice: 62000,
      categoryId: category.id,
      stockQuantity: 44,
      reservedQuantity: 0,
      lowStockThreshold: 10,
      isPublished: true,
      imageUrl: '/images/products/sunderbans-honey.jpg',
    },
  ];

  for (const prod of products) {
    const { imageUrl, ...prodData } = prod;
    const upserted = await prisma.product.upsert({
      where: { sku: prodData.sku },
      update: prodData,
      create: prodData,
    });

    // Seed product image
    const existingImg = await prisma.productImage.findFirst({
      where: { productId: upserted.id },
    });
    if (!existingImg) {
      await prisma.productImage.create({
        data: {
          productId: upserted.id,
          url: imageUrl,
          altText: upserted.name,
          position: 0,
        },
      });
    }
  }
  console.log(`✔ Seeded ${products.length} Ganesh Mule Raw Honey Products`);

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
