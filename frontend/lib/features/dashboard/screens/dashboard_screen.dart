import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/dashboard/providers/dashboard_provider.dart';
import 'package:campusos/features/dashboard/widgets/next_class_card.dart';
import 'package:campusos/features/dashboard/widgets/ai_suggestion_card.dart';
import 'package:campusos/features/dashboard/widgets/opportunity_card.dart';
import 'package:campusos/features/dashboard/widgets/quick_modules_grid.dart';
import 'package:campusos/features/dashboard/widgets/weather_widget.dart';
import 'package:campusos/features/dashboard/widgets/deadline_countdown_card.dart';
import 'package:campusos/features/dashboard/widgets/moments_showcase_card.dart';
import 'package:campusos/features/notifications/screens/notifications_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(todayDashboardProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(todayDashboardProvider);
          await Future.delayed(const Duration(milliseconds: 500));
        },
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(
            parent: AlwaysScrollableScrollPhysics(),
          ),
          slivers: [
            SliverAppBar(
              expandedHeight: 0,
              floating: true,
              pinned: false,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      gradient: AppColors.heroGradient,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.school_rounded, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'CampusOS',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                ],
              ),
              actions: [
                CampusIconButton(
                  icon: LucideIcons.bell,
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                  tooltip: 'Notifications',
                ),
                const SizedBox(width: 8),
                const UserAvatar(
                  initials: 'JD',
                  size: 36,
                ),
                const SizedBox(width: 12),
              ],
            ),
            dashboardAsync.when(
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (err, stack) => SliverFillRemaining(
                child: EmptyState(
                  icon: LucideIcons.alertCircle,
                  title: 'Something went wrong',
                  message: 'Pull to refresh and try again',
                  actionLabel: 'Retry',
                  onAction: () => ref.invalidate(todayDashboardProvider),
                ),
              ),
              data: (dashboard) => SliverPadding(
                padding: const EdgeInsets.only(bottom: 20),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    TodayDashboardHeader(
                      greeting: dashboard.greeting,
                      userName: 'Student',
                    ),
                    const SizedBox(height: 4),
                    const WeatherWidget(
                      temp: 22,
                      condition: 'Partly Cloudy',
                    ),
                    const SizedBox(height: 12),
                    QuickStatsRow(
                      stats: dashboard.quickStats,
                    ),
                    const SizedBox(height: 16),
                    if (dashboard.nextClass != null)
                      NextClassCard(classInfo: dashboard.nextClass!),
                    const SizedBox(height: 12),
                    if (dashboard.upcomingDeadline != null)
                      DeadlineCountdownCard(deadline: dashboard.upcomingDeadline!),
                    const SizedBox(height: 12),
                    AISuggestionCard(suggestion: dashboard.aiSuggestedAction),
                    const SizedBox(height: 12),
                    const MomentsShowcaseCard(),
                    const SizedBox(height: 12),
                    if (dashboard.highlightedOpportunity != null)
                      OpportunityCard(
                        opportunity: dashboard.highlightedOpportunity!,
                      ),
                    const SizedBox(height: 16),
                    SectionHeader(
                      title: 'Quick Access',
                      actionText: 'Customize',
                      onAction: () => ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Demo: Customize dashboard'),
                          duration: Duration(seconds: 1),
                        ),
                      ),
                    ),
                    const QuickModulesGrid(),
                    const SizedBox(height: 80),
                  ]),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class TodayDashboardHeader extends StatelessWidget {
  final String greeting;
  final String userName;

  const TodayDashboardHeader({
    super.key,
    required this.greeting,
    required this.userName,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dateStr = DateFormat('EEEE, MMM d').format(now);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$greeting, $userName',
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            dateStr,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }
}

class QuickStatsRow extends StatelessWidget {
  final dynamic stats;

  const QuickStatsRow({super.key, required this.stats});

  @override
  Widget build(BuildContext context) {
    final s = stats is Map ? stats as Map<String, dynamic> : null;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: QuickStatChip(
              icon: LucideIcons.bookOpen,
              label: 'Courses',
              value: '${s?['courses'] ?? '0'}',
              accentColor: AppColors.primaryAccent,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: QuickStatChip(
              icon: LucideIcons.mail,
              label: 'Messages',
              value: '${s?['unreadMessages'] ?? '0'}',
              accentColor: AppColors.secondaryAccent,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: QuickStatChip(
              icon: LucideIcons.calendar,
              label: 'Events',
              value: '${s?['upcomingEvents'] ?? '0'}',
              accentColor: AppColors.tertiaryAccent,
            ),
          ),
        ],
      ),
    );
  }
}
