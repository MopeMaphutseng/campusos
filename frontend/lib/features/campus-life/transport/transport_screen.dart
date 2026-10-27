import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/campus-life/providers/campus_life_providers.dart';

class TransportScreen extends ConsumerStatefulWidget {
  const TransportScreen({super.key});

  @override
  ConsumerState<TransportScreen> createState() => _TransportScreenState();
}

class _TransportScreenState extends ConsumerState<TransportScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  String? _selectedRouteId;

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
    final routesAsync = ref.watch(transportRoutesProvider);
    return routesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => const EmptyState(
        icon: LucideIcons.wifiOff,
        title: 'Shuttle data unavailable',
        message: 'Could not reach the transport service. Pull to retry.',
      ),
      data: (routes) {
        final filtered = _selectedRouteId == null
            ? routes
            : routes.where((r) => r.id == _selectedRouteId).toList();
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(transportRoutesProvider),
          child: Column(
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
                        isSelected: _selectedRouteId == null,
                        onTap: () => setState(() => _selectedRouteId = null),
                        icon: LucideIcons.bus,
                      ),
                      const SizedBox(width: 8),
                      ...routes.map((r) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: CampusChip(
                              label: 'Route ${r.routeNumber}',
                              isSelected: _selectedRouteId == r.id,
                              onTap: () => setState(() => _selectedRouteId = r.id),
                              icon: LucideIcons.map,
                            ),
                          )),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: filtered.isEmpty
                    ? const EmptyState(
                        icon: LucideIcons.bus,
                        title: 'No Routes Found',
                        message: 'Try selecting a different filter.',
                      )
                    : ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(
                            parent: BouncingScrollPhysics()),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) =>
                            _buildRouteCard(filtered[index], isDark),
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRouteCard(TransportRoute route, bool isDark) {
    final liveAsync = ref.watch(shuttleLiveProvider(route.id));
    final live = liveAsync.asData?.value;

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
                child: const Icon(LucideIcons.bus, color: AppColors.secondaryAccent, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      route.routeName,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        StatusBadge(
                          text: 'Route ${route.routeNumber}',
                          color: AppColors.secondaryAccent,
                          isSmall: true,
                        ),
                        const SizedBox(width: 6),
                        if (live?.lastUpdated != null)
                          StatusBadge.success('Live'),
                      ],
                    ),
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
                  route.fare > 0 ? 'M${route.fare.toStringAsFixed(0)}' : 'Free',
                  style: const TextStyle(
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
              const Icon(LucideIcons.flag, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  route.startLocation,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: Icon(LucideIcons.arrowRight, size: 14, color: AppColors.textSecondary),
              ),
              const Icon(LucideIcons.flag, size: 14, color: AppColors.secondaryAccent),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  route.endLocation,
                  overflow: TextOverflow.ellipsis,
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
              const Icon(LucideIcons.users, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 6),
              Text(
                '${route.vehicleType} · ${route.capacity} seats',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
              ),
            ],
          ),
          const Divider(height: 20),
          if (liveAsync.isLoading && live == null)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Center(
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else if (live != null && live.stops.isNotEmpty)
            _buildStopTimeline(live, isDark)
          else if (route.stops.isNotEmpty)
            _buildStopTimeline(
              ShuttleLive(
                lat: null,
                lng: null,
                lastUpdated: null,
                stops: route.stops,
              ),
              isDark,
            ),
        ],
      ),
    );
  }

  Widget _buildStopTimeline(ShuttleLive live, bool isDark) {
    final stops = [...live.stops]..sort((a, b) => a.order.compareTo(b.order));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(LucideIcons.navigation, size: 14, color: AppColors.primaryAccent),
            const SizedBox(width: 6),
            Text(
              'Next arrivals',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...stops.map((stop) {
          final eta = stop.etaMinutes;
          return Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(
              children: [
                Icon(LucideIcons.mapPin,
                    size: 12,
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    stop.name,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 12),
                  ),
                ),
                if (stop.distanceKm != null)
                  Text(
                    '${stop.distanceKm!.toStringAsFixed(1)} km',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontSize: 11,
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
                        ),
                  ),
                const SizedBox(width: 8),
                if (eta != null)
                  StatusBadge.success('$eta min')
                else
                  StatusBadge.info('—'),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildRideSharingTab(bool isDark) {
    if (_ridePosts.isEmpty) {
      return const EmptyState(
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
                child: const Icon(LucideIcons.user, color: AppColors.tertiaryAccent, size: 22),
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
                        const Icon(LucideIcons.clock, size: 12, color: AppColors.textSecondary),
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
                    const Icon(LucideIcons.mapPin, size: 14, color: AppColors.textSecondary),
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
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: Icon(LucideIcons.arrowRight, size: 16, color: AppColors.secondaryAccent),
              ),
              Expanded(
                child: Row(
                  children: [
                    const Icon(LucideIcons.mapPin, size: 14, color: AppColors.secondaryAccent),
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
