import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/services/api_service.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/library/providers/library_provider.dart';

enum LibraryCategory { textbooks, papers, notes, pastExams }

class LibraryScreen extends ConsumerStatefulWidget {
  const LibraryScreen({super.key});

  @override
  ConsumerState<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends ConsumerState<LibraryScreen> {
  String _searchQuery = '';
  LibraryCategory _selectedCategory = LibraryCategory.textbooks;
  String _breadcrumb = 'Computer Science';

  final _aiFeatures = const [
    _AIFeature('Explainer', LucideIcons.brain, AppColors.primaryAccent),
    _AIFeature('Summarizer', LucideIcons.fileText, AppColors.tertiaryAccent),
    _AIFeature('Citation', LucideIcons.quote, AppColors.secondaryAccent),
    _AIFeature('Flashcards', LucideIcons.layers, AppColors.info),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final resourcesAsync = ref.watch(libraryProvider);

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text(
                'Global Library',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              actions: [
                CampusIconButton(
                  icon: LucideIcons.slidersHorizontal,
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      builder: (ctx) => Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Center(
                            child: Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12, bottom: 8),
                              decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text('Library Filters', style: Theme.of(ctx).textTheme.titleMedium),
                          ),
                          const Divider(height: 1),
                          CheckboxListTile(
                            title: const Text('Textbooks'),
                            value: true,
                            onChanged: (_) {},
                            secondary: const Icon(LucideIcons.bookOpen, size: 20),
                          ),
                          CheckboxListTile(
                            title: const Text('Research Papers'),
                            value: false,
                            onChanged: (_) {},
                            secondary: const Icon(LucideIcons.fileText, size: 20),
                          ),
                          CheckboxListTile(
                            title: const Text('Lecture Notes'),
                            value: false,
                            onChanged: (_) {},
                            secondary: const Icon(LucideIcons.edit, size: 20),
                          ),
                          CheckboxListTile(
                            title: const Text('Past Exams'),
                            value: false,
                            onChanged: (_) {},
                            secondary: const Icon(LucideIcons.clipboardCheck, size: 20),
                          ),
                          const SizedBox(height: 8),
                        ],
                      ),
                    );
                  },
                  tooltip: 'Filters',
                ),
              ],
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    TextField(
                      onChanged: (v) => setState(() => _searchQuery = v),
                      decoration: InputDecoration(
                        hintText: 'Search books, papers, notes...',
                        prefixIcon: const Icon(LucideIcons.search, size: 18),
                        prefixIconConstraints: const BoxConstraints(minWidth: 40),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(LucideIcons.x, size: 16),
                                onPressed: () => setState(() => _searchQuery = ''),
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildHierarchyNav(context, isDark),
                    const SizedBox(height: 16),
                    _buildAIFeaturesRow(context, isDark),
                    const SizedBox(height: 20),
                    _buildCategoryTabs(context, isDark),
                  ],
                ),
              ),
            ),
            resourcesAsync.when(
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, st) => SliverFillRemaining(
                child: EmptyState(
                  icon: LucideIcons.alertCircle,
                  title: 'Something went wrong',
                  message: 'Pull to refresh and try again',
                  actionLabel: 'Retry',
                  onAction: () => ref.invalidate(libraryProvider),
                ),
              ),
              data: (resources) {
                final categoryMap = {
                  LibraryCategory.textbooks: 'textbook',
                  LibraryCategory.papers: 'document',
                  LibraryCategory.notes: 'notes',
                  LibraryCategory.pastExams: 'notes',
                };
                final typeFilter = categoryMap[_selectedCategory];
                var filtered = resources.where((r) {
                  if (r.type != typeFilter) return false;
                  if (_selectedCategory == LibraryCategory.pastExams && !r.topic.toLowerCase().contains('exam') && !r.title.toLowerCase().contains('exam')) return false;
                  return true;
                }).toList();
                if (_searchQuery.isNotEmpty) {
                  filtered = filtered
                      .where((r) => r.title.toLowerCase().contains(_searchQuery.toLowerCase()))
                      .toList();
                }
                if (filtered.isEmpty) {
                  return SliverFillRemaining(
                    child: EmptyState(
                      icon: LucideIcons.bookOpen,
                      title: 'No resources found',
                      message: 'Try adjusting your search or category.',
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.only(top: 12, bottom: 100),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _ResourceCard(
                        resource: filtered[index],
                        isDark: isDark,
                        onTap: () => _openReader(filtered[index]),
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

  Widget _buildHierarchyNav(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08),
        ),
      ),
      child: Row(
        children: [
          Text('Faculties', style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
              )),
          Icon(LucideIcons.chevronRight, size: 14, color: AppColors.textSecondary),
          Text(' Science & Tech', style: Theme.of(context).textTheme.bodySmall),
          Icon(LucideIcons.chevronRight, size: 14, color: AppColors.textSecondary),
          Text(' $_breadcrumb', style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.primaryAccent,
              )),
        ],
      ),
    );
  }

  Widget _buildAIFeaturesRow(BuildContext context, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.sparkles, size: 16, color: AppColors.secondaryAccent),
            const SizedBox(width: 6),
            Text('AI Learning Tools', style: Theme.of(context).textTheme.titleSmall),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 80,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: _aiFeatures.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final feature = _aiFeatures[index];
              return GestureDetector(
                onTap: () => _openAITool(feature.label),
                child: Container(
                  width: 90,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: feature.color.withValues(alpha: isDark ? 0.12 : 0.06),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: feature.color.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(feature.icon, color: feature.color, size: 22),
                      const SizedBox(height: 6),
                      Text(
                        feature.label,
                        style: TextStyle(
                          color: feature.color,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Future<void> _openAITool(String label) async {
    final api = ref.read(apiServiceProvider);
    final resources = ref.read(libraryProvider).valueOrNull ?? [];

    if (resources.isEmpty) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No library items available. Add items first.'), duration: Duration(seconds: 2)),
      );
      return;
    }

    final item = await showModalBottomSheet<LibraryResource>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.85,
        expand: false,
        builder: (ctx, scrollCtrl) => Column(
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 8),
              child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text('Select item for $label', style: Theme.of(context).textTheme.titleMedium),
            ),
            const Divider(),
            Expanded(
              child: ListView.builder(
                controller: scrollCtrl,
                itemCount: resources.length,
                itemBuilder: (ctx, i) => ListTile(
                  leading: Icon(_iconForResourceType(resources[i].type), color: _colorForResourceType(resources[i].type)),
                  title: Text(resources[i].title, maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text(resources[i].type, style: Theme.of(context).textTheme.bodySmall),
                  onTap: () => Navigator.pop(ctx, resources[i]),
                ),
              ),
            ),
          ],
        ),
      ),
    );

    if (item == null || !context.mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: Card(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))),
    );

    try {
      final String endpoint;
      final Map<String, dynamic>? body;
      switch (label) {
        case 'Explainer':
          endpoint = '/api/v1/library/items/${item.id}/ai/explain';
          body = null;
          break;
        case 'Summarizer':
          endpoint = '/api/v1/library/items/${item.id}/ai/summarize';
          body = null;
          break;
        case 'Flashcards':
          endpoint = '/api/v1/library/items/${item.id}/ai/flashcards';
          body = null;
          break;
        case 'Citation':
          endpoint = '/api/v1/library/items/${item.id}/ai/citation';
          body = {'format': 'apa'};
          break;
        default:
          return;
      }
      // AI generation (esp. Flashcards) regularly takes 25-40s; the default
      // 15s receiveTimeout was killing the request before any cards arrived.
      final response = await api.post(
        endpoint,
        data: body,
        timeout: const Duration(seconds: 180),
      );
      if (!context.mounted) return;
      Navigator.pop(context);

      final raw = response.data;
      final result = raw is List ? raw : raw['data'];
      _showAIResult(label, result, item.title);
    } on DioException catch (e) {
      if (!context.mounted) return;
      Navigator.pop(context);
      final status = e.response?.statusCode;
      final serverMessage = e.response?.data is Map
          ? e.response!.data['message']?.toString()
          : null;
      final String text;
      if (status == 401 || status == 403) {
        text = 'Your session has expired. Please sign in again.';
      } else if (e.response == null) {
        text = 'AI $label unavailable: cannot reach the server.';
      } else if (serverMessage != null) {
        text = 'AI $label unavailable: $serverMessage';
      } else {
        text = 'AI $label unavailable: please try again.';
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(text),
          duration: const Duration(seconds: 4),
        ),
      );
    } catch (e) {
      if (!context.mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('AI $label failed: $e'), duration: const Duration(seconds: 3)),
      );
    }
  }

  void _showAIResult(String label, dynamic data, String itemTitle) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (ctx, scrollCtrl) => SingleChildScrollView(
          controller: scrollCtrl,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
              ),
              Row(
                children: [
                  Icon(LucideIcons.sparkles, size: 18, color: AppColors.secondaryAccent),
                  const SizedBox(width: 8),
                  Expanded(child: Text(label, style: Theme.of(context).textTheme.titleLarge)),
                ],
              ),
              const SizedBox(height: 4),
              Text(itemTitle, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
              const Divider(height: 24),
              if (label == 'Explainer' && data is Map)
                Text(data['explanation'] ?? '', style: Theme.of(context).textTheme.bodyLarge),
              if (label == 'Summarizer' && data is Map) ...[
                Text(data['summary'] ?? '', style: Theme.of(context).textTheme.bodyLarge),
                if (data['keyTopics'] != null) ...[
                  const SizedBox(height: 16),
                  Text('Key Topics', style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: (data['keyTopics'] as List).map<Widget>((t) => Chip(label: Text(t.toString(), style: const TextStyle(fontSize: 12)))).toList(),
                  ),
                ],
              ],
              if (label == 'Flashcards' && data is List)
                ...data.map<Widget>((fc) => Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    title: Text(fc['front'] ?? '', style: Theme.of(context).textTheme.titleSmall),
                    subtitle: Padding(padding: const EdgeInsets.only(top: 4), child: Text(fc['back'] ?? '')),
                  ),
                )),
              if (label == 'Citation' && data is Map) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.primaryAccent.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primaryAccent.withValues(alpha: 0.2)),
                  ),
                  child: SelectableText(data['citation'] ?? '', style: Theme.of(context).textTheme.bodyMedium),
                ),
                const SizedBox(height: 8),
                Text('Tap and hold to copy', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
              ],
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  void _openReader(LibraryResource resource) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (ctx, scrollCtrl) => SingleChildScrollView(
          controller: scrollCtrl,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(_iconForResourceType(resource.type), size: 24, color: _colorForResourceType(resource.type)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(resource.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            StatusBadge(text: resource.type[0].toUpperCase() + resource.type.substring(1), color: _colorForResourceType(resource.type), isSmall: true),
                            if (resource.courseCode.isNotEmpty) ...[
                              const SizedBox(width: 8),
                              Text(resource.courseCode, style: Theme.of(context).textTheme.bodySmall),
                            ],
                            if (resource.isVerified) ...[
                              const SizedBox(width: 8),
                              Icon(LucideIcons.checkCircle, size: 14, color: AppColors.success),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (resource.faculty.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(resource.faculty, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
              ],
              const Divider(height: 24),
              if (resource.description.isNotEmpty) ...[
                Text(resource.description, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500)),
                const SizedBox(height: 16),
              ],
              if (resource.content.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.surfaceDark : Colors.grey.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.1)),
                  ),
                  child: SelectableText(
                    resource.content,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.6),
                  ),
                ),
              ] else
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      children: [
                        Icon(LucideIcons.fileQuestion, size: 48, color: AppColors.textSecondary),
                        const SizedBox(height: 12),
                        Text('No content available', style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary)),
                        const SizedBox(height: 4),
                        Text('This item has no body text to display.', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 20),
              Row(
                children: [
                  _statChip(LucideIcons.eye, '${resource.viewCount}', isDark),
                  const SizedBox(width: 12),
                  _statChip(LucideIcons.download, '${resource.downloadCount}', isDark),
                  const SizedBox(width: 12),
                  _statChip(LucideIcons.thumbsUp, '${resource.upvotes}', isDark),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statChip(IconData icon, String label, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.grey.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.textSecondary),
          const SizedBox(width: 4),
          Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildCategoryTabs(BuildContext context, bool isDark) {
    final categories = [
      (LibraryCategory.textbooks, 'Textbooks', LucideIcons.bookOpen),
      (LibraryCategory.papers, 'Papers', LucideIcons.fileText),
      (LibraryCategory.notes, 'Notes', LucideIcons.edit),
      (LibraryCategory.pastExams, 'Past Exams', LucideIcons.clipboardCheck),
    ];

    return Row(
      children: categories.map((cat) {
        final isSelected = _selectedCategory == cat.$1;
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _selectedCategory = cat.$1),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 3),
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.primaryAccent.withValues(alpha: isDark ? 0.2 : 0.1)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(10),
                border: isSelected
                    ? Border.all(color: AppColors.primaryAccent.withValues(alpha: 0.3))
                    : null,
              ),
              child: Column(
                children: [
                  Icon(
                    cat.$3,
                    size: 18,
                    color: isSelected ? AppColors.primaryAccent : AppColors.textSecondary,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    cat.$2,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                      color: isSelected ? AppColors.primaryAccent : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

IconData _iconForResourceType(String type) {
  switch (type) {
    case 'textbook':
      return LucideIcons.bookOpen;
    case 'document':
      return LucideIcons.fileText;
    case 'notes':
      return LucideIcons.edit;
    case 'video':
      return LucideIcons.video;
    case 'link':
      return LucideIcons.link;
    default:
      return LucideIcons.file;
  }
}

Color _colorForResourceType(String type) {
  switch (type) {
    case 'textbook':
      return AppColors.primaryAccent;
    case 'document':
      return AppColors.tertiaryAccent;
    case 'notes':
      return AppColors.secondaryAccent;
    case 'video':
      return AppColors.info;
    case 'link':
      return AppColors.textSecondary;
    default:
      return AppColors.primaryAccent;
  }
}

class _ResourceCard extends StatelessWidget {
  final LibraryResource resource;
  final bool isDark;
  final VoidCallback? onTap;

  const _ResourceCard({required this.resource, required this.isDark, this.onTap});

  @override
  Widget build(BuildContext context) {
    final icon = _iconForResourceType(resource.type);
    final color = _colorForResourceType(resource.type);
    final rating = resource.viewCount > 0
        ? (resource.upvotes / resource.viewCount * 5).clamp(1.0, 5.0)
        : 4.5;

    return CampusCard(
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 64,
            height: 88,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  color.withValues(alpha: 0.3),
                  color.withValues(alpha: 0.1),
                ],
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Icon(icon, color: color, size: 28),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  resource.title,
                  style: Theme.of(context).textTheme.titleSmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  resource.courseCode.isNotEmpty ? resource.courseCode : resource.faculty,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(LucideIcons.star, size: 14, color: AppColors.secondaryAccent),
                    const SizedBox(width: 4),
                    Text(
                      rating.toStringAsFixed(1),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(width: 12),
                    StatusBadge(
                      text: resource.type[0].toUpperCase() + resource.type.substring(1),
                      color: color,
                      isSmall: true,
                    ),
                    const Spacer(),
                    if (resource.isVerified)
                      Icon(LucideIcons.check, size: 14, color: AppColors.success),
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

class _AIFeature {
  final String label;
  final IconData icon;
  final Color color;

  const _AIFeature(this.label, this.icon, this.color);
}
