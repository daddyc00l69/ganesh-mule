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
  console.log('🌱 Starting Solid Glass E-Commerce Database Seed...');

  // 1. Initial Store Settings
  await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      storeName: 'Solid Glass Commerce',
      currency: 'INR',
      currencySymbol: '₹',
      supportEmail: 'support@solidglass.com',
      taxRatePercent: 18.0,
      shippingFlatRate: 5000, // ₹50.00
      freeShippingAbove: 99900, // ₹999.00
      chatwootEnabled: true,
    },
  });
  console.log('✔ Initialized Store Settings');

  // 2. Initial Admin Account Provisioning
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@solidglass.com';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456';
  const adminHash = await hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Super Administrator',
      passwordHash: adminHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✔ Seeded Admin account: ${admin.email}`);

  // 3. Initial Manager Account Provisioning
  const managerEmail = 'operations@solidglass.com';
  const managerPassword = 'Manager@123456';
  const managerHash = await hashPassword(managerPassword);

  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {},
    create: {
      email: managerEmail,
      name: 'Vikram Mehta',
      passwordHash: managerHash,
      role: 'MANAGER',
      isActive: true,
      managerProfile: {
        create: {
          department: 'Fulfillment & Logistics',
          permissions: [
            'orders.read',
            'orders.update',
            'inventory.read',
            'inventory.update',
            'support.manage',
            'refunds.request',
          ],
          notes: 'Lead warehouse operations supervisor',
        },
      },
    },
  });
  console.log(`✔ Seeded Manager account: ${manager.email}`);

  // 4. Initial Categories
  const categories = [
    {
      id: 'cat-1',
      slug: 'mechanical-keyboards',
      name: 'Mechanical Keyboards',
      description: 'Precision engineered custom typing instruments with smoky acrylic and frosted polycarbonate cases.',
    },
    {
      id: 'cat-2',
      slug: 'desk-pads',
      name: 'Felt & Glass Desk Pads',
      description: 'High-density micro-etched tempered glass and natural merino wool desk mats.',
    },
    {
      id: 'cat-3',
      slug: 'audio-monitors',
      name: 'Studio Audio Monitors',
      description: 'Acoustically neutral planar magnetic monitors and frosted aluminum headphone stands.',
    },
    {
      id: 'cat-4',
      slug: 'workspace-lighting',
      name: 'Diffused Workspace Lighting',
      description: 'High CRI 98+ linear beam light bars with brass and glass counterweights.',
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✔ Seeded ${categories.length} Categories`);

  // 5. Initial Products
  const products = [
    {
      id: 'prod-1',
      slug: 'lumina-65-smoky-glass-keyboard',
      sku: 'LUM-65-SMK',
      name: 'Lumina 65 Smoky Glass Custom Keyboard',
      description:
        'Gasket-mounted 65% mechanical keyboard featuring semi-translucent CNC smoked polycarbonate chassis, brass weight bar, and custom tuned linear switches.',
      price: 1899900, // ₹18,999.00
      compareAtPrice: 2249900,
      costPrice: 950000,
      categoryId: 'cat-1',
      stockQuantity: 18,
      reservedQuantity: 2,
      lowStockThreshold: 5,
      isPublished: true,
    },
    {
      id: 'prod-2',
      slug: 'aurora-etched-glass-mousepad',
      sku: 'AUR-GLS-PAD',
      name: 'Aurora Etched Tempered Glass Mousepad',
      description:
        'Ultra-smooth micro-textured silica surface for pixel-perfect tracking speed with minimal friction. Full silicone damping base.',
      price: 549900, // ₹5,499.00
      compareAtPrice: 699900,
      costPrice: 220000,
      categoryId: 'cat-2',
      stockQuantity: 42,
      reservedQuantity: 4,
      lowStockThreshold: 10,
      isPublished: true,
    },
    {
      id: 'prod-3',
      slug: 'chroma-linear-desk-light',
      sku: 'CHR-LGT-01',
      name: 'Chroma Horizon Linear Light Bar',
      description:
        'Asymmetric optical light bar with 98+ CRI daylight reproduction, touch sensor brass dimmer, and dual ambient backlight.',
      price: 899900, // ₹8,999.00
      compareAtPrice: 1099900,
      costPrice: 420000,
      categoryId: 'cat-4',
      stockQuantity: 4,
      reservedQuantity: 1,
      lowStockThreshold: 6,
      isPublished: true,
    },
    {
      id: 'prod-4',
      slug: 'planar-reference-headphones',
      sku: 'PLN-AUD-REF',
      name: 'Vessel Open-Back Planar Headphones',
      description:
        'Audiophile-grade open-back planar magnetic transducers housed in machined anodized aluminum and memory-foam velour cushions.',
      price: 2999900, // ₹29,999.00
      compareAtPrice: 3499900,
      costPrice: 1600000,
      categoryId: 'cat-3',
      stockQuantity: 9,
      reservedQuantity: 0,
      lowStockThreshold: 3,
      isPublished: true,
    },
    {
      id: 'prod-5',
      slug: 'solis-solid-brass-knob',
      sku: 'SOL-BRS-KNB',
      name: 'Solis Machined Brass Rotary Dial',
      description:
        'Heavy solid brass volume controller with high-precision stepped optical encoder and braided silicone USB-C cable.',
      price: 349900, // ₹3,499.00
      compareAtPrice: 429900,
      costPrice: 130000,
      categoryId: 'cat-1',
      stockQuantity: 2,
      reservedQuantity: 0,
      lowStockThreshold: 5,
      isPublished: true,
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {},
      create: prod,
    });
  }
  console.log(`✔ Seeded ${products.length} Products`);

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
