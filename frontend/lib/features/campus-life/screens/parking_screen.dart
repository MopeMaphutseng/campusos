import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class ParkingScreen extends ConsumerStatefulWidget {
  const ParkingScreen({super.key});

  @override
  ConsumerState<ParkingScreen> createState() => _ParkingScreenState();
}

class _ParkingScreenState extends ConsumerState<ParkingScreen> {
  final _lots = const [
    _ParkingLotData('Lot A – Main Campus', 120, 34, 5.0),
    _ParkingLotData('Lot B – Science Block', 80, 0, 5.0),
    _ParkingLotData('Lot C – Library', 60, 12, 6.0),
    _ParkingLotData('Lot D – Residence Halls', 200, 78, 3.0),
    _ParkingLotData('Lot E – Sports Complex', 45, 8, 4.0),
    _ParkingLotData('Staff Lot – Admin Block', 30, 2, 7.0),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Parking'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: CampusCard(
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.primaryAccent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(LucideIcons.creditCard, color: AppColors.primaryAccent, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Current Permit', style: Theme.of(context).textTheme.titleSmall),
                        const SizedBox(height: 2),
                        Text(
                          'Student Permit B – expires Dec 2026',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.tertiaryAccent,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ],
                    ),
                  ),
                  StatusBadge.success('Active'),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: CampusButton(
                      label: 'Buy Permit',
                      icon: LucideIcons.shoppingCart,
                      onPressed: () {
                        final vehicleCtrl = TextEditingController();
                        final plateCtrl = TextEditingController();
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          builder: (ctx) => Padding(
                            padding: EdgeInsets.only(
                              bottom: MediaQuery.of(ctx).viewInsets.bottom,
                              left: 20, right: 20, top: 12,
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Center(
                                  child: Container(width: 40, height: 4,
                                    decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2))),
                                ),
                                const SizedBox(height: 16),
                                Text('Buy Parking Permit', style: Theme.of(ctx).textTheme.titleMedium),
                                const SizedBox(height: 16),
                                TextField(
                                  controller: vehicleCtrl,
                                  decoration: const InputDecoration(
                                    hintText: 'Vehicle Model',
                                    prefixIcon: Icon(LucideIcons.car, size: 18),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                TextField(
                                  controller: plateCtrl,
                                  decoration: const InputDecoration(
                                    hintText: 'License Plate',
                                    prefixIcon: Icon(LucideIcons.hash, size: 18),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                SizedBox(
                                  width: double.infinity,
                                  child: CampusButton(
                                    label: 'Purchase Permit',
                                    onPressed: () {
                                      Navigator.pop(ctx);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Permit purchased successfully')),
                                      );
                                    },
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: CampusButton(
                      label: 'Report Issue',
                      icon: LucideIcons.flag,
                      onPressed: () {
                        final descCtrl = TextEditingController();
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          builder: (ctx) => Padding(
                            padding: EdgeInsets.only(
                              bottom: MediaQuery.of(ctx).viewInsets.bottom,
                              left: 20, right: 20, top: 12,
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Center(
                                  child: Container(width: 40, height: 4,
                                    decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2))),
                                ),
                                const SizedBox(height: 16),
                                Text('Report an Issue', style: Theme.of(ctx).textTheme.titleMedium),
                                const SizedBox(height: 16),
                                TextField(
                                  controller: descCtrl,
                                  maxLines: 4,
                                  decoration: const InputDecoration(
                                    hintText: 'Describe the issue (e.g., broken gate, unauthorized vehicle)...',
                                    alignLabelWithHint: true,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                SizedBox(
                                  width: double.infinity,
                                  child: CampusButton(
                                    label: 'Submit Report',
                                    icon: LucideIcons.send,
                                    onPressed: () {
                                      Navigator.pop(ctx);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Issue reported')),
                                      );
                                    },
                                    backgroundColor: AppColors.error,
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],
                            ),
                          ),
                        );
                      },
                      backgroundColor: AppColors.error,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                'Parking Lots',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final lot = _lots[index];
                return _ParkingLotCard(lot: lot, isDark: isDark);
              },
              childCount: _lots.length,
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }
}

class _ParkingLotCard extends StatelessWidget {
  final _ParkingLotData lot;
  final bool isDark;

  const _ParkingLotCard({required this.lot, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final availabilityColor = lot.isFull ? AppColors.error : AppColors.success;
    final availabilityText = lot.isFull ? 'Full' : 'Available';

    return CampusCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: lot.isFull
                  ? AppColors.error.withValues(alpha: 0.12)
                  : AppColors.tertiaryAccent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              LucideIcons.car,
              color: lot.isFull ? AppColors.error : AppColors.tertiaryAccent,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(lot.name, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontSize: 13)),
                const SizedBox(height: 4),
                Text(
                  '${lot.availableSpots}/${lot.totalSpots} spots \u2022 M${lot.ratePerHour.toStringAsFixed(1)}/hr',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11),
                ),
              ],
            ),
          ),
          StatusBadge(text: availabilityText, color: availabilityColor),
        ],
      ),
    );
  }
}

class _ParkingLotData {
  final String name;
  final int totalSpots;
  final int availableSpots;
  final double ratePerHour;

  bool get isFull => availableSpots == 0;

  const _ParkingLotData(this.name, this.totalSpots, this.availableSpots, this.ratePerHour);
}
