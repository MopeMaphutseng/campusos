import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

enum BuildingCategory { academic, hostel, lab, clinic, atm, all }

class CampusMapScreen extends ConsumerStatefulWidget {
  const CampusMapScreen({super.key});

  @override
  ConsumerState<CampusMapScreen> createState() => _CampusMapScreenState();
}

class _CampusMapScreenState extends ConsumerState<CampusMapScreen> {
  BuildingCategory _selectedCategory = BuildingCategory.all;
  bool _accessibleRoute = false;

  final _buildings = const [
    _BuildingData('Science & Technology Block', BuildingCategory.academic, 'A1', AppColors.primaryAccent, LucideIcons.microscope),
    _BuildingData('Engineering Building', BuildingCategory.academic, 'A2', AppColors.primaryAccent, LucideIcons.cog),
    _BuildingData('Library', BuildingCategory.academic, 'A3', AppColors.primaryAccent, LucideIcons.bookOpen),
    _BuildingData('Humanities Block', BuildingCategory.academic, 'A4', AppColors.primaryAccent, LucideIcons.graduationCap),
    _BuildingData('Boys Residence Hall', BuildingCategory.hostel, 'H1', AppColors.info, LucideIcons.building),
    _BuildingData('Girls Residence Hall', BuildingCategory.hostel, 'H2', AppColors.info, LucideIcons.building),
    _BuildingData('Postgraduate Village', BuildingCategory.hostel, 'H3', AppColors.info, LucideIcons.building),
    _BuildingData('Computer Science Lab', BuildingCategory.lab, 'L1', AppColors.tertiaryAccent, LucideIcons.monitor),
    _BuildingData('Physics Lab', BuildingCategory.lab, 'L2', AppColors.tertiaryAccent, LucideIcons.atom),
    _BuildingData('Campus Clinic', BuildingCategory.clinic, 'C1', AppColors.error, LucideIcons.heartPulse),
    _BuildingData('ATM – Standard Bank', BuildingCategory.atm, 'ATM1', AppColors.secondaryAccent, LucideIcons.banknote),
    _BuildingData('ATM – FNB', BuildingCategory.atm, 'ATM2', AppColors.secondaryAccent, LucideIcons.banknote),
    _BuildingData('Cafeteria', BuildingCategory.academic, 'F1', AppColors.tertiaryAccent, LucideIcons.utensils),
  ];

  List<_BuildingData> get _filteredBuildings {
    if (_selectedCategory == BuildingCategory.all) return _buildings;
    return _buildings.where((b) => b.category == _selectedCategory).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Campus Map'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          Row(
            children: [
              Text('Accessible', style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11)),
              Switch(
                value: _accessibleRoute,
                onChanged: (v) => setState(() => _accessibleRoute = v),
                activeColor: AppColors.tertiaryAccent,
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            flex: 5,
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08),
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppColors.tertiaryAccent.withValues(alpha: 0.08),
                            AppColors.primaryAccent.withValues(alpha: 0.05),
                          ],
                        ),
                      ),
                    ),
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.map, size: 48, color: AppColors.textSecondary.withValues(alpha: 0.3)),
                          const SizedBox(height: 12),
                          Text(
                            'Interactive Map',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Tap a building in the list below',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    ..._filteredBuildings.asMap().entries.map((entry) {
                      final i = entry.key;
                      final b = entry.value;
                      final x = (i % 4) * 0.25 + 0.1;
                      final y = (i ~/ 4) * 0.3 + 0.15;
                      return Positioned(
                        left: x * 300,
                        top: y * 250,
                        child: _mapMarker(b, isDark),
                      );
                    }),
                    if (_accessibleRoute)
                      Positioned(
                        bottom: 12,
                        left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.tertiaryAccent.withValues(alpha: 0.9),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(LucideIcons.accessibility, size: 14, color: Colors.white),
                              SizedBox(width: 6),
                              Text('Accessible Route', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              physics: const BouncingScrollPhysics(),
              itemCount: BuildingCategory.values.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final cat = BuildingCategory.values[index];
                final labels = {
                  BuildingCategory.all: 'All',
                  BuildingCategory.academic: 'Academic',
                  BuildingCategory.hostel: 'Hostel',
                  BuildingCategory.lab: 'Lab',
                  BuildingCategory.clinic: 'Clinic',
                  BuildingCategory.atm: 'ATM',
                };
                return CampusChip(
                  label: labels[cat]!,
                  isSelected: _selectedCategory == cat,
                  onTap: () => setState(() => _selectedCategory = cat),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            flex: 4,
            child: ListView.builder(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _filteredBuildings.length,
              itemBuilder: (context, index) {
                final b = _filteredBuildings[index];
                return ListTile(
                  onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
                  leading: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: b.color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(b.icon, color: b.color, size: 20),
                  ),
                  title: Text(b.name, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontSize: 13)),
                  subtitle: Text('Code: ${b.code}', style: Theme.of(context).textTheme.bodySmall),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CampusIconButton(
                        icon: LucideIcons.navigation,
                        onPressed: () {
                          final fromCtrl = TextEditingController();
                          final toCtrl = TextEditingController();
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
                                  Text('Directions', style: Theme.of(ctx).textTheme.titleMedium),
                                  const SizedBox(height: 16),
                                  TextField(
                                    controller: fromCtrl,
                                    decoration: const InputDecoration(
                                      hintText: 'Starting point',
                                      prefixIcon: Icon(LucideIcons.mapPin, size: 18),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  TextField(
                                    controller: toCtrl,
                                    decoration: const InputDecoration(
                                      hintText: 'Destination',
                                      prefixIcon: Icon(LucideIcons.flag, size: 18),
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  SizedBox(
                                    width: double.infinity,
                                    child: CampusButton(
                                      label: 'Get Directions',
                                      icon: LucideIcons.navigation,
                                      onPressed: () {
                                        Navigator.pop(ctx);
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(content: Text('Navigation directions loaded')),
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
                        size: 32,
                      ),
                      if (_accessibleRoute)
                        CampusIconButton(
                          icon: LucideIcons.accessibility,
                          onPressed: () {
                            showModalBottomSheet(
                              context: context,
                              builder: (ctx) => Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Center(
                                    child: Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12, bottom: 8),
                                      decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2))),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Text('Accessibility Options', style: Theme.of(ctx).textTheme.titleMedium),
                                  ),
                                  SwitchListTile(
                                    title: const Text('Accessible Routes'),
                                    subtitle: const Text('Show wheelchair-friendly paths'),
                                    value: _accessibleRoute,
                                    onChanged: (v) {
                                      setState(() => _accessibleRoute = v);
                                      Navigator.pop(ctx);
                                    },
                                    secondary: const Icon(LucideIcons.accessibility, color: AppColors.tertiaryAccent),
                                  ),
                                  ListTile(
                                    leading: const Icon(LucideIcons.volume2, color: AppColors.info),
                                    title: const Text('Audio Guidance'),
                                    subtitle: const Text('Voice-guided navigation'),
                                    onTap: () => Navigator.pop(ctx),
                                  ),
                                  ListTile(
                                    leading: const Icon(LucideIcons.eye, color: AppColors.primaryAccent),
                                    title: const Text('High Contrast Mode'),
                                    subtitle: const Text('Enhanced visibility'),
                                    onTap: () => Navigator.pop(ctx),
                                  ),
                                  const SizedBox(height: 8),
                                ],
                              ),
                            );
                          },
                          size: 32,
                          color: AppColors.tertiaryAccent,
                        ),
                    ],
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 4),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _mapMarker(_BuildingData building, bool isDark) {
    return GestureDetector(
      onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: building.color,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: building.color.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Icon(building.icon, color: Colors.white, size: 16),
      ),
    );
  }
}

class _BuildingData {
  final String name;
  final BuildingCategory category;
  final String code;
  final Color color;
  final IconData icon;

  const _BuildingData(this.name, this.category, this.code, this.color, this.icon);
}
