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
                  onPressed: () async {
                    await markAllNotificationsRead(ref);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('All notifications marked as read'),
                          duration: Duration(seconds: 1),
                        ),
                      );
                    }
                  },
                  child: const Text(
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
              data: (allNotifications) {
                final notifications = allNotifications.where(_matchesFilter).toList();
                if (notifications.isEmpty) {
                  return const SliverFillRemaining(
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
                                  onTap: () async {
                                    if (!notif.isRead) {
                                      await markNotificationRead(ref, notif.id);
                                    }
                                    if (context.mounted && notif.body.isNotEmpty) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(notif.title),
                                          duration: const Duration(seconds: 2),
                                        ),
                                      );
                                    }
                                  },
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

  bool _matchesFilter(AppNotification n) {
    if (_filter == NotificationFilter.all) return true;
    final key = '${n.module} ${n.type}'.toLowerCase();
    switch (_filter) {
      case NotificationFilter.academic:
        return key.contains('class') ||
            key.contains('exam') ||
            key.contains('result') ||
            key.contains('deadline') ||
            key.contains('academic');
      case NotificationFilter.social:
        return key.contains('message') ||
            key.contains('marketplace') ||
            key.contains('social') ||
            key.contains('mentor');
      case NotificationFilter.security:
        return key.contains('safety') || key.contains('security');
      case NotificationFilter.system:
        return key.contains('payment') ||
            key.contains('system') ||
            key.contains('scholarship') ||
            key.contains('job');
      case NotificationFilter.all:
        return true;
    }
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
  final t = type.toLowerCase();
  if (t.contains('class') || t.contains('exam') || t.contains('result') || t.contains('academic')) {
    return LucideIcons.graduationCap;
  }
  if (t.contains('message') || t.contains('social')) return LucideIcons.messageCircle;
  if (t.contains('safety') || t.contains('security')) return LucideIcons.shield;
  if (t.contains('marketplace')) return LucideIcons.store;
  if (t.contains('mentor')) return LucideIcons.userCheck;
  if (t.contains('scholarship')) return LucideIcons.award;
  if (t.contains('job')) return LucideIcons.briefcase;
  if (t.contains('payment')) return LucideIcons.creditCard;
  if (t.contains('deadline')) return LucideIcons.alarmClock;
  return LucideIcons.bell;
}

Color _colorForType(String type) {
  final t = type.toLowerCase();
  if (t.contains('class') || t.contains('exam') || t.contains('result') || t.contains('academic')) {
    return AppColors.success;
  }
  if (t.contains('message') || t.contains('social')) return AppColors.info;
  if (t.contains('safety') || t.contains('security')) return AppColors.warning;
  if (t.contains('marketplace')) return AppColors.secondaryAccent;
  if (t.contains('mentor')) return AppColors.tertiaryAccent;
  if (t.contains('scholarship')) return AppColors.primaryAccent;
  if (t.contains('job')) return AppColors.info;
  if (t.contains('payment')) return AppColors.tertiaryAccent;
  return AppColors.primaryAccent;
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
    final key = notification.module.isNotEmpty ? notification.module : notification.type;
    final iconColor = _colorForType(key);
    final icon = _iconForType(key);

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
