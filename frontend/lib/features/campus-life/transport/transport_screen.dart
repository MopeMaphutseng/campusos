import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class TransportScreen extends ConsumerStatefulWidget {
  const TransportScreen({super.key});

  @override
  ConsumerState<TransportScreen> createState() => _TransportScreenState();
}

class _TransportScreenState extends ConsumerState<TransportScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  String? _selectedRoute;

  final _routes = const [
    _RouteData(
      name: 'Main Campus Loop',
      number: 'A',
      start: 'Main Gate',
      end: 'Science Block',
      fare: 5.0,
      schedule: 'Every 15 min, 07:00 – 18:00',
      stops: ['Main Gate', 'Library', 'Admin Block', 'Student Centre', 'Science Block'],
    ),
    _RouteData(
      name: 'Residence Shuttle',
      number: 'B',
      start: 'Boys Hostel',
      end: 'Main Campus',
      fare: 3.0,
      schedule: 'Every 20 min, 06:30 – 22:00',
      stops: ['Boys Hostel', 'Girls Hostel', 'Postgraduate Village', 'Main Campus'],
    ),
    _RouteData(
      name: 'Town Connector',
      number: 'C',
      start: 'Campus',
      end: 'Town Centre',
      fare: 8.0,
      schedule: 'Every 30 min, 08:00 – 17:00',
      stops: ['Campus', 'Shopping Mall', 'Bus Terminal', 'Town Centre'],
    ),
    _RouteData(
      name: 'Evening Shuttle',
      number: 'D',
      start: 'Library',
      end: 'Hostels',
      fare: 4.0,
      schedule: 'Every 25 min, 18:00 – 23:00',
      stops: ['Library', 'Science Block', 'Sports Complex', 'Hostels'],
    ),
    _RouteData(
      name: 'Weekend Express',
      number: 'E',
      start: 'Main Campus',
      end: 'City Mall',
      fare: 10.0,
      schedule: 'Every 45 min, 09:00 – 16:00 (Sat & Sun)',
      stops: ['Main Campus', 'City Mall'],
    ),
  ];

  final _ridePosts = const [
    _RidePostData(
      from: 'Boys Hostel',
      to: 'Science Block',
      time: '08:30 AM',
      driver: 'Thabo M.',
      seats: 3,
    ),
    _RidePostData(
      from: 'Town Centre',
      to: 'Main Campus',
      time: '02:15 PM',
      driver: 'Lerato K.',
      seats: 2,
    ),
    _RidePostData(
      from: 'Library',
      to: 'Postgraduate Village',
      time: '06:00 PM',
      driver: 'Mpho S.',
      seats: 1,
    ),
    _RidePostData(
      from: 'Student Centre',
      to: 'City Mall',
      time: '10:00 AM',
      driver: 'Palesa M.',
      seats: 4,
    ),
  ];

  List<_RouteData> get _filteredRoutes {
    if (_selectedRoute == null) return _routes;
    return _routes.where((r) => r.name == _selectedRoute).toList();
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Campus Shuttle'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primaryAccent,
          labelColor: AppColors.primaryAccent,
          unselectedLabelColor: AppColors.textSecondary,
          tabs: const [
            Tab(text: 'Routes'),
            Tab(text: 'Ride Sharing'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildRoutesTab(isDark),
          _buildRideSharingTab(isDark),
        ],
      ),
    );
  }

  Widget _buildRoutesTab(bool isDark) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: [
                CampusChip(
                  label: 'All Routes',
                  isSelected: _selectedRoute == null,
                  onTap: () => setState(() => _selectedRoute = null),
                  icon: LucideIcons.bus,
                ),
                const SizedBox(width: 8),
                ..._routes.map((r) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: CampusChip(
                    label: 'Route ${r.number}',
                    isSelected: _selectedRoute == r.name,
                    onTap: () => setState(() => _selectedRoute = r.name),
                    icon: LucideIcons.map,
                  ),
                )),
              ],
            ),
          ),
        ),
        Expanded(
          child: _filteredRoutes.isEmpty
              ? EmptyState(
                  icon: LucideIcons.bus,
                  title: 'No Routes Found',
                  message: 'Try selecting a different filter.',
                )
              : ListView.builder(
                  physics: const BouncingScrollPhysics(),
                  itemCount: _filteredRoutes.length,
                  itemBuilder: (context, index) {
                    final route = _filteredRoutes[index];
                    return _buildRouteCard(route, isDark);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildRouteCard(_RouteData route, bool isDark) {
    return CampusCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.secondaryAccent.withValues(alpha: isDark ? 0.15 : 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(LucideIcons.bus, color: AppColors.secondaryAccent, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      route.name,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 2),
                    StatusBadge(text: 'Route ${route.number}', color: AppColors.secondaryAccent, isSmall: true),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primaryAccent.withValues(alpha: isDark ? 0.15 : 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'M${route.fare.toStringAsFixed(0)}',
                  style: TextStyle(
                    color: AppColors.primaryAccent,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(LucideIcons.flag, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 6),
              Text(
                route.start,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Icon(LucideIcons.arrowRight, size: 14, color: AppColors.textSecondary),
              ),
              Icon(LucideIcons.flag, size: 14, color: AppColors.secondaryAccent),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  route.end,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(LucideIcons.clock, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  route.schedule,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                ),
              ),
            ],
          ),
          if (route.stops.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              'Stops: ${route.stops.join(' → ')}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                  ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRideSharingTab(bool isDark) {
    if (_ridePosts.isEmpty) {
      return EmptyState(
        icon: LucideIcons.car,
        title: 'No Ride Shares',
        message: 'Check back later for available rides.',
      );
    }

    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.only(top: 8),
      itemCount: _ridePosts.length,
      itemBuilder: (context, index) {
        final post = _ridePosts[index];
        return _buildRidePostCard(post, isDark);
      },
    );
  }

  Widget _buildRidePostCard(_RidePostData post, bool isDark) {
    return CampusCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.tertiaryAccent.withValues(alpha: isDark ? 0.15 : 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(LucideIcons.user, color: AppColors.tertiaryAccent, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      post.driver,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(LucideIcons.clock, size: 12, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          post.time,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                                fontSize: 12,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              StatusBadge(
                text: '${post.seats} seat${post.seats > 1 ? 's' : ''}',
                color: post.seats > 1 ? AppColors.success : AppColors.warning,
                isSmall: true,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    Icon(LucideIcons.mapPin, size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        post.from,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Icon(LucideIcons.arrowRight, size: 16, color: AppColors.secondaryAccent),
              ),
              Expanded(
                child: Row(
                  children: [
                    Icon(LucideIcons.mapPin, size: 14, color: AppColors.secondaryAccent),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        post.to,
                        style: Theme.of(context).textTheme.bodySmall,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Join request sent!'),
                  duration: Duration(seconds: 2),
                ),
              ),
              icon: const Icon(LucideIcons.userPlus, size: 16),
              label: const Text('Join Ride'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.tertiaryAccent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RouteData {
  final String name;
  final String number;
  final String start;
  final String end;
  final double fare;
  final String schedule;
  final List<String> stops;

  const _RouteData({
    required this.name,
    required this.number,
    required this.start,
    required this.end,
    required this.fare,
    required this.schedule,
    required this.stops,
  });
}

class _RidePostData {
  final String from;
  final String to;
  final String time;
  final String driver;
  final int seats;

  const _RidePostData({
    required this.from,
    required this.to,
    required this.time,
    required this.driver,
    required this.seats,
  });
}
