import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/services/api_service.dart';

class TodayDashboard {
  final String greeting;
  final dynamic nextClass;
  final dynamic upcomingDeadline;
  final dynamic aiSuggestedAction;
  final dynamic weather;
  final dynamic highlightedOpportunity;
  final dynamic quickStats;

  TodayDashboard({
    required this.greeting,
    this.nextClass,
    this.upcomingDeadline,
    this.aiSuggestedAction,
    this.weather,
    this.highlightedOpportunity,
    this.quickStats,
  });

  factory TodayDashboard.fallback() => TodayDashboard(
        greeting: 'Good morning',
        nextClass: null,
        upcomingDeadline: null,
        aiSuggestedAction: {
          'type': 'study_reminder',
          'message': 'Review Chapter 3 before tomorrow\'s lecture',
          'module': 'library',
        },
        weather: {
          'temp': 22,
          'condition': 'partly_cloudy',
          'city': 'Campus',
        },
        highlightedOpportunity: {
          'type': 'scholarship',
          'title': 'Tech Innovation Scholarship',
          'deadline': '2026-08-15',
          'module': 'scholarships',
        },
        quickStats: {
          'courses': 5,
          'unreadMessages': 3,
          'upcomingEvents': 2,
          'marketplaceAlerts': 0,
        },
      );
}

final todayDashboardProvider = FutureProvider<TodayDashboard>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/dashboard/today');
    final data = response.data['data'];
    return TodayDashboard(
      greeting: data['greeting'] ?? 'Hello',
      nextClass: data['nextClass'],
      upcomingDeadline: data['upcomingDeadline'],
      aiSuggestedAction: data['aiSuggestedAction'],
      weather: data['weather'],
      highlightedOpportunity: data['highlightedOpportunity'],
      quickStats: data['quickStats'],
    );
  } catch (e) {
    return TodayDashboard.fallback();
  }
});
