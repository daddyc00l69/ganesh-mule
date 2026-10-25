/**
 * Centralized Brand & Platform Configuration
 * Single Source of Truth for Brand Name, Support Email, and Corporate Identity
 */

export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || 'Ganesh Mule Pure Honey';
export const BRAND_SHORT = process.env.NEXT_PUBLIC_STORE_NAME || 'Ganesh Mule';
export const BRAND_TAGLINE = '100% Raw Wild Forest Honey in Solid Glass';

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'care@devtushar.uk';
export const ORDERS_EMAIL = 'orders@devtushar.uk';
export const SECURITY_EMAIL = 'auth@devtushar.uk';

export const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_EMAIL || 'tushar0p.test@gmail.com';

export const COMPANY_LEGAL_NAME = 'Ganesh Mule Artisanal Apiaries Private Limited';
export const COMPANY_TRADE_NAME = 'Ganesh Mule Pure Honey';
export const COMPANY_GSTIN = '27AAECG1234M1Z5';

const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
export const STORE_URL =
  envUrl && !envUrl.includes('localhost')
    ? envUrl
    : 'https://ganesh-mule.vercel.app';
export const ADMIN_HOST = 'admin.devtushar.uk';
export const SUPPORT_PHONE = '+91 98220 54321';
export const APIARY_LOCATION = 'Western Ghats Bio-Reserve, Maharashtra, India';
