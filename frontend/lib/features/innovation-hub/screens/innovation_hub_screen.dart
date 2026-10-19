import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/notifications/screens/notifications_screen.dart';

class InnovationHubScreen extends ConsumerStatefulWidget {
  const InnovationHubScreen({super.key});

  @override
  ConsumerState<InnovationHubScreen> createState() => _InnovationHubScreenState();
}

class _InnovationHubScreenState extends ConsumerState<InnovationHubScreen> {
  String _selectedCategory = 'All';

  final _categories = ['All', 'Agriculture', 'AI', 'Robotics', 'Health', 'Fintech', 'Education'];

  final _featuredProjects = const [
    _ProjectData(
      title: 'CropSense AI',
      description: 'IoT sensors + ML for real-time crop health monitoring for smallholder farmers in Lesotho.',
      team: ['LM', 'TK', 'NP'],
      fundingAsk: 'M 150,000',
      category: 'Agriculture',
      accentColor: AppColors.tertiaryAccent,
      icon: LucideIcons.sprout,
      isFeatured: true,
    ),
    _ProjectData(
      title: 'LesothoSign',
      description: 'Real-time sign language to text/speech translator using computer vision.',
      team: ['DT', 'PK'],
      fundingAsk: 'M 200,000',
      category: 'AI',
      accentColor: AppColors.primaryAccent,
      icon: LucideIcons.hand,
      isFeatured: true,
    ),
  ];

  final _projects = const [
    _ProjectData(
      title: 'MediTrack',
      description: 'Medication adherence tracker for rural clinics with SMS fallback.',
      team: ['RS', 'KM', 'SL'],
      fundingAsk: 'M 80,000',
      category: 'Health',
      accentColor: AppColors.error,
      icon: LucideIcons.heartPulse,
      isFeatured: false,
    ),
    _ProjectData(
      title: 'EduBot MSL',
      description: 'AI tutor that teaches in Sesotho, covering CAPS curriculum for Grade 8-12.',
      team: ['TM', 'NT'],
      fundingAsk: 'M 120,000',
      category: 'Education',
      accentColor: AppColors.info,
      icon: LucideIcons.graduationCap,
      isFeatured: false,
    ),
    _ProjectData(
      title: 'AgriMarket',
      description: 'Digital marketplace connecting Lesotho farmers directly to buyers in Maseru.',
      team: ['LM', 'NP'],
      fundingAsk: 'M 60,000',
      category: 'Fintech',
      accentColor: AppColors.secondaryAccent,
      icon: LucideIcons.store,
      isFeatured: false,
    ),
    _ProjectData(
      title: 'RoboFarm',
      description: 'Autonomous greenhouse monitoring robot using ROS and computer vision.',
      team: ['TK', 'DT', 'KM'],
      fundingAsk: 'M 250,000',
      category: 'Robotics',
      accentColor: AppColors.tertiaryAccent,
      icon: LucideIcons.bot,
      isFeatured: false,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filtered = _selectedCategory == 'All'
        ? _projects
        : _projects.where((p) => p.category == _selectedCategory).toList();

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('Innovation Hub', style: Theme.of(context).textTheme.headlineSmall),
              actions: [
                CampusIconButton(
                  icon: LucideIcons.bell,
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                  tooltip: 'Updates',
                ),
              ],
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 48,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  physics: const BouncingScrollPhysics(),
                  itemCount: _categories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    return CampusChip(
                      label: _categories[index],
                      isSelected: _selectedCategory == _categories[index],
                      onTap: () => setState(() => _selectedCategory = _categories[index]),
                    );
                  },
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SectionHeader(
                title: 'Featured Projects',
                actionText: 'View All',
                onAction: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    builder: (ctx) => DraggableScrollableSheet(
                      initialChildSize: 0.7,
                      minChildSize: 0.4,
                      maxChildSize: 0.9,
                      expand: false,
                      builder: (ctx, scrollCtrl) => Column(
                        children: [
                          Center(
                            child: Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12, bottom: 8),
                              decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2))),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text('All Projects', style: Theme.of(ctx).textTheme.titleMedium),
                          ),
                          Expanded(
                            child: ListView.builder(
                              controller: scrollCtrl,
                              itemCount: _projects.length,
                              itemBuilder: (ctx, index) {
                                final p = _projects[index];
                                return ListTile(
                                  leading: Container(
                                    width: 40, height: 40,
                                    decoration: BoxDecoration(
                                      color: p.accentColor.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(p.icon, color: p.accentColor, size: 20),
                                  ),
                                  title: Text(p.title),
                                  subtitle: Text(p.category),
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
            SliverToBoxAdapter(
              child: SizedBox(
                height: 200,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _featuredProjects.length,
                  itemBuilder: (context, index) => SizedBox(
                    width: MediaQuery.of(context).size.width * 0.85,
                    child: _FeaturedProjectCard(
                      project: _featuredProjects[index],
                      isDark: isDark,
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SectionHeader(
                title: 'All Projects',
                actionText: '${filtered.length} projects',
              ),
            ),
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _ProjectCard(
                  project: filtered[index],
                  isDark: isDark,
                ),
                childCount: filtered.length,
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
      floatingActionButton: Container(
        decoration: BoxDecoration(
          gradient: AppColors.heroGradient,
          borderRadius: BorderRadius.circular(16),
        ),
        child: FloatingActionButton.extended(
          onPressed: () {
            final titleCtrl = TextEditingController();
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
                        decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2))),
                    ),
                    const SizedBox(height: 16),
                    Text('New Project', style: Theme.of(ctx).textTheme.titleMedium),
                    const SizedBox(height: 16),
                    TextField(
                      controller: titleCtrl,
                      decoration: const InputDecoration(
                        hintText: 'Project Title',
                        prefixIcon: Icon(LucideIcons.lightbulb, size: 18),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descCtrl,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Describe your project idea...',
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: CampusButton(
                        label: 'Submit Project',
                        onPressed: () {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Project submitted for review')),
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
          backgroundColor: Colors.transparent,
          elevation: 0,
          icon: const Icon(LucideIcons.plus, color: Colors.white),
          label: const Text('New Project', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }
}

class _FeaturedProjectCard extends StatelessWidget {
  final _ProjectData project;
  final bool isDark;

  const _FeaturedProjectCard({required this.project, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return CampusCard(
      margin: const EdgeInsets.only(right: 12),
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          project.accentColor.withValues(alpha: 0.15),
          project.accentColor.withValues(alpha: 0.05),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(project.icon, color: project.accentColor, size: 24),
              const SizedBox(width: 8),
              Text(project.title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.secondaryAccent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text('Featured',
                    style: TextStyle(
                      color: AppColors.accentText(
                        AppColors.secondaryAccent,
                        isDark: Theme.of(context).brightness == Brightness.dark,
                      ),
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    )),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Text(
              project.description,
              style: Theme.of(context).textTheme.bodySmall,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Row(
            children: [
              SizedBox(
                height: 28,
                child: Stack(
                  children: List.generate(project.team.length.clamp(0, 4), (i) {
                    return Positioned(
                      left: i * 18.0,
                      child: CircleAvatar(
                        radius: 14,
                        backgroundColor: AppColors.primaryAccent,
                        child: Text(
                          project.team[i],
                          style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700),
                        ),
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(width: 8),
              Text('${project.team.length} members', style: Theme.of(context).textTheme.bodySmall),
              const Spacer(),
              Text(
                project.fundingAsk,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: AppColors.tertiaryAccent,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final _ProjectData project;
  final bool isDark;

  const _ProjectCard({required this.project, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return CampusCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: project.accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(project.icon, color: project.accentColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(project.title, style: Theme.of(context).textTheme.titleSmall),
                    Text(project.category, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              Text(
                project.fundingAsk,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.tertiaryAccent),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(project.description, style: Theme.of(context).textTheme.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 12),
          Row(
            children: [
              SizedBox(
                height: 24,
                child: Stack(
                  children: List.generate(project.team.length.clamp(0, 3), (i) {
                    return Positioned(
                      left: i * 16.0,
                      child: CircleAvatar(
                        radius: 12,
                        backgroundColor: AppColors.primary,
                        child: Text(
                          project.team[i],
                          style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w700),
                        ),
                      ),
                    );
                  }),
                ),
              ),
              const Spacer(),
              OutlinedButton(
                onPressed: () {
                  final msgCtrl = TextEditingController();
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
                          Text('Collaborate on ${project.title}', style: Theme.of(ctx).textTheme.titleMedium),
                          const SizedBox(height: 16),
                          TextField(
                            controller: msgCtrl,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              hintText: 'Describe how you\'d like to contribute...',
                              alignLabelWithHint: true,
                            ),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: CampusButton(
                              label: 'Send Request',
                              onPressed: () {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Collaboration request sent')),
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
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                ),
                child: const Text('Collaborate', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProjectData {
  final String title;
  final String description;
  final List<String> team;
  final String fundingAsk;
  final String category;
  final Color accentColor;
  final IconData icon;
  final bool isFeatured;

  const _ProjectData({
    required this.title,
    required this.description,
    required this.team,
    required this.fundingAsk,
    required this.category,
    required this.accentColor,
    required this.icon,
    required this.isFeatured,
  });
}
