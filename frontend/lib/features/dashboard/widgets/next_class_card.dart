import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/cards.dart';

class NextClassCard extends StatelessWidget {
  final dynamic classInfo;

  const NextClassCard({super.key, required this.classInfo});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final info = classInfo is Map ? classInfo as Map<String, dynamic> : null;

    return CampusCard(
      isHighlighted: true,
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              gradient: AppColors.heroGradient,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(LucideIcons.graduationCap, color: Colors.white, size: 24),
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
                        color: AppColors.secondaryAccent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'NEXT CLASS',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppColors.accentText(
                            AppColors.secondaryAccent,
                            isDark: Theme.of(context).brightness == Brightness.dark,
                          ),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  info?['name'] ?? 'Data Structures',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${info?['time'] ?? '10:00 AM'} · ${info?['room'] ?? 'Room 204'}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Column(
            children: [
              Text(
                  info?['timeUntil'] ?? '45m',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: AppColors.primaryAccent,
                      fontWeight: FontWeight.w700,
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
