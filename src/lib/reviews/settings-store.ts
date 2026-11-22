import { ReviewRewardSettingsConfig } from './types';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { readPersistedJson, writePersistedJson, isTestStorageBypassed } from '@/lib/storage/json-store';

const SETTINGS_FILENAME = 'review-reward-settings.json';

export const DEFAULT_REVIEW_REWARD_SETTINGS: ReviewRewardSettingsConfig = {
  id: 'singleton',
  isEnabled: true,
  defaultDiscountPercent: 5,
  availablePercentages: [3, 5, 7, 10],
  maxDiscountPercent: 15,
  requireAdminApproval: false, // Honest reviews rewarded immediately
  autoGenerateCoupon: true,
  expiryDays: 30, // 30-day coupon validity
  minOrderValuePaise: 0, // No minimum by default
  maxDiscountPaise: null,
  delayDaysAfterDelivery: 2, // 2 days after delivery
  sendInvitationEmails: true,
  sendRewardEmails: true,
  allowMultipleRedemptions: false, // Single-use default
  applicableCategoryIds: [],
};

const globalSettingsStore = globalThis as unknown as {
  __REVIEW_REWARD_SETTINGS__?: ReviewRewardSettingsConfig;
};

export async function getReviewRewardSettings(): Promise<ReviewRewardSettingsConfig> {
  const dbOnline = await isDatabaseOnline();
  if (dbOnline) {
    try {
      let record = await prisma.reviewRewardSettings.findUnique({
        where: { id: 'singleton' },
      });

      if (!record) {
        record = await prisma.reviewRewardSettings.create({
          data: {
            id: 'singleton',
            isEnabled: DEFAULT_REVIEW_REWARD_SETTINGS.isEnabled,
            defaultDiscountPercent: DEFAULT_REVIEW_REWARD_SETTINGS.defaultDiscountPercent,
            availablePercentages: DEFAULT_REVIEW_REWARD_SETTINGS.availablePercentages,
            maxDiscountPercent: DEFAULT_REVIEW_REWARD_SETTINGS.maxDiscountPercent,
            requireAdminApproval: DEFAULT_REVIEW_REWARD_SETTINGS.requireAdminApproval,
            autoGenerateCoupon: DEFAULT_REVIEW_REWARD_SETTINGS.autoGenerateCoupon,
            expiryDays: DEFAULT_REVIEW_REWARD_SETTINGS.expiryDays,
            minOrderValuePaise: DEFAULT_REVIEW_REWARD_SETTINGS.minOrderValuePaise,
            maxDiscountPaise: DEFAULT_REVIEW_REWARD_SETTINGS.maxDiscountPaise,
            delayDaysAfterDelivery: DEFAULT_REVIEW_REWARD_SETTINGS.delayDaysAfterDelivery,
            sendInvitationEmails: DEFAULT_REVIEW_REWARD_SETTINGS.sendInvitationEmails,
            sendRewardEmails: DEFAULT_REVIEW_REWARD_SETTINGS.sendRewardEmails,
            allowMultipleRedemptions: DEFAULT_REVIEW_REWARD_SETTINGS.allowMultipleRedemptions,
            applicableCategoryIds: DEFAULT_REVIEW_REWARD_SETTINGS.applicableCategoryIds,
          },
        });
      }

      const config: ReviewRewardSettingsConfig = {
        id: record.id,
        isEnabled: record.isEnabled,
        defaultDiscountPercent: record.defaultDiscountPercent,
        availablePercentages: record.availablePercentages,
        maxDiscountPercent: record.maxDiscountPercent,
        requireAdminApproval: record.requireAdminApproval,
        autoGenerateCoupon: record.autoGenerateCoupon,
        expiryDays: record.expiryDays,
        minOrderValuePaise: record.minOrderValuePaise,
        maxDiscountPaise: record.maxDiscountPaise,
        delayDaysAfterDelivery: record.delayDaysAfterDelivery,
        sendInvitationEmails: record.sendInvitationEmails,
        sendRewardEmails: record.sendRewardEmails,
        allowMultipleRedemptions: record.allowMultipleRedemptions,
        applicableCategoryIds: record.applicableCategoryIds,
        updatedAt: record.updatedAt.toISOString(),
        updatedBy: record.updatedBy || undefined,
      };

      globalSettingsStore.__REVIEW_REWARD_SETTINGS__ = config;
      return config;
    } catch (err) {
      console.warn('Prisma review settings retrieval error, falling back:', err);
    }
  }

  // Fallback: In-memory / persisted JSON
  if (!globalSettingsStore.__REVIEW_REWARD_SETTINGS__) {
    if (!isTestStorageBypassed()) {
      const persisted = readPersistedJson<ReviewRewardSettingsConfig>(SETTINGS_FILENAME);
      if (persisted) {
        globalSettingsStore.__REVIEW_REWARD_SETTINGS__ = persisted;
        return persisted;
      }
    }
    globalSettingsStore.__REVIEW_REWARD_SETTINGS__ = { ...DEFAULT_REVIEW_REWARD_SETTINGS };
  }

  return globalSettingsStore.__REVIEW_REWARD_SETTINGS__;
}

export async function updateReviewRewardSettings(
  updates: Partial<ReviewRewardSettingsConfig>,
  actorEmail?: string
): Promise<ReviewRewardSettingsConfig> {
  const current = await getReviewRewardSettings();
  const next: ReviewRewardSettingsConfig = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: actorEmail || current.updatedBy,
  };

  const dbOnline = await isDatabaseOnline();
  if (dbOnline) {
    try {
      await prisma.reviewRewardSettings.upsert({
        where: { id: 'singleton' },
        update: {
          isEnabled: next.isEnabled,
          defaultDiscountPercent: next.defaultDiscountPercent,
          availablePercentages: next.availablePercentages,
          maxDiscountPercent: next.maxDiscountPercent,
          requireAdminApproval: next.requireAdminApproval,
          autoGenerateCoupon: next.autoGenerateCoupon,
          expiryDays: next.expiryDays,
          minOrderValuePaise: next.minOrderValuePaise,
          maxDiscountPaise: next.maxDiscountPaise,
          delayDaysAfterDelivery: next.delayDaysAfterDelivery,
          sendInvitationEmails: next.sendInvitationEmails,
          sendRewardEmails: next.sendRewardEmails,
          allowMultipleRedemptions: next.allowMultipleRedemptions,
          applicableCategoryIds: next.applicableCategoryIds,
          updatedBy: actorEmail,
        },
        create: {
          id: 'singleton',
          isEnabled: next.isEnabled,
          defaultDiscountPercent: next.defaultDiscountPercent,
          availablePercentages: next.availablePercentages,
          maxDiscountPercent: next.maxDiscountPercent,
          requireAdminApproval: next.requireAdminApproval,
          autoGenerateCoupon: next.autoGenerateCoupon,
          expiryDays: next.expiryDays,
          minOrderValuePaise: next.minOrderValuePaise,
          maxDiscountPaise: next.maxDiscountPaise,
          delayDaysAfterDelivery: next.delayDaysAfterDelivery,
          sendInvitationEmails: next.sendInvitationEmails,
          sendRewardEmails: next.sendRewardEmails,
          allowMultipleRedemptions: next.allowMultipleRedemptions,
          applicableCategoryIds: next.applicableCategoryIds,
          updatedBy: actorEmail,
        },
      });
    } catch (err) {
      console.warn('Failed to upsert review reward settings in DB:', err);
    }
  }

  globalSettingsStore.__REVIEW_REWARD_SETTINGS__ = next;
  writePersistedJson(SETTINGS_FILENAME, next);
  return next;
}
