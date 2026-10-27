import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/mentorship/providers/mentorship_provider.dart';

class MentorshipScreen extends ConsumerStatefulWidget {
  const MentorshipScreen({super.key});

  @override
  ConsumerState<MentorshipScreen> createState() => _MentorshipScreenState();
}

class _MentorshipScreenState extends ConsumerState<MentorshipScreen> {
  String _selectedField = 'All';
  final _fields = ['All', 'Computer Science', 'Engineering', 'Business', 'Mathematics', 'Science'];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final mentorsAsync = ref.watch(mentorsProvider);

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('Mentor Hub', style: Theme.of(context).textTheme.headlineSmall),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: CampusCard(
                  gradient: AppColors.heroGradient,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(LucideIcons.sparkles, color: Colors.white.withValues(alpha: 0.9), size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'AI Mentor Match',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Get paired with the ideal mentor based on your goals, courses, and learning style.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.85),
                            ),
                      ),
                      const SizedBox(height: 14),
                      ElevatedButton(
                        onPressed: () {
                          final goalsCtrl = TextEditingController();
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
                                  Text('Mentorship Request', style: Theme.of(ctx).textTheme.titleMedium),
                                  const SizedBox(height: 16),
                                  TextField(
                                    controller: goalsCtrl,
                                    maxLines: 4,
                                    decoration: const InputDecoration(
                                      hintText: 'Describe your goals and what you\'re looking for in a mentor...',
                                      alignLabelWithHint: true,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  SizedBox(
                                    width: double.infinity,
                                    child: CampusButton(
                                      label: 'Find My Mentor',
                                      icon: LucideIcons.sparkles,
                                      onPressed: () {
                                        Navigator.pop(ctx);
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(content: Text('Mentor matching initiated')),
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
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: AppColors.primary,
                        ),
                        child: const Text('Find My Mentor'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 48,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  physics: const BouncingScrollPhysics(),
                  itemCount: _fields.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    return CampusChip(
                      label: _fields[index],
                      isSelected: _selectedField == _fields[index],
                      onTap: () => setState(() => _selectedField = _fields[index]),
                    );
                  },
                ),
              ),
            ),
            mentorsAsync.when(
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, st) => SliverFillRemaining(
                child: EmptyState(
                  icon: LucideIcons.alertCircle,
                  title: 'Something went wrong',
                  message: 'Pull to refresh and try again',
                  actionLabel: 'Retry',
                  onAction: () => ref.invalidate(mentorsProvider),
                ),
              ),
              data: (mentors) {
                final filtered = _selectedField == 'All'
                    ? mentors
                    : mentors.where((m) => m.expertise.any(
                        (e) => e.toLowerCase().contains(_selectedField.toLowerCase()),
                      )).toList();
                if (filtered.isEmpty) {
                  return const SliverFillRemaining(
                    child: EmptyState(
                      icon: LucideIcons.users,
                      title: 'No mentors found',
                      message: 'Try selecting a different field.',
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.only(top: 8, left: 16, right: 16, bottom: 100),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      childAspectRatio: 0.85,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _MentorCard(
                        mentor: filtered[index],
                        isDark: isDark,
                      ),
                      childCount: filtered.length,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _MentorCard extends StatelessWidget {
  final MentorProfile mentor;
  final bool isDark;

  const _MentorCard({required this.mentor, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final initials = mentor.name.split(' ').where((w) => w.isNotEmpty).map((w) => w[0]).take(2).join().toUpperCase();
    final expertiseStr = mentor.expertise.join(', ');
    final isAvailable = mentor.status == 'active';

    return CampusCard(
      padding: const EdgeInsets.all(14),
      margin: EdgeInsets.zero,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          UserAvatar(
            initials: initials,
            size: 56,
            isVerified: isAvailable,
          ),
          const SizedBox(height: 10),
          Text(
            mentor.name,
            style: Theme.of(context).textTheme.titleSmall,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            expertiseStr,
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.star, size: 14, color: AppColors.secondaryAccent),
              const SizedBox(width: 3),
              Text(
                mentor.averageRating.toString(),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              Text(
                '${mentor.totalSessions} sessions',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isAvailable ? () {} : null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 8),
                textStyle: const TextStyle(fontSize: 12),
              ),
              child: Text(isAvailable ? 'Book Session' : 'Unavailable'),
            ),
          ),
        ],
      ),
    );
  }
}
