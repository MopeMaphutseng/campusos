import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/cards.dart';

class WeatherWidget extends StatelessWidget {
  final int temp;
  final String condition;

  const WeatherWidget({
    super.key,
    required this.temp,
    required this.condition,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Icon(
            LucideIcons.cloudSun,
            size: 20,
            color: AppColors.secondaryAccent,
          ),
          const SizedBox(width: 8),
          Text(
            '$temp°C',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(width: 6),
          Text(
            condition,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }
}
