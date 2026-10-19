import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/notifications/providers/notifications_provider.dart';

enum NotificationFilter { all, academic, social, system, security }

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  NotificationFilter _filter = NotificationFilter.all;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('Notifications', style: Theme.of(context).textTheme.headlineSmall),
              actions: [
                TextButton(
                  onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Demo: All marked as read'),
                      duration: Duration(seconds: 1),
                    ),
                  ),
                  child: Text(
                    'Mark all read',
                    style: TextStyle(fontSize: 12, color: AppColors.primaryAccent),
                  ),
                ),
              ],
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  children: NotificationFilter.values.map((f) {
                    final labels = {
                      NotificationFilter.all: 'All',
                      NotificationFilter.academic: 'Academic',
                      NotificationFilter.social: 'Social',
                      NotificationFilter.system: 'System',
                      NotificationFilter.security: 'Security',
                    };
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: CampusChip(
                        label: labels[f]!,
                        isSelected: _filter == f,
                        onTap: () => setState(() => _filter = f),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            notificationsAsync.when(
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, st) => SliverFillRemaining(
                child: EmptyState(
                  icon: LucideIcons.alertCircle,
                  title: 'Something went wrong',
                  message: 'Pull to refresh and try again',
                  actionLabel: 'Retry',
                  onAction: () => ref.invalidate(notificationsProvider),
                ),
              ),
              data: (notifications) {
                if (notifications.isEmpty) {
                  return SliverFillRemaining(
                    child: EmptyState(
                      icon: LucideIcons.bell,
                      title: 'No notifications',
                      message: 'You\'re all caught up!',
                    ),
                  );
                }
                final grouped = _groupByTime(notifications);
                return SliverMainAxisGroup(
                  slivers: [
                    ...grouped.entries.map((entry) {
                      final items = entry.value;
                      if (items.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                      return SliverMainAxisGroup(
                        slivers: [
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                              child: Text(
                                entry.key,
                                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                      color: AppColors.textSecondary,
                                    ),
                              ),
                            ),
                          ),
                          SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                final notif = items[index];
                                return _NotificationItem(
                                  notification: notif,
                                  isDark: isDark,
                                  onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
                                );
                              },
                              childCount: items.length,
                            ),
                          ),
                        ],
                      );
                    }),
                  ],
                );
              },
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  Map<String, List<AppNotification>> _groupByTime(List<AppNotification> notifications) {
    final now = DateTime.now();
    final today = <AppNotification>[];
    final yesterday = <AppNotification>[];
    final earlier = <AppNotification>[];

    for (final n in notifications) {
      final diff = now.difference(n.createdAt);
      if (diff.inDays == 0) {
        today.add(n);
      } else if (diff.inDays == 1) {
        yesterday.add(n);
      } else {
        earlier.add(n);
      }
    }

    return {
      'Today': today,
      'Yesterday': yesterday,
      'Earlier': earlier,
    };
  }
}

IconData _iconForType(String type) {
  switch (type) {
    case 'academic':
      return LucideIcons.graduationCap;
    case 'social':
      return LucideIcons.messageCircle;
    case 'system':
      return LucideIcons.download;
    case 'security':
      return LucideIcons.shield;
    case 'marketplace':
      return LucideIcons.store;
    case 'mentorship':
      return LucideIcons.userCheck;
    case 'scholarship':
      return LucideIcons.award;
    case 'job':
      return LucideIcons.briefcase;
    default:
      return LucideIcons.bell;
  }
}

Color _colorForType(String type) {
  switch (type) {
    case 'academic':
      return AppColors.success;
    case 'social':
      return AppColors.info;
    case 'system':
      return AppColors.textSecondary;
    case 'security':
      return AppColors.warning;
    case 'marketplace':
      return AppColors.secondaryAccent;
    case 'mentorship':
      return AppColors.tertiaryAccent;
    case 'scholarship':
      return AppColors.primaryAccent;
    case 'job':
      return AppColors.info;
    default:
      return AppColors.primaryAccent;
  }
}

String _timeAgo(DateTime date) {
  final diff = DateTime.now().difference(date);
  if (diff.inDays > 6) return '${(diff.inDays / 7).floor()}d ago';
  if (diff.inDays > 0) return '${diff.inDays}d ago';
  if (diff.inHours > 0) return '${diff.inHours}h ago';
  if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
  return 'Just now';
}

class _NotificationItem extends StatelessWidget {
  final AppNotification notification;
  final bool isDark;
  final VoidCallback onTap;

  const _NotificationItem({
    required this.notification,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final iconColor = _colorForType(notification.type);
    final icon = _iconForType(notification.type);

    return CampusCard(
      padding: const EdgeInsets.all(14),
      isHighlighted: !notification.isRead,
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: isDark ? 0.15 : 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  notification.title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontSize: 13,
                        fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  notification.body,
                  style: Theme.of(context).textTheme.bodySmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(_timeAgo(notification.createdAt), style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10)),
              ],
            ),
          ),
          if (!notification.isRead)
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.primaryAccent,
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    );
  }
}
