import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class HostelScreen extends ConsumerStatefulWidget {
  const HostelScreen({super.key});

  @override
  ConsumerState<HostelScreen> createState() => _HostelScreenState();
}

enum _ResidenceAvailability { available, full, maintenance }

class _HostelScreenState extends ConsumerState<HostelScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  final _residences = const [
    _ResidenceData(
      'Khumalo Hall',
      'Male',
      120, 18,
      4500,
      LucideIcons.building,
      AppColors.info,
      _ResidenceAvailability.available,
    ),
    _ResidenceData(
      'Mofolo Hall',
      'Female',
      100, 0,
      4200,
      LucideIcons.building,
      AppColors.info,
      _ResidenceAvailability.full,
    ),
    _ResidenceData(
      'Postgraduate Village',
      'Mixed',
      80, 12,
      5500,
      LucideIcons.home,
      AppColors.tertiaryAccent,
      _ResidenceAvailability.available,
    ),
    _ResidenceData(
      'Lentswe La Phala',
      'Male',
      90, 3,
      4800,
      LucideIcons.building2,
      AppColors.warning,
      _ResidenceAvailability.maintenance,
    ),
    _ResidenceData(
      'Mphatlalatsane',
      'Female',
      110, 25,
      4600,
      LucideIcons.building,
      AppColors.info,
      _ResidenceAvailability.available,
    ),
    _ResidenceData(
      'International House',
      'Mixed',
      60, 0,
      6200,
      LucideIcons.globe,
      AppColors.primaryAccent,
      _ResidenceAvailability.full,
    ),
  ];

  final _applications = const [
    _ApplicationData('Khumalo Hall', 'Pending'),
    _ApplicationData('Mphatlalatsane', 'Approved'),
    _ApplicationData('Postgraduate Village', 'Rejected'),
  ];

  final _maintenanceRequests = const [
    _MaintenanceRequest('Room 204 Light Fitting', 'In Progress', AppColors.warning, LucideIcons.lightbulb),
    _MaintenanceRequest('Broken Window - Block C', 'Pending', AppColors.info, LucideIcons.wind),
    _MaintenanceRequest('Plumbing - Block A Bathroom', 'Completed', AppColors.success, LucideIcons.wrench),
    _MaintenanceRequest('Heater not working - Room 112', 'Pending', AppColors.info, LucideIcons.thermometer),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
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
        title: const Text('Hostel Services'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primaryAccent,
          labelColor: AppColors.primaryAccent,
          unselectedLabelColor: AppColors.textSecondary,
          tabs: const [
            Tab(text: 'Residences'),
            Tab(text: 'Applications'),
            Tab(text: 'Maintenance'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildResidencesTab(isDark),
          _buildApplicationsTab(isDark),
          _buildMaintenanceTab(isDark),
        ],
      ),
    );
  }

  Widget _buildResidencesTab(bool isDark) {
    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _residences.length,
      itemBuilder: (context, index) {
        final r = _residences[index];
        final availabilityColor = switch (r.availability) {
          _ResidenceAvailability.available => AppColors.success,
          _ResidenceAvailability.full => AppColors.error,
          _ResidenceAvailability.maintenance => AppColors.warning,
        };
        final availabilityLabel = switch (r.availability) {
          _ResidenceAvailability.available => 'Available',
          _ResidenceAvailability.full => 'Full',
          _ResidenceAvailability.maintenance => 'Maintenance',
        };

        return CampusCard(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: r.color.withValues(alpha: isDark ? 0.15 : 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(r.icon, color: r.color, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          r.name,
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        Text(
                          r.gender,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  StatusBadge(text: availabilityLabel, color: availabilityColor),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _statChip(LucideIcons.bed, '${r.availableBeds}/${r.totalBeds} Beds', isDark),
                  const SizedBox(width: 8),
                  _statChip(LucideIcons.user, r.gender, isDark),
                  const Spacer(),
                  Text(
                    'M${r.pricePerSemester}',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: AppColors.primaryAccent,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _statChip(IconData icon, String label, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.textSecondary),
          const SizedBox(width: 4),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }

  Widget _buildApplicationsTab(bool isDark) {
    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _applications.length,
      itemBuilder: (context, index) {
        final a = _applications[index];
        final (color, icon) = switch (a.status) {
          'Approved' => (AppColors.success, LucideIcons.checkCircle),
          'Rejected' => (AppColors.error, LucideIcons.xCircle),
          _ => (AppColors.warning, LucideIcons.clock),
        };

        return CampusCard(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your application for ${a.hostel}',
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Status: ${a.status}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(color: color),
                    ),
                  ],
                ),
              ),
              StatusBadge(text: a.status, color: color),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMaintenanceTab(bool isDark) {
    return Column(
      children: [
        Expanded(
          child: _maintenanceRequests.isEmpty
              ? const EmptyState(
                  icon: LucideIcons.wrench,
                  title: 'No Requests',
                  message: 'Submit a maintenance request to get started',
                )
              : ListView.builder(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: _maintenanceRequests.length,
                  itemBuilder: (context, index) {
                    final m = _maintenanceRequests[index];
                    return CampusCard(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: m.color.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(m.icon, color: m.color, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  m.title,
                                  style: Theme.of(context).textTheme.titleSmall,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Status: ${m.status}',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          StatusBadge(text: m.status, color: m.color),
                        ],
                      ),
                    );
                  },
                ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: CampusButton(
              label: 'Submit Request',
              icon: LucideIcons.plus,
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Maintenance request submitted'),
                  duration: Duration(seconds: 2),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ResidenceData {
  final String name;
  final String gender;
  final int totalBeds;
  final int availableBeds;
  final int pricePerSemester;
  final IconData icon;
  final Color color;
  final _ResidenceAvailability availability;

  const _ResidenceData(
    this.name,
    this.gender,
    this.totalBeds,
    this.availableBeds,
    this.pricePerSemester,
    this.icon,
    this.color,
    this.availability,
  );
}

class _ApplicationData {
  final String hostel;
  final String status;

  const _ApplicationData(this.hostel, this.status);
}

class _MaintenanceRequest {
  final String title;
  final String status;
  final Color color;
  final IconData icon;

  const _MaintenanceRequest(this.title, this.status, this.color, this.icon);
}
