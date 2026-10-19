import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/cards.dart';
import 'package:campusos/features/ai-tutor/screens/ai_tutor_screen.dart';

class AISuggestionCard extends StatelessWidget {
  final dynamic suggestion;

  const AISuggestionCard({super.key, required this.suggestion});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final sug = suggestion is Map ? suggestion as Map<String, dynamic> : null;

    return CampusCard(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AiTutorScreen())),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.violet, AppColors.indigo],
              ),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(LucideIcons.sparkles, color: Colors.white, size: 24),
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
                        color: AppColors.violet.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'AI SUGGESTION',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: AppColors.accentText(AppColors.violet, isDark: isDark),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  sug?['message'] ?? 'Study for tomorrow\'s quiz',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ],
            ),
          ),
          Icon(
            LucideIcons.chevronRight,
            size: 20,
            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
          ),
        ],
      ),
    );
  }
}
