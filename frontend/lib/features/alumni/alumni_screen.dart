import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class AlumniScreen extends ConsumerStatefulWidget {
  const AlumniScreen({super.key});

  @override
  ConsumerState<AlumniScreen> createState() => _AlumniScreenState();
}

class _AlumniScreenState extends ConsumerState<AlumniScreen> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  String _search = '';

  final _alumni = [
    _AlumniData('Dr. Mpho Tsepo', 2015, 'PhD Computer Science', 'Google', 'Senior ML Engineer', 'Technology', LucideIcons.code),
    _AlumniData('Lineo Mokoena', 2018, 'BCom Accounting', 'Deloitte', 'Audit Manager', 'Finance', LucideIcons.briefcase),
    _AlumniData('Karabo Moeketsi', 2019, 'LLB Law', 'Webber Wentzel', 'Associate Attorney', 'Legal', LucideIcons.scale),
    _AlumniData('Thabo Letsie', 2016, 'MEng Civil Engineering', 'Arup', 'Structural Engineer', 'Engineering', LucideIcons.hardHat),
    _AlumniData('Mosa Nkosi', 2020, 'BSc Computer Science', 'Standard Bank', 'Software Developer', 'Technology', LucideIcons.monitor),
    _AlumniData('Nthabiseng Radebe', 2017, 'MBA', 'Vodacom', 'Product Manager', 'Business', LucideIcons.trendingUp),
  ];

  final _mentors = [
    _MentorData('Dr. Mpho Tsepo', 'Senior ML Engineer at Google', ['AI/ML', 'Data Science', 'Career Coaching'], 4.8, 24, true),
    _MentorData('Lineo Mokoena', 'Audit Manager at Deloitte', ['Finance', 'Accounting', 'Audit'], 4.6, 18, true),
    _MentorData('Thabo Letsie', 'Structural Engineer at Arup', ['Engineering', 'Project Management'], 4.7, 12, false),
    _MentorData('Nthabiseng Radebe', 'Product Manager at Vodacom', ['Product Management', 'Business Strategy'], 4.9, 31, true),
  ];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filteredAlumni = _alumni.where((a) =>
      _search.isEmpty || a.name.toLowerCase().contains(_search.toLowerCase()) || a.company.toLowerCase().contains(_search.toLowerCase())).toList();
    final filteredMentors = _mentors.where((m) =>
      _search.isEmpty || m.name.toLowerCase().contains(_search.toLowerCase()) || m.role.toLowerCase().contains(_search.toLowerCase())).toList();

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(floating: true, backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('Alumni Network', style: Theme.of(context).textTheme.headlineSmall)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: CampusCard(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(width: 48, height: 48,
                          decoration: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(12)),
                          child: const Icon(LucideIcons.graduationCap, color: Colors.white, size: 24)),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text('Alumni Network', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 4),
                            Row(children: [
                              _statChip('2,847', 'Total', isDark),
                              const SizedBox(width: 8),
                              _statChip('156', 'Mentors', isDark),
                              const SizedBox(width: 8),
                              _statChip('89%', 'Connected', isDark),
                            ]),
                          ]),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: TextField(
                  onChanged: (v) => setState(() => _search = v),
                  decoration: InputDecoration(
                    hintText: 'Search alumni...', prefixIcon: const Icon(LucideIcons.search, size: 20),
                    filled: true, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    fillColor: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TabBar(
                  controller: _tabCtrl,
                  indicator: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(10)),
                  indicatorSize: TabBarIndicatorSize.tab, dividerColor: Colors.transparent,
                  labelColor: Colors.white, unselectedLabelColor: AppColors.textSecondary,
                  labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                  tabs: const [Tab(text: 'Featured Alumni'), Tab(text: 'Mentors')],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: _tabCtrl.index == 0 ? 280.0 * ((filteredAlumni.length / 2).ceil()).toDouble() : 120.0 * filteredMentors.length,
                child: TabBarView(
                  controller: _tabCtrl,
                  children: [
                    _buildAlumniGrid(filteredAlumni, isDark),
                    _buildMentorList(filteredMentors, isDark),
                  ],
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  Widget _buildAlumniGrid(List<_AlumniData> list, bool isDark) {
    if (list.isEmpty) return Center(child: EmptyState(icon: LucideIcons.userX, title: 'No alumni found', message: 'Try a different search'));
    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 0.9),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final a = list[index];
        return CampusCard(
          child: Padding(padding: const EdgeInsets.all(12), child: Column(children: [
            Container(width: 44, height: 44,
              decoration: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(12)),
              child: Icon(a.icon, color: Colors.white, size: 22)),
            const SizedBox(height: 8),
            Text(a.name, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontSize: 12, fontWeight: FontWeight.w600), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(a.position, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(a.company, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10, color: AppColors.textSecondary), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 6),
            StatusBadge(text: '${a.graduationYear}', color: AppColors.primaryAccent, isSmall: true),
          ])),
        );
      },
    );
  }

  Widget _buildMentorList(List<_MentorData> list, bool isDark) {
    if (list.isEmpty) return Center(child: EmptyState(icon: LucideIcons.userX, title: 'No mentors found', message: 'Try a different search'));
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final m = list[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: CampusCard(
            child: Padding(padding: const EdgeInsets.all(14), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(width: 44, height: 44,
                  decoration: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(12)),
                  child: const Icon(LucideIcons.user, color: Colors.white, size: 22)),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(m.name, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                  Text(m.role, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
                ])),
                if (m.available) StatusBadge.success('Available') else const SizedBox(),
              ]),
              const SizedBox(height: 8),
              Wrap(spacing: 4, runSpacing: 4, children: m.expertise.map((e) =>
                StatusBadge(text: e, color: AppColors.tertiaryAccent, isSmall: true)).toList()),
              const SizedBox(height: 8),
              Row(children: [
                const Icon(LucideIcons.star, size: 14, color: AppColors.secondaryAccent),
                const SizedBox(width: 4),
                Text('${m.rating}', style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(width: 4),
                Text('(${m.reviews} reviews)', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
                const Spacer(),
                CampusButton(label: 'Connect', icon: LucideIcons.messageCircle, onPressed: () =>
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Connection request sent!'), duration: Duration(seconds: 2)))),
              ]),
            ])),
          ),
        );
      },
    );
  }

  Widget _statChip(String value, String label, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(8)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(value, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700, color: AppColors.primaryAccent)),
        const SizedBox(width: 4),
        Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
      ]),
    );
  }
}

class _AlumniData {
  final String name; final int graduationYear; final String degree;
  final String company; final String position; final String industry; final IconData icon;
  const _AlumniData(this.name, this.graduationYear, this.degree, this.company, this.position, this.industry, this.icon);
}

class _MentorData {
  final String name; final String role; final List<String> expertise;
  final double rating; final int reviews; final bool available;
  const _MentorData(this.name, this.role, this.expertise, this.rating, this.reviews, this.available);
}
