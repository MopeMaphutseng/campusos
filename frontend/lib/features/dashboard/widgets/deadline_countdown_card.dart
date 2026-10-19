import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/cards.dart';

class DeadlineCountdownCard extends StatelessWidget {
  final dynamic deadline;

  const DeadlineCountdownCard({super.key, required this.deadline});

  @override
  Widget build(BuildContext context) {
    final dl = deadline is Map ? deadline as Map<String, dynamic> : null;
    return CampusCard(
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.warning.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(LucideIcons.clock, color: AppColors.warning, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'DEADLINE',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: AppColors.warning,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  dl?['name'] ?? 'Assignment 3',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${dl?['course'] ?? 'CS201'} · Due ${dl?['dueDate'] ?? 'Tomorrow'}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Column(
            children: [
              Text(
                dl?['daysLeft'] ?? '2d',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: AppColors.warning,
                      fontWeight: FontWeight.w800,
                    ),
              ),
              Text(
                'left',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
