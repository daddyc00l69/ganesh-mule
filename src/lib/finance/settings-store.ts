/**
 * Platform Financial Settings & Business Profile Store
 * Centralized database-backed persistence with disk failover & immutable audit trail.
 */

import { prisma, isDatabaseOnline } from '@/lib/db';
import { readPersistedJson, writePersistedJson } from '@/lib/storage/json-store';

export interface PlatformFinanceConfig {
  id: string;
  version: number;
  platformFeeEnabled: boolean;
  feeType: 'FIXED' | 'PERCENTAGE';
  fixedFeePaise: number;
  feePercent: number;
  minFeePaise: number;
  maxFeePaise: number;
  platformGstEnabled: boolean;
  platformGstRate: number;
  platformGstInclusive: boolean;
  customerDisclosed: boolean;
  clientVisible: boolean;

  deliveryEnabled: boolean;
  deliveryFeePaise: number;
  deliveryGstRate: number;
  deliveryGstEnabled: boolean;
  deliveryGstInclusive: boolean;
  deliveryClientVisible: boolean;
  deliveryCustomerDisclosed: boolean;

  defaultProductGstRate: number;
  productPricesGstInclusive: boolean;

  showPlatformFeeToClient: boolean;
  showPlatformGstToClient: boolean;
  showDeliveryToClient: boolean;
  showDeliveryGstToClient: boolean;
  showProductGstBreakdown: boolean;
  showPlatformRevenueAnalytics: boolean;
  showPlatformTransactions: boolean;

  effectiveFrom: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PlatformBusinessProfileConfig {
  id: string;
  legalName: string;
  tradeName?: string | null;
  gstin?: string | null;
  pan?: string | null;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  email: string;
  phone: string;
  invoicePrefix: string;
  nextInvoiceSeq: number;
  updatedAt: string;
}

export const DEFAULT_PLATFORM_FINANCE_CONFIG: PlatformFinanceConfig = {
  id: 'singleton',
  version: 1,
  platformFeeEnabled: true,
  feeType: 'FIXED',
  fixedFeePaise: 3000, // ₹30.00
  feePercent: 2.5,
  minFeePaise: 1000, // ₹10.00
  maxFeePaise: 10000, // ₹100.00
  platformGstEnabled: true,
  platformGstRate: 18.0,
  platformGstInclusive: false,
  customerDisclosed: true,
  clientVisible: false,

  deliveryEnabled: true,
  deliveryFeePaise: 7000, // ₹70.00
  deliveryGstRate: 18.0,
  deliveryGstEnabled: true,
  deliveryGstInclusive: false,
  deliveryClientVisible: true,
  deliveryCustomerDisclosed: true,

  defaultProductGstRate: 5.0, // 5% for honey HSN 0409
  productPricesGstInclusive: true,

  showPlatformFeeToClient: false,
  showPlatformGstToClient: false,
  showDeliveryToClient: true,
  showDeliveryGstToClient: true,
  showProductGstBreakdown: true,
  showPlatformRevenueAnalytics: false,
  showPlatformTransactions: false,

  effectiveFrom: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  updatedBy: 'System Initializer',
};

export const DEFAULT_BUSINESS_PROFILE: PlatformBusinessProfileConfig = {
  id: 'singleton',
  legalName: 'DevTushar Software & Platform Technologies',
  tradeName: 'Ganesh Mule Tech Platform',
  gstin: null,
  pan: null,
  address: 'Tech Park Hub, Station Road',
  city: 'Pandharpur',
  state: 'Maharashtra',
  stateCode: '27',
  pincode: '413304',
  email: 'auth@devtushar.uk',
  phone: '+91 98765 43210',
  invoicePrefix: 'PINV',
  nextInvoiceSeq: 1001,
  updatedAt: new Date().toISOString(),
};

const SETTINGS_CACHE_FILE = 'platform-finance-settings.json';
const PROFILE_CACHE_FILE = 'platform-business-profile.json';

/**
 * Loads current authoritative platform finance settings.
 */
export async function getPlatformFinanceSettings(): Promise<PlatformFinanceConfig> {
  const dbOnline = await isDatabaseOnline();
  if (dbOnline) {
    try {
      const record = await prisma.platformFinanceSettings.findUnique({
        where: { id: 'singleton' },
      });
      if (record) {
        const mapped: PlatformFinanceConfig = {
          ...record,
          feeType: record.feeType as 'FIXED' | 'PERCENTAGE',
          effectiveFrom: record.effectiveFrom.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        };
        // Update local disk cache
        writePersistedJson(SETTINGS_CACHE_FILE, mapped);
        return mapped;
      }
      // If table empty, initialize with default
      const initialized = await prisma.platformFinanceSettings.create({
        data: {
          id: 'singleton',
          version: 1,
          platformFeeEnabled: DEFAULT_PLATFORM_FINANCE_CONFIG.platformFeeEnabled,
          feeType: DEFAULT_PLATFORM_FINANCE_CONFIG.feeType,
          fixedFeePaise: DEFAULT_PLATFORM_FINANCE_CONFIG.fixedFeePaise,
          feePercent: DEFAULT_PLATFORM_FINANCE_CONFIG.feePercent,
          minFeePaise: DEFAULT_PLATFORM_FINANCE_CONFIG.minFeePaise,
          maxFeePaise: DEFAULT_PLATFORM_FINANCE_CONFIG.maxFeePaise,
          platformGstEnabled: DEFAULT_PLATFORM_FINANCE_CONFIG.platformGstEnabled,
          platformGstRate: DEFAULT_PLATFORM_FINANCE_CONFIG.platformGstRate,
          platformGstInclusive: DEFAULT_PLATFORM_FINANCE_CONFIG.platformGstInclusive,
          customerDisclosed: DEFAULT_PLATFORM_FINANCE_CONFIG.customerDisclosed,
          clientVisible: DEFAULT_PLATFORM_FINANCE_CONFIG.clientVisible,
          deliveryEnabled: DEFAULT_PLATFORM_FINANCE_CONFIG.deliveryEnabled,
          deliveryFeePaise: DEFAULT_PLATFORM_FINANCE_CONFIG.deliveryFeePaise,
          deliveryGstRate: DEFAULT_PLATFORM_FINANCE_CONFIG.deliveryGstRate,
          deliveryGstEnabled: DEFAULT_PLATFORM_FINANCE_CONFIG.deliveryGstEnabled,
          deliveryGstInclusive: DEFAULT_PLATFORM_FINANCE_CONFIG.deliveryGstInclusive,
          deliveryClientVisible: DEFAULT_PLATFORM_FINANCE_CONFIG.deliveryClientVisible,
          deliveryCustomerDisclosed: DEFAULT_PLATFORM_FINANCE_CONFIG.deliveryCustomerDisclosed,
          defaultProductGstRate: DEFAULT_PLATFORM_FINANCE_CONFIG.defaultProductGstRate,
          productPricesGstInclusive: DEFAULT_PLATFORM_FINANCE_CONFIG.productPricesGstInclusive,
          showPlatformFeeToClient: DEFAULT_PLATFORM_FINANCE_CONFIG.showPlatformFeeToClient,
          showPlatformGstToClient: DEFAULT_PLATFORM_FINANCE_CONFIG.showPlatformGstToClient,
          showDeliveryToClient: DEFAULT_PLATFORM_FINANCE_CONFIG.showDeliveryToClient,
          showDeliveryGstToClient: DEFAULT_PLATFORM_FINANCE_CONFIG.showDeliveryGstToClient,
          showProductGstBreakdown: DEFAULT_PLATFORM_FINANCE_CONFIG.showProductGstBreakdown,
          showPlatformRevenueAnalytics: DEFAULT_PLATFORM_FINANCE_CONFIG.showPlatformRevenueAnalytics,
          showPlatformTransactions: DEFAULT_PLATFORM_FINANCE_CONFIG.showPlatformTransactions,
          updatedBy: 'System Auto-Seed',
        },
      });
      const mapped: PlatformFinanceConfig = {
        ...initialized,
        feeType: initialized.feeType as 'FIXED' | 'PERCENTAGE',
        effectiveFrom: initialized.effectiveFrom.toISOString(),
        updatedAt: initialized.updatedAt.toISOString(),
      };
      writePersistedJson(SETTINGS_CACHE_FILE, mapped);
      return mapped;
    } catch (err) {
      console.warn('[PlatformFinance] Error querying database, falling back to disk cache:', err);
    }
  }

  // Fallback to disk cache
  const cached = readPersistedJson<PlatformFinanceConfig>(SETTINGS_CACHE_FILE);
  if (cached) return cached;

  return { ...DEFAULT_PLATFORM_FINANCE_CONFIG };
}

/**
 * Updates platform finance settings with version increment, snapshot recording, and audit logging.
 */
export async function updatePlatformFinanceSettings(
  updates: Partial<PlatformFinanceConfig>,
  actor: { id?: string; email: string; role: string; reason?: string; ipAddress?: string }
): Promise<PlatformFinanceConfig> {
  const current = await getPlatformFinanceSettings();
  const nextVersion = current.version + 1;
  const now = new Date();

  const merged: PlatformFinanceConfig = {
    ...current,
    ...updates,
    version: nextVersion,
    updatedAt: now.toISOString(),
    updatedBy: actor.email,
  };

  const dbOnline = await isDatabaseOnline();
  if (dbOnline) {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Update settings singleton
        await tx.platformFinanceSettings.upsert({
          where: { id: 'singleton' },
          create: {
            ...merged,
            effectiveFrom: new Date(merged.effectiveFrom),
            updatedAt: now,
          },
          update: {
            ...merged,
            effectiveFrom: new Date(merged.effectiveFrom),
            updatedAt: now,
          },
        });

        // 2. Insert into history
        await tx.platformFinanceSettingsHistory.create({
          data: {
            version: nextVersion,
            snapshot: merged as any,
            effectiveFrom: new Date(merged.effectiveFrom),
            reason: actor.reason || 'Configuration updated via Developer Control Centre',
            updatedBy: actor.email,
          },
        });

        // 3. Append to audit log
        await tx.platformFinancialAuditLog.create({
          data: {
            actorId: actor.id || null,
            actorEmail: actor.email,
            actorRole: actor.role,
            category: 'FINANCIAL_SETTINGS',
            action: 'UPDATE_PLATFORM_SETTINGS',
            previousState: current as any,
            newState: merged as any,
            reason: actor.reason || null,
            ipAddress: actor.ipAddress || null,
          },
        });
      });
    } catch (err) {
      console.error('[PlatformFinance] Transaction failed during settings update:', err);
    }
  }

  // Always write to disk cache
  writePersistedJson(SETTINGS_CACHE_FILE, merged);
  return merged;
}

/**
 * Loads platform business profile for platform invoicing.
 */
export async function getPlatformBusinessProfile(): Promise<PlatformBusinessProfileConfig> {
  const dbOnline = await isDatabaseOnline();
  if (dbOnline) {
    try {
      const record = await prisma.platformBusinessProfile.findUnique({
        where: { id: 'singleton' },
      });
      if (record) {
        const mapped: PlatformBusinessProfileConfig = {
          ...record,
          updatedAt: record.updatedAt.toISOString(),
        };
        writePersistedJson(PROFILE_CACHE_FILE, mapped);
        return mapped;
      }
      const created = await prisma.platformBusinessProfile.create({
        data: {
          id: 'singleton',
          legalName: DEFAULT_BUSINESS_PROFILE.legalName,
          tradeName: DEFAULT_BUSINESS_PROFILE.tradeName,
          gstin: DEFAULT_BUSINESS_PROFILE.gstin,
          pan: DEFAULT_BUSINESS_PROFILE.pan,
          address: DEFAULT_BUSINESS_PROFILE.address,
          city: DEFAULT_BUSINESS_PROFILE.city,
          state: DEFAULT_BUSINESS_PROFILE.state,
          stateCode: DEFAULT_BUSINESS_PROFILE.stateCode,
          pincode: DEFAULT_BUSINESS_PROFILE.pincode,
          email: DEFAULT_BUSINESS_PROFILE.email,
          phone: DEFAULT_BUSINESS_PROFILE.phone,
          invoicePrefix: DEFAULT_BUSINESS_PROFILE.invoicePrefix,
          nextInvoiceSeq: DEFAULT_BUSINESS_PROFILE.nextInvoiceSeq,
        },
      });
      const mapped: PlatformBusinessProfileConfig = {
        ...created,
        updatedAt: created.updatedAt.toISOString(),
      };
      writePersistedJson(PROFILE_CACHE_FILE, mapped);
      return mapped;
    } catch {}
  }

  const cached = readPersistedJson<PlatformBusinessProfileConfig>(PROFILE_CACHE_FILE);
  if (cached) return cached;
  return { ...DEFAULT_BUSINESS_PROFILE };
}

/**
 * Updates platform business profile.
 */
export async function updatePlatformBusinessProfile(
  updates: Partial<PlatformBusinessProfileConfig>,
  actor: { id?: string; email: string; role: string; reason?: string; ipAddress?: string }
): Promise<PlatformBusinessProfileConfig> {
  const current = await getPlatformBusinessProfile();
  const merged: PlatformBusinessProfileConfig = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const dbOnline = await isDatabaseOnline();
  if (dbOnline) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.platformBusinessProfile.upsert({
          where: { id: 'singleton' },
          create: {
            ...merged,
            updatedAt: new Date(),
          },
          update: {
            ...merged,
            updatedAt: new Date(),
          },
        });

        await tx.platformFinancialAuditLog.create({
          data: {
            actorId: actor.id || null,
            actorEmail: actor.email,
            actorRole: actor.role,
            category: 'BUSINESS_PROFILE',
            action: 'UPDATE_BUSINESS_PROFILE',
            previousState: current as any,
            newState: merged as any,
            reason: actor.reason || null,
            ipAddress: actor.ipAddress || null,
          },
        });
      });
    } catch (err) {
      console.error('[PlatformFinance] Error updating business profile:', err);
    }
  }

  writePersistedJson(PROFILE_CACHE_FILE, merged);
  return merged;
}
