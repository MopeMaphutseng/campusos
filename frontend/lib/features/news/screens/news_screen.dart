import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/news/providers/news_provider.dart';
import 'package:campusos/features/seminars/seminars_screen.dart';
import 'package:campusos/features/alumni/alumni_screen.dart';

class NewsScreen extends ConsumerStatefulWidget {
  const NewsScreen({super.key});

  @override
  ConsumerState<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends ConsumerState<NewsScreen> {
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final newsAsync = ref.watch(newsArticlesProvider);

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('News & Startups', style: Theme.of(context).textTheme.headlineSmall),
            ),
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08),
                  ),
                ),
                child: Row(
                  children: [
                    _tabButton('News', 0),
                    _tabButton('Startups', 1),
                    _tabButton('Seminars', 2),
                    _tabButton('Alumni', 3),
                  ],
                ),
              ),
            ),
            if (_selectedTab == 0) ...[
              newsAsync.when(
                loading: () => const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (e, st) => SliverFillRemaining(
                  child: EmptyState(
                    icon: LucideIcons.alertCircle,
                    title: 'Something went wrong',
                    message: 'Pull to refresh and try again',
                    actionLabel: 'Retry',
                    onAction: () => ref.invalidate(newsArticlesProvider),
                  ),
                ),
                data: (articles) {
                  if (articles.isEmpty) {
                    return SliverFillRemaining(
                      child: EmptyState(
                        icon: LucideIcons.newspaper,
                        title: 'No news yet',
                        message: 'Check back later for updates.',
                      ),
                    );
                  }
                  return SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _NewsCard(news: articles[index], isDark: isDark),
                      childCount: articles.length,
                    ),
                  );
                },
              ),
            ] else if (_selectedTab == 1) ...[
              SliverToBoxAdapter(
                child: SectionHeader(title: 'Startup Projects', actionText: 'Submit Your Idea'),
              ),
              SliverFillRemaining(
                child: EmptyState(
                  icon: LucideIcons.rocket,
                  title: 'Startup Projects',
                  message: 'Innovative startup ideas from the campus community.',
                  actionLabel: 'Coming Soon',
                  onAction: () {
                    final nameCtrl = TextEditingController();
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
                                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
                            ),
                            const SizedBox(height: 16),
                            Text('Submit Your Startup Idea', style: Theme.of(ctx).textTheme.titleMedium),
                            const SizedBox(height: 16),
                            TextField(
                              controller: nameCtrl,
                              decoration: const InputDecoration(
                                hintText: 'Startup Name',
                                prefixIcon: Icon(LucideIcons.rocket, size: 18),
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: descCtrl,
                              maxLines: 4,
                              decoration: const InputDecoration(
                                hintText: 'Describe your startup idea...',
                                alignLabelWithHint: true,
                              ),
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: CampusButton(
                                label: 'Submit Idea',
                                onPressed: () {
                                  Navigator.pop(ctx);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Startup idea submitted for review')),
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
            ] else if (_selectedTab == 2) ...[
              SliverToBoxAdapter(
                child: SectionHeader(title: 'Seminars & Competitions'),
              ),
              SliverFillRemaining(
                child: EmptyState(
                  icon: LucideIcons.calendarRange,
                  title: 'Global Seminars & Competitions',
                  message: 'Browse upcoming seminars, workshops, and competitions.',
                  actionLabel: 'Explore',
                  onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SeminarsScreen())),
                ),
              ),
            ] else ...[
              SliverToBoxAdapter(
                child: SectionHeader(title: 'Alumni Network'),
              ),
              SliverFillRemaining(
                child: EmptyState(
                  icon: LucideIcons.graduationCap,
                  title: 'Alumni Network',
                  message: 'Connect with alumni from your university.',
                  actionLabel: 'Browse',
                  onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AlumniScreen())),
                ),
              ),
            ],
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  Widget _tabButton(String label, int index) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primaryAccent.withValues(alpha: 0.1) : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? AppColors.primaryAccent : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

IconData _iconForCategory(String category) {
  switch (category) {
    case 'tech':
      return LucideIcons.newspaper;
    case 'events':
      return LucideIcons.code;
    case 'startup':
      return LucideIcons.rocket;
    default:
      return LucideIcons.newspaper;
  }
}

Color _colorForCategory(String category) {
  switch (category) {
    case 'tech':
      return AppColors.primaryAccent;
    case 'events':
      return AppColors.tertiaryAccent;
    case 'startup':
      return AppColors.secondaryAccent;
    default:
      return AppColors.primaryAccent;
  }
}

String _timeAgo(DateTime date) {
  final diff = DateTime.now().difference(date);
  if (diff.inDays > 6) return '${(diff.inDays / 7).floor()}w ago';
  if (diff.inDays > 0) return '${diff.inDays}d ago';
  if (diff.inHours > 0) return '${diff.inHours}h ago';
  return 'Just now';
}

class _NewsCard extends StatelessWidget {
  final NewsArticle news;
  final bool isDark;

  const _NewsCard({required this.news, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final accentColor = _colorForCategory(news.category);
    final icon = _iconForCategory(news.category);

    return CampusCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 120,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  accentColor.withValues(alpha: 0.15),
                  accentColor.withValues(alpha: 0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Icon(icon, size: 40, color: accentColor.withValues(alpha: 0.5)),
            ),
          ),
          const SizedBox(height: 12),
          Text(news.title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          Text(news.summary, style: Theme.of(context).textTheme.bodySmall, maxLines: 3, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 10),
          Row(
            children: [
              Text(news.authorName, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(width: 8),
              Text('• ${_timeAgo(news.publishedAt)}', style: Theme.of(context).textTheme.bodySmall),
              const Spacer(),
              Icon(LucideIcons.share2, size: 16, color: AppColors.textSecondary),
              const SizedBox(width: 12),
              Icon(LucideIcons.bookmark, size: 16, color: AppColors.textSecondary),
            ],
          ),
        ],
      ),
    );
  }
}
