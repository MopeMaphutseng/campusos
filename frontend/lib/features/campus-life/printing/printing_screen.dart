import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class PrintingScreen extends ConsumerStatefulWidget {
  const PrintingScreen({super.key});

  @override
  ConsumerState<PrintingScreen> createState() => _PrintingScreenState();
}

class _PrintingScreenState extends ConsumerState<PrintingScreen> {
  final _shops = const [
    _PrintShop(
      name: 'Library Print Center',
      location: 'Main Library, Ground Floor',
      services: ['B&W Printing', 'Color Printing', 'Binding', 'Scanning'],
      estimatedWait: '2 min',
      rating: 4.5,
    ),
    _PrintShop(
      name: 'Student Centre CopyHub',
      location: 'Student Centre, Room 105',
      services: ['B&W Printing', 'Poster Printing', 'Lamination'],
      estimatedWait: '5 min',
      rating: 4.2,
    ),
    _PrintShop(
      name: 'Science & Tech Print Lab',
      location: 'Block D, Engineering Wing',
      services: ['3D Printing', 'Large Format', 'B&W Printing'],
      estimatedWait: '15 min',
      rating: 4.7,
    ),
    _PrintShop(
      name: 'Residence Print Station',
      location: 'Block A, Residence Lobby',
      services: ['B&W Printing', 'Photocopy'],
      estimatedWait: '1 min',
      rating: 3.9,
    ),
  ];

  final _recentJobs = const [
    _RecentJob(
      fileName: 'assignment_4.pdf',
      pages: 12,
      status: _JobStatus.processing,
      submittedAt: '2 min ago',
    ),
    _RecentJob(
      fileName: 'lecture_notes_week8.pdf',
      pages: 8,
      status: _JobStatus.ready,
      submittedAt: '10 min ago',
    ),
    _RecentJob(
      fileName: 'research_paper_draft.pdf',
      pages: 24,
      status: _JobStatus.completed,
      submittedAt: '1 hour ago',
    ),
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
              title: Text(
                'Printing',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              actions: [
                CampusIconButton(
                  icon: LucideIcons.clock,
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      builder: (ctx) => DraggableScrollableSheet(
                        initialChildSize: 0.5,
                        minChildSize: 0.3,
                        maxChildSize: 0.7,
                        expand: false,
                        builder: (ctx, scrollCtrl) => Column(
                          children: [
                            Center(
                              child: Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12, bottom: 8),
                                decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2))),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Text('Print History', style: Theme.of(ctx).textTheme.titleMedium),
                            ),
                            Expanded(
                              child: ListView.builder(
                                controller: scrollCtrl,
                                itemCount: _recentJobs.length,
                                itemBuilder: (ctx, i) {
                                  final job = _recentJobs[i];
                                  return ListTile(
                                    leading: Container(
                                      width: 40, height: 40,
                                      decoration: BoxDecoration(
                                        color: AppColors.primaryAccent.withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Icon(LucideIcons.fileText, color: AppColors.primaryAccent, size: 20),
                                    ),
                                    title: Text(job.fileName),
                                    subtitle: Text('${job.pages} pages \u2022 ${job.submittedAt}'),
                                    trailing: StatusBadge(
                                      text: job.status == _JobStatus.processing ? 'Processing'
                                          : job.status == _JobStatus.ready ? 'Ready' : 'Completed',
                                      color: job.status == _JobStatus.processing ? AppColors.warning
                                          : job.status == _JobStatus.ready ? AppColors.success : AppColors.info,
                                      isSmall: true,
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                  tooltip: 'Print History',
                ),
                const SizedBox(width: 8),
              ],
            ),
            SliverToBoxAdapter(
              child: HeroCard(
                title: 'Quick Print',
                subtitle: 'Upload a document and pick a shop',
                gradient: AppColors.heroGradient,
                child: SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
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
                            const SizedBox(height: 16),
                            const Icon(LucideIcons.upload, size: 48, color: AppColors.primaryAccent),
                            const SizedBox(height: 16),
                            Text('Upload Document', style: Theme.of(ctx).textTheme.titleMedium),
                            const SizedBox(height: 8),
                            Text('PDF, DOCX, or image files', style: Theme.of(ctx).textTheme.bodySmall),
                            const SizedBox(height: 24),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              child: SizedBox(
                                width: double.infinity,
                                child: CampusButton(
                                  label: 'Select File',
                                  icon: LucideIcons.folderOpen,
                                  onPressed: () {
                                    Navigator.pop(ctx);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('File selected for printing')),
                                    );
                                  },
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                          ],
                        ),
                      );
                    },
                    icon: const Icon(LucideIcons.upload, color: Colors.white),
                    label: const Text(
                      'Upload Document',
                      style: TextStyle(color: Colors.white),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white38),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
                child: SectionHeader(
                title: 'Print Shops',
                actionText: 'View All',
                onAction: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    builder: (ctx) => DraggableScrollableSheet(
                      initialChildSize: 0.6,
                      minChildSize: 0.4,
                      maxChildSize: 0.85,
                      expand: false,
                      builder: (ctx, scrollCtrl) => Column(
                        children: [
                          Center(
                            child: Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12, bottom: 8),
                              decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2))),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text('All Print Shops', style: Theme.of(ctx).textTheme.titleMedium),
                          ),
                          Expanded(
                            child: ListView.builder(
                              controller: scrollCtrl,
                              itemCount: _shops.length,
                              itemBuilder: (ctx, i) {
                                final shop = _shops[i];
                                return ListTile(
                                  leading: Container(
                                    width: 40, height: 40,
                                    decoration: BoxDecoration(
                                      color: AppColors.primaryAccent.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(LucideIcons.printer, color: AppColors.primaryAccent, size: 20),
                                  ),
                                  title: Text(shop.name),
                                  subtitle: Text(shop.location),
                                  trailing: Text(shop.estimatedWait, style: const TextStyle(fontSize: 12)),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _PrintShopCard(
                  shop: _shops[index],
                  isDark: isDark,
                  onSend: () {},
                ),
                childCount: _shops.length,
              ),
            ),
            SliverToBoxAdapter(
              child: SectionHeader(title: 'Recent Print Jobs'),
            ),
            SliverToBoxAdapter(
              child: _recentJobs.isEmpty
                  ? EmptyState(
                      icon: LucideIcons.printer,
                      title: 'No recent jobs',
                      message: 'Your print history will appear here.',
                    )
                  : Column(
                      children: _recentJobs.map((job) => _RecentJobCard(
                        job: job,
                        isDark: isDark,
                      )).toList(),
                    ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }
}

class _PrintShop {
  final String name;
  final String location;
  final List<String> services;
  final String estimatedWait;
  final double rating;

  const _PrintShop({
    required this.name,
    required this.location,
    required this.services,
    required this.estimatedWait,
    required this.rating,
  });
}

class _PrintShopCard extends StatelessWidget {
  final _PrintShop shop;
  final bool isDark;
  final VoidCallback onSend;

  const _PrintShopCard({
    required this.shop,
    required this.isDark,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return CampusCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primaryAccent.withValues(alpha: isDark ? 0.15 : 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(LucideIcons.printer, color: AppColors.primaryAccent, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  shop.name,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Icon(LucideIcons.mapPin, size: 12, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        shop.location,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 4,
                  runSpacing: 4,
                  children: shop.services.map((s) => StatusBadge(
                    text: s,
                    color: AppColors.info,
                    isSmall: true,
                  )).toList(),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(LucideIcons.clock, size: 14, color: AppColors.secondaryAccent),
                    const SizedBox(width: 4),
                    Text(
                      shop.estimatedWait,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.secondaryAccent,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Icon(LucideIcons.star, size: 14, color: AppColors.secondaryAccent),
                    const SizedBox(width: 4),
                    Text(
                      shop.rating.toString(),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const Spacer(),
                    FilledButton.tonalIcon(
                      onPressed: onSend,
                      icon: const Icon(LucideIcons.send, size: 14),
                      label: const Text('Send Document'),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        textStyle: Theme.of(context).textTheme.labelSmall,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

enum _JobStatus { processing, ready, completed }

class _RecentJob {
  final String fileName;
  final int pages;
  final _JobStatus status;
  final String submittedAt;

  const _RecentJob({
    required this.fileName,
    required this.pages,
    required this.status,
    required this.submittedAt,
  });
}

class _RecentJobCard extends StatelessWidget {
  final _RecentJob job;
  final bool isDark;

  const _RecentJobCard({required this.job, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return CampusCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primaryAccent.withValues(alpha: isDark ? 0.12 : 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(LucideIcons.fileText, color: AppColors.primaryAccent, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  job.fileName,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  '${job.pages} pages \u2022 ${job.submittedAt}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _buildStatusBadge(job.status),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(_JobStatus status) {
    switch (status) {
      case _JobStatus.processing:
        return StatusBadge.warning('Processing');
      case _JobStatus.ready:
        return StatusBadge.success('Ready');
      case _JobStatus.completed:
        return StatusBadge.info('Completed');
    }
  }
}
