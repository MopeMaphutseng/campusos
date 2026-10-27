import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:animate_do/animate_do.dart';
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
import 'package:campusos/features/notifications/providers/notifications_provider.dart';
import 'package:campusos/features/profile/screens/profile_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(todayDashboardProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AuroraBackground(
        child: RefreshIndicator(
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
                backgroundColor: Colors.transparent,
                surfaceTintColor: Colors.transparent,
                title: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        gradient: AppColors.auroraGradient,
                        borderRadius: BorderRadius.circular(11),
                        boxShadow: AppColors.glow(AppColors.primaryAccent, strength: 0.4, radius: 16),
                      ),
                      child: const Icon(Icons.school_rounded, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'CampusOS',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                ),
                actions: [
                  _NotificationBell(
                    onTap: () async {
                      await Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
                      ref.invalidate(notificationsProvider);
                      ref.invalidate(unreadNotificationsCountProvider);
                    },
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ProfileScreen()),
                    ),
                    child: const UserAvatar(
                      initials: 'JD',
                      size: 36,
                    ),
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
                      FadeInDown(
                        duration: const Duration(milliseconds: 450),
                        child: TodayDashboardHeader(
                          greeting: dashboard.greeting,
                          userName: 'Student',
                        ),
                      ),
                      const SizedBox(height: 4),
                      FadeInDown(
                        duration: const Duration(milliseconds: 450),
                        delay: const Duration(milliseconds: 60),
                        child: const WeatherWidget(
                          temp: 22,
                          condition: 'Partly Cloudy',
                        ),
                      ),
                      const SizedBox(height: 12),
                      FadeInUp(
                        duration: const Duration(milliseconds: 450),
                        delay: const Duration(milliseconds: 120),
                        child: QuickStatsRow(
                          stats: dashboard.quickStats,
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (dashboard.nextClass != null)
                        FadeInUp(
                          duration: const Duration(milliseconds: 450),
                          delay: const Duration(milliseconds: 180),
                          child: NextClassCard(classInfo: dashboard.nextClass!),
                        ),
                      const SizedBox(height: 12),
                      if (dashboard.upcomingDeadline != null)
                        FadeInUp(
                          duration: const Duration(milliseconds: 450),
                          delay: const Duration(milliseconds: 240),
                          child: DeadlineCountdownCard(deadline: dashboard.upcomingDeadline!),
                        ),
                      const SizedBox(height: 12),
                      FadeInUp(
                        duration: const Duration(milliseconds: 450),
                        delay: const Duration(milliseconds: 300),
                        child: AISuggestionCard(suggestion: dashboard.aiSuggestedAction),
                      ),
                      const SizedBox(height: 12),
                      FadeInUp(
                        duration: const Duration(milliseconds: 450),
                        delay: const Duration(milliseconds: 340),
                        child: const MomentsShowcaseCard(),
                      ),
                      const SizedBox(height: 12),
                      if (dashboard.highlightedOpportunity != null)
                        FadeInUp(
                          duration: const Duration(milliseconds: 450),
                          delay: const Duration(milliseconds: 380),
                          child: OpportunityCard(
                            opportunity: dashboard.highlightedOpportunity!,
                          ),
                        ),
                      const SizedBox(height: 16),
                      FadeInUp(
                        duration: const Duration(milliseconds: 450),
                        delay: const Duration(milliseconds: 420),
                        child: SectionHeader(
                          title: 'Quick Access',
                          actionText: 'Customize',
                          onAction: () => ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Demo: Customize dashboard'),
                              duration: Duration(seconds: 1),
                            ),
                          ),
                        ),
                      ),
                      FadeInUp(
                        duration: const Duration(milliseconds: 500),
                        delay: const Duration(milliseconds: 460),
                        child: const QuickModulesGrid(),
                      ),
                      const SizedBox(height: 80),
                    ]),
                  ),
                ),
              ),
            ],
          ),
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

class _NotificationBell extends ConsumerWidget {
  final VoidCallback onTap;

  const _NotificationBell({required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = ref.watch(unreadNotificationsCountProvider).asData?.value ?? 0;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        CampusIconButton(
          icon: LucideIcons.bell,
          onPressed: onTap,
          tooltip: 'Notifications',
        ),
        if (unread > 0)
          Positioned(
            right: 4,
            top: 4,
            child: IgnorePointer(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                constraints: const BoxConstraints(minWidth: 16),
                decoration: BoxDecoration(
                  color: AppColors.error,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  unread > 9 ? '9+' : '$unread',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
