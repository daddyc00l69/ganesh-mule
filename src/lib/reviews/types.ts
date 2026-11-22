export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
export type InvitationStatus = 'PENDING' | 'SENT' | 'COMPLETED';
export type RewardStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'REVOKED';

export interface ReviewRewardSettingsConfig {
  id: string;
  isEnabled: boolean;
  defaultDiscountPercent: number; // e.g. 5
  availablePercentages: number[]; // e.g. [3, 5, 7, 10]
  maxDiscountPercent: number; // e.g. 15
  requireAdminApproval: boolean; // default false
  autoGenerateCoupon: boolean; // default true
  expiryDays: number; // default 30
  minOrderValuePaise: number; // in paise
  maxDiscountPaise: number | null; // cap in paise
  delayDaysAfterDelivery: number; // default 2 days
  sendInvitationEmails: boolean; // default true
  sendRewardEmails: boolean; // default true
  allowMultipleRedemptions: boolean; // default false (one-time)
  applicableCategoryIds: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface ReviewItemDto {
  orderItemId: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  weight?: string;
  pricePaise: number;
  deliveredAt: string;
}

export interface ProductReviewDto {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  orderId: string;
  orderNumber?: string;
  orderItemId: string;
  rating: number; // 1-5
  title: string | null;
  comment: string;
  reviewText?: string;
  customerName: string;
  customerEmail: string;
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  reward?: {
    couponCode: string;
    discountPercent: number;
    status: RewardStatus;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRewardDto {
  id: string;
  couponId: string;
  couponCode: string;
  discountPercent: number;
  reviewId: string;
  productName: string;
  productSlug: string;
  customerEmail: string;
  status: RewardStatus;
  expiresAt: string | null;
  minOrderAmountPaise: number;
  maxDiscountPaise: number | null;
  usedCount: number;
  createdAt: string;
}

export interface ProductRatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  ratingCounts?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  ratingPercentages: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
