import { Controller, Get, Param, Query, Headers } from '@nestjs/common';
import { MonetizationService, SubscriptionTier } from './monetization.service';

@Controller('monetization')
export class MonetizationController {
  constructor(private readonly monetizationService: MonetizationService) {}

  @Get('features')
  async getFeatures(@Query('tier') tier?: SubscriptionTier) {
    const activeTier = tier || SubscriptionTier.FREE;
    return { tier: activeTier, features: this.monetizationService.getAllFeatures(activeTier) };
  }

  @Get('pricing')
  async getPricing() {
    return {
      pro: {
        student: { monthly: 49, annual: 490 },
        individual: { monthly: 99, annual: 990 },
        institution: { monthly: 4999, annual: 49990 },
      },
      marketplaceFee: {
        free: '5%',
        pro: '2.5%',
        enterprise: '1%',
      },
      jobListing: {
        free: 'M50 per 30 days',
        pro: 'M25 per 30 days',
        enterprise: 'Free',
      },
    };
  }

  @Get('check-limit')
  async checkLimit(
    @Query('feature') feature: string,
    @Query('currentCount') currentCount: string,
    @Query('tier') tier?: SubscriptionTier,
  ) {
    const activeTier = tier || SubscriptionTier.FREE;
    const result = {
      marketplaceListing: () => this.monetizationService.canCreateListing(parseInt(currentCount || '0'), activeTier),
      aiTutor: () => this.monetizationService.canUseAIMessages(parseInt(currentCount || '0'), activeTier),
      mentorship: () => this.monetizationService.canBookMentorship(parseInt(currentCount || '0'), activeTier),
    };
    const check = result[feature];
    if (!check) return { error: `Unknown feature: ${feature}` };
    return check();
  }
}
