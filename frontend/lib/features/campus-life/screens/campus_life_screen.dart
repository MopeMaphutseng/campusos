import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/campus-life/screens/campus_map_screen.dart';
import 'package:campusos/features/campus-life/cafeteria/cafeteria_screen.dart';
import 'package:campusos/features/campus-life/hostel/hostel_screen.dart';
import 'package:campusos/features/campus-life/transport/transport_screen.dart';
import 'package:campusos/features/campus-life/printing/printing_screen.dart';
import 'package:campusos/features/campus-life/clubs/clubs_screen.dart';
import 'package:campusos/features/campus-life/screens/lost_found_screen.dart';
import 'package:campusos/features/campus-life/screens/events_screen.dart';
import 'package:campusos/features/campus-life/screens/parking_screen.dart';
import 'package:campusos/features/campus-life/screens/wellness_screen.dart';

class CampusLifeScreen extends ConsumerWidget {
  const CampusLifeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final modules = [
      _ModuleData('Campus Map', LucideIcons.map, AppColors.primaryAccent, 'Navigate campus buildings & facilities', () => _navigateTo(context, const CampusMapScreen())),
      _ModuleData('Cafeteria', LucideIcons.utensils, AppColors.tertiaryAccent, 'Menus, hours & pre-order meals', () => _navigateTo(context, const CafeteriaScreen())),
      _ModuleData('Hostel', LucideIcons.building, AppColors.info, 'Book rooms, maintenance requests', () => _navigateTo(context, const HostelScreen())),
      _ModuleData('Transport', LucideIcons.bus, AppColors.secondaryAccent, 'Campus shuttles & route tracker', () => _navigateTo(context, const TransportScreen())),
      _ModuleData('Printing', LucideIcons.printer, AppColors.primaryAccent, 'Send documents & check queues', () => _navigateTo(context, const PrintingScreen())),
      _ModuleData('Clubs & Societies', LucideIcons.users, AppColors.tertiaryAccent, 'Browse & join campus clubs', () => _navigateTo(context, const ClubsScreen())),
      _ModuleData('Lost & Found', LucideIcons.search, AppColors.warning, 'Report or find lost items', () => _navigateTo(context, const LostFoundScreen())),
      _ModuleData('Parking', LucideIcons.car, AppColors.info, 'Permits & lot availability', () => _navigateTo(context, const ParkingScreen())),
      _ModuleData('Events', LucideIcons.calendarDays, AppColors.secondaryAccent, 'Campus events & activities', () => _navigateTo(context, const EventsScreen())),
      _ModuleData('Wellness', LucideIcons.heart, AppColors.error, 'Mental health & counselling', () => _navigateTo(context, const WellnessScreen())),
    ];

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('Campus Life', style: Theme.of(context).textTheme.headlineSmall),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: CampusCard(
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.tertiaryAccent.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.sparkles, color: AppColors.tertiaryAccent, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Campus Status', style: Theme.of(context).textTheme.titleSmall),
                            Text(
                              'All systems operational',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.tertiaryAccent),
                            ),
                          ],
                        ),
                      ),
                      StatusBadge.success('Online'),
                    ],
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.5,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final mod = modules[index];
                    return _ModuleCard(module: mod, isDark: isDark);
                  },
                  childCount: modules.length,
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }
}

class _ModuleCard extends StatelessWidget {
  final _ModuleData module;
  final bool isDark;

  const _ModuleCard({required this.module, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return CampusCard(
      padding: const EdgeInsets.all(14),
      margin: EdgeInsets.zero,
      onTap: module.onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: module.color.withValues(alpha: isDark ? 0.15 : 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(module.icon, color: module.color, size: 18),
          ),
          const Spacer(),
          Text(module.title, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontSize: 13)),
          const SizedBox(height: 2),
          Text(
            module.description,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _ModuleData {
  final String title;
  final IconData icon;
  final Color color;
  final String description;
  final VoidCallback onTap;

  const _ModuleData(this.title, this.icon, this.color, this.description, this.onTap);
}

void _navigateTo(BuildContext context, Widget screen) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
}
