import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  async getTodayDashboard(userId: string, universityId: string) {
    return {
      greeting: this.getGreeting(),
      nextClass: null,
      upcomingDeadline: null,
      aiSuggestedAction: {
        type: 'study_reminder',
        message: 'Review Chapter 3 before tomorrow\'s lecture',
        module: 'library',
      },
      weather: {
        temp: 22,
        condition: 'partly_cloudy',
        city: 'Campus',
      },
      highlightedOpportunity: {
        type: 'scholarship',
        title: 'Tech Innovation Scholarship',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        module: 'scholarships',
      },
      quickStats: {
        courses: 5,
        unreadMessages: 3,
        upcomingEvents: 2,
        marketplaceAlerts: 0,
      },
    };
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }
}
