export type UserRole = 'ADMIN' | 'MANAGER' | 'CUSTOMER';

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  permissions?: string[];
  department?: string;
}

export interface ManagerAccount {
  id: string;
  userId: string;
  name: string;
  email: string;
  isActive: boolean;
  department: string | null;
  permissions: string[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isVisible: boolean;
  productCount?: number;
}

export interface ProductItem {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string;
  price: number; // minor units (paise)
  compareAtPrice?: number | null;
  costPrice?: number | null;
  categoryId: string;
  category?: CategoryItem;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  isPublished: boolean;
  images: { id: string; url: string; altText?: string | null; position: number }[];
  createdAt: string;
  updatedAt: string;
  badge?: string;
  badgeColor?: 'amber' | 'emerald' | 'purple' | 'cyan' | 'rose' | 'blue';
  rating?: number;
  ratingCount?: number;
  answeredQuestionsCount?: number;
  weightGrams?: number;
  flavour?: string;
  origin?: string;
  packageType?: string;
  speciality?: string[];
  aboutItems?: string[];
  technicalDetails?: Record<string, string>;
  customerReviews?: {
    id: string;
    author: string;
    rating: number;
    title: string;
    date: string;
    verifiedPurchase: boolean;
    content: string;
    helpfulCount: number;
  }[];
  batchNumber?: string;
  harvestDate?: string;
  qAndA?: {
    question: string;
    answer: string;
    votes: number;
  }[];
}

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED';

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'REFUND_PENDING'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export interface OrderAddress {
  fullName: string;
  phone: string;
  street: string;
  flatBuilding?: string;
  areaStreet?: string;
  landmark?: string;
  city: string;
  state: string;
  stateCode?: string;
  postalCode: string;
  country: string;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  price: number; // minor units
  quantity: number;
  total: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress: OrderAddress;
  subtotal: number;
  shippingCost: number;
  shippingGst?: number;
  platformFee?: number;
  platformFeeGst?: number;
  taxAmount: number;
  discountAmount: number;
  couponCode?: string | null;
  assignedManagerName?: string | null;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  trackingNumber?: string | null;
  carrier?: string | null;
  notes?: string | null;
  items: OrderItemRecord[];
  payments?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  slug: string;
  sku: string;
  price: number; // minor units
  quantity: number;
  imageUrl?: string;
  stockAvailable: number;
}

export interface InventoryMovementRecord {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  delta: number;
  quantityAfter: number;
  reason: string;
  referenceId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  actorId: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface StoreSettingsRecord {
  storeName: string;
  currency: string;
  currencySymbol: string;
  supportEmail: string;
  taxRatePercent: number;
  shippingFlatRate: number;
  freeShippingAbove: number;
  chatwootEnabled: boolean;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface DiscountCoupon {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  value: number; // e.g. 15 for 15%, or 25000 for ₹250.00
  minOrderAmount: number; // in paise
  maxDiscountAmount?: number | null; // in paise (for percentage discounts)
  expiresAt?: string | null;
  usageLimit?: number | null;
  usageCount: number;
  isActive: boolean;
  assignedManagerIds?: string[]; // Manager User IDs
  assignedManagerNames?: string[];
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    code: string;
    description: string;
    discountType: DiscountType;
    value: number;
    discountAmount: number; // in paise
    assignedToManagerName?: string;
  };
  error?: string;
}

