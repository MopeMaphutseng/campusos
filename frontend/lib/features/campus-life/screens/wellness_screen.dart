import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class WellnessScreen extends ConsumerStatefulWidget {
  const WellnessScreen({super.key});

  @override
  ConsumerState<WellnessScreen> createState() => _WellnessScreenState();
}

class _WellnessScreenState extends ConsumerState<WellnessScreen> {
  final List<_WellnessTip> _tips = const [
    _WellnessTip(
      title: 'Managing Exam Stress',
      preview: 'Simple breathing techniques and time management strategies to help you stay calm during exams.',
      category: 'Stress Management',
    ),
    _WellnessTip(
      title: 'Sleep Hygiene for Students',
      preview: 'How to improve your sleep quality with consistent routines and screen-free wind-down habits.',
      category: 'Sleep',
    ),
    _WellnessTip(
      title: 'Mindful Morning Rituals',
      preview: 'Start your day with intention using these five-minute mindfulness exercises.',
      category: 'Mindfulness',
    ),
    _WellnessTip(
      title: 'Building Resilience',
      preview: 'Develop mental toughness and adaptability to navigate academic and personal challenges.',
      category: 'Mental Health',
    ),
  ];

  Future<void> _showSosDialog() async {
    final theme = Theme.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(LucideIcons.phoneCall, color: AppColors.redDeep, size: 22),
            const SizedBox(width: 10),
            Text('Emergency SOS', style: theme.textTheme.titleMedium),
          ],
        ),
        content: Text(
          'If you are in immediate danger or need urgent help, please call campus security or a crisis helpline.\n\n'
          'Would you like to proceed to emergency contacts?',
          style: theme.textTheme.bodyMedium,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.redDeep,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Call Helpline'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Emergency contacts displayed. Please call for help.'),
          backgroundColor: AppColors.redDeep,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Wellness'),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
        children: [
          _buildHeroCard(),
          const SizedBox(height: 20),
          _buildSectionTitle('Quick Actions'),
          const SizedBox(height: 10),
          _buildCounsellingCard(),
          const SizedBox(height: 10),
          _buildMeditationCard(),
          const SizedBox(height: 10),
          _buildCrisisSupportCard(),
          const SizedBox(height: 24),
          _buildSectionTitle('Wellness Tips'),
          const SizedBox(height: 10),
          ..._tips.map(_buildTipCard),
        ],
      ),
      bottomNavigationBar: _buildSosButton(),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title, style: Theme.of(context).textTheme.headlineSmall);
  }

  Widget _buildHeroCard() {
    final theme = Theme.of(context);
    return CampusCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primaryAccent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(LucideIcons.heart, color: AppColors.primaryAccent, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Mental Health & Wellness', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'You are not alone. We are here for you.',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(LucideIcons.phone, size: 16, color: theme.textTheme.bodySmall?.color),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '24/7 Helpline: 1800-123-4567',
                  style: theme.textTheme.titleSmall?.copyWith(letterSpacing: 0.3),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Free, confidential support for all students.',
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    Color? iconColor,
    Color? backgroundColor,
    VoidCallback? onTap,
  }) {
    final theme = Theme.of(context);
    return CampusCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: (backgroundColor ?? AppColors.primaryAccent).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor ?? AppColors.primaryAccent, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: theme.textTheme.titleSmall),
                const SizedBox(height: 2),
                Text(subtitle, style: theme.textTheme.bodySmall),
              ],
            ),
          ),
          Icon(LucideIcons.chevronRight, size: 18, color: theme.textTheme.bodySmall?.color),
        ],
      ),
    );
  }

  Widget _buildCounsellingCard() {
    return _buildActionCard(
      icon: LucideIcons.calendar,
      title: 'Book Counselling',
      subtitle: 'Schedule a session with a counselor',
    );
  }

  Widget _buildMeditationCard() {
    return _buildActionCard(
      icon: LucideIcons.heart,
      title: 'Meditation Guide',
      subtitle: 'Guided sessions for relaxation',
    );
  }

  Widget _buildCrisisSupportCard() {
    return _buildActionCard(
      icon: LucideIcons.phone,
      title: 'Crisis Support',
      subtitle: 'Immediate help when you need it',
      iconColor: AppColors.redDeep,
      backgroundColor: AppColors.redDeep,
    );
  }

  Widget _buildTipCard(_WellnessTip tip) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: CampusCard(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primaryAccent.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(LucideIcons.bookOpen, size: 18, color: AppColors.primaryAccent),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(tip.title, style: theme.textTheme.titleSmall),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              tip.preview,
              style: theme.textTheme.bodySmall,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 10),
            StatusBadge(
              text: tip.category,
              color: AppColors.primaryAccent,
              isSmall: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSosButton() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: _showSosDialog,
            icon: const Icon(LucideIcons.phoneCall, size: 22),
            label: const Text(
              'Emergency SOS',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, letterSpacing: 0.5),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.redDeep,
              foregroundColor: Colors.white,
              elevation: 4,
              shadowColor: AppColors.redDeep.withValues(alpha: 0.4),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
        ),
      ),
    );
  }
}

class _WellnessTip {
  final String title;
  final String preview;
  final String category;

  const _WellnessTip({
    required this.title,
    required this.preview,
    required this.category,
  });
}
