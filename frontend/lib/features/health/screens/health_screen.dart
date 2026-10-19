import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class HealthScreen extends ConsumerStatefulWidget {
  const HealthScreen({super.key});

  @override
  ConsumerState<HealthScreen> createState() => _HealthScreenState();
}

class _HealthScreenState extends ConsumerState<HealthScreen> {
  final _medications = [
    _MedicationData('Ibuprofen 400mg', '1 tablet after lunch', true, 'Taken at 12:30'),
    _MedicationData('Allergy Tablet', '1 tablet before bed', false, 'Due at 21:00'),
    _MedicationData('Vitamin D', '1 capsule morning', true, 'Taken at 07:00'),
  ];

  final _safetyAlerts = const [
    _SafetyAlert('Water outage in Hostel H2', 'Facilities', '2h ago', AppColors.warning),
    _SafetyAlert('Road construction near North Gate', 'Security', '5h ago', AppColors.info),
    _SafetyAlert('Severe weather warning tomorrow', 'Emergency', '1d ago', AppColors.error),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('Health & Wellbeing', style: Theme.of(context).textTheme.headlineSmall),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Column(
                  children: [
                    CampusCard(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [AppColors.error, Color(0xFFDC2626)],
                      ),
                      padding: const EdgeInsets.all(24),
                      onTap: () => _showSOSDialog(context),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(LucideIcons.shieldAlert, color: Colors.white, size: 28),
                          const SizedBox(width: 12),
                          Text(
                            'Emergency SOS',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    CampusCard(
                      onTap: () {
                        final doctorCtrl = TextEditingController();
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
                                    decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
                                ),
                                const SizedBox(height: 16),
                                Text('Book Appointment', style: Theme.of(ctx).textTheme.titleMedium),
                                const SizedBox(height: 16),
                                TextField(
                                  controller: doctorCtrl,
                                  decoration: const InputDecoration(
                                    hintText: 'Doctor / Department',
                                    prefixIcon: Icon(LucideIcons.user, size: 18),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                TextField(
                                  decoration: const InputDecoration(
                                    hintText: 'Date',
                                    prefixIcon: Icon(LucideIcons.calendar, size: 18),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                TextField(
                                  decoration: const InputDecoration(
                                    hintText: 'Time',
                                    prefixIcon: Icon(LucideIcons.clock, size: 18),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                SizedBox(
                                  width: double.infinity,
                                  child: CampusButton(
                                    label: 'Book Appointment',
                                    onPressed: () {
                                      Navigator.pop(ctx);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Appointment booked')),
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
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: AppColors.primaryAccent.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(LucideIcons.calendarCheck, color: AppColors.primaryAccent, size: 24),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Book Appointment', style: Theme.of(context).textTheme.titleSmall),
                                Text(
                                  'Campus clinic or telehealth',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right, size: 20),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SectionHeader(title: 'Safety Alerts'),
            ),
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final alert = _safetyAlerts[index];
                  return CampusCard(
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: alert.color.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            alert.color == AppColors.error
                                ? LucideIcons.alertTriangle
                                : alert.color == AppColors.warning
                                    ? LucideIcons.alertCircle
                                    : LucideIcons.info,
                            color: alert.color,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(alert.title, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontSize: 13)),
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  Text(alert.source, style: Theme.of(context).textTheme.bodySmall),
                                  const SizedBox(width: 8),
                                  Text(alert.time, style: Theme.of(context).textTheme.bodySmall),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
                childCount: _safetyAlerts.length,
              ),
            ),
            SliverToBoxAdapter(
                child: SectionHeader(
                  title: 'Medication Reminders',
                  actionText: 'Add',
                  onAction: () {
                    final nameCtrl = TextEditingController();
                    final instrCtrl = TextEditingController();
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
                                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
                            ),
                            const SizedBox(height: 16),
                            Text('Add Medication', style: Theme.of(ctx).textTheme.titleMedium),
                            const SizedBox(height: 16),
                            TextField(
                              controller: nameCtrl,
                              decoration: const InputDecoration(
                                hintText: 'Medication name',
                                prefixIcon: Icon(LucideIcons.pill, size: 18),
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: instrCtrl,
                              decoration: const InputDecoration(
                                hintText: 'Dosage & instructions',
                                prefixIcon: Icon(LucideIcons.fileText, size: 18),
                              ),
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: CampusButton(
                                label: 'Add Reminder',
                                onPressed: () {
                                  Navigator.pop(ctx);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Medication reminder added')),
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
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final med = _medications[index];
                  return CampusCard(
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: med.taken
                                ? AppColors.success.withValues(alpha: 0.12)
                                : AppColors.warning.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            med.taken ? LucideIcons.check : LucideIcons.clock,
                            color: med.taken ? AppColors.success : AppColors.warning,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(med.name, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontSize: 13)),
                              const SizedBox(height: 2),
                              Text(med.instruction, style: Theme.of(context).textTheme.bodySmall),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            StatusBadge(
                              text: med.taken ? 'Done' : 'Pending',
                              color: med.taken ? AppColors.success : AppColors.warning,
                              isSmall: true,
                            ),
                            const SizedBox(height: 4),
                            Text(med.time, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10)),
                          ],
                        ),
                      ],
                    ),
                  );
                },
                childCount: _medications.length,
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  void _showSOSDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(LucideIcons.shieldAlert, color: AppColors.error),
            const SizedBox(width: 8),
            const Text('Emergency SOS'),
          ],
        ),
        content: const Text(
          'This will alert campus security with your location and notify your emergency contacts. Continue?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Send SOS'),
          ),
        ],
      ),
    );
  }
}

class _MedicationData {
  final String name;
  final String instruction;
  final bool taken;
  final String time;

  const _MedicationData(this.name, this.instruction, this.taken, this.time);
}

class _SafetyAlert {
  final String title;
  final String source;
  final String time;
  final Color color;

  const _SafetyAlert(this.title, this.source, this.time, this.color);
}
