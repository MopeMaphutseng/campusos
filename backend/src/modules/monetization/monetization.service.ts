import { Injectable, Logger } from '@nestjs/common';

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export interface FeatureGate {
  enabled: boolean;
  limits?: Record<string, number>;
}

@Injectable()
export class MonetizationService {
  private readonly logger = new Logger(MonetizationService.name);

  private readonly tierFeatures: Record<SubscriptionTier, Record<string, FeatureGate>> = {
    [SubscriptionTier.FREE]: {
      aiTutor: { enabled: true, limits: { messagesPerDay: 20 } },
      marketplaceListing: { enabled: true, limits: { maxListings: 5 } },
      marketplaceFee: { enabled: true, limits: { feePercent: 5 } },
      mentorship: { enabled: true, limits: { sessionsPerMonth: 3 } },
      jobApplications: { enabled: true, limits: { applicationsPerMonth: 10 } },
      premiumStudyTools: { enabled: false },
      advancedAnalytics: { enabled: false },
      prioritySupport: { enabled: false },
    },
    [SubscriptionTier.PRO]: {
      aiTutor: { enabled: true, limits: { messagesPerDay: 200 } },
      marketplaceListing: { enabled: true, limits: { maxListings: 50 } },
      marketplaceFee: { enabled: true, limits: { feePercent: 2.5 } },
      mentorship: { enabled: true, limits: { sessionsPerMonth: 20 } },
      jobApplications: { enabled: true, limits: { applicationsPerMonth: 100 } },
      premiumStudyTools: { enabled: true },
      advancedAnalytics: { enabled: false },
      prioritySupport: { enabled: true },
    },
    [SubscriptionTier.ENTERPRISE]: {
      aiTutor: { enabled: true, limits: { messagesPerDay: 10000 } },
      marketplaceListing: { enabled: true, limits: { maxListings: 1000 } },
      marketplaceFee: { enabled: true, limits: { feePercent: 1 } },
      mentorship: { enabled: true, limits: { sessionsPerMonth: 200 } },
      jobApplications: { enabled: true, limits: { applicationsPerMonth: 1000 } },
      premiumStudyTools: { enabled: true },
      advancedAnalytics: { enabled: true },
      prioritySupport: { enabled: true },
    },
  };

  private readonly proPrices: Record<string, { monthly: number; annual: number }> = {
    student: { monthly: 49, annual: 490 },
    individual: { monthly: 99, annual: 990 },
    institution: { monthly: 4999, annual: 49990 },
  };

  isFeatureEnabled(tier: SubscriptionTier, feature: string): boolean {
    return this.tierFeatures[tier]?.[feature]?.enabled ?? false;
  }

  getFeatureLimit(tier: SubscriptionTier, feature: string, limitKey: string): number {
    return this.tierFeatures[tier]?.[feature]?.limits?.[limitKey] ?? 0;
  }

  calculateMarketplaceFee(price: number, tier: SubscriptionTier): { fee: number; netAmount: number; feePercent: number } {
    const feePercent = this.tierFeatures[tier]?.marketplaceFee?.limits?.feePercent ?? 5;
    const fee = (price * feePercent) / 100;
    return { fee: Math.round(fee * 100) / 100, netAmount: Math.round((price - fee) * 100) / 100, feePercent };
  }

  calculateJobListingFee(tier: SubscriptionTier, durationDays: number = 30): number {
    if (tier === SubscriptionTier.ENTERPRISE) return 0;
    const baseFee = tier === SubscriptionTier.FREE ? 50 : 25;
    const durationMultiplier = Math.ceil(durationDays / 30);
    return baseFee * durationMultiplier;
  }

  canCreateListing(currentCount: number, tier: SubscriptionTier): { allowed: boolean; limit: number } {
    const limit = this.getFeatureLimit(tier, 'marketplaceListing', 'maxListings');
    return { allowed: currentCount < limit, limit };
  }

  canUseAIMessages(currentCount: number, tier: SubscriptionTier): { allowed: boolean; limit: number } {
    const limit = this.getFeatureLimit(tier, 'aiTutor', 'messagesPerDay');
    return { allowed: currentCount < limit, limit };
  }

  canBookMentorship(currentCount: number, tier: SubscriptionTier): { allowed: boolean; limit: number } {
    const limit = this.getFeatureLimit(tier, 'mentorship', 'sessionsPerMonth');
    return { allowed: currentCount < limit, limit };
  }

  getProPrice(planType: string, annual: boolean = false): number {
    return this.proPrices[planType]?.[annual ? 'annual' : 'monthly'] ?? this.proPrices.student.monthly;
  }

  getAllFeatures(tier: SubscriptionTier): Record<string, FeatureGate> {
    return this.tierFeatures[tier] ?? this.tierFeatures[SubscriptionTier.FREE];
  }
}
