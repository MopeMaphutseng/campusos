import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class SeminarsScreen extends ConsumerStatefulWidget {
  const SeminarsScreen({super.key});

  @override
  ConsumerState<SeminarsScreen> createState() => _SeminarsScreenState();
}

class _SeminarsScreenState extends ConsumerState<SeminarsScreen> {
  String _selectedType = 'All';

  final _events = [
    const _EventData('AI & Data Science Hackathon', 'competition', 'Engineering Block', '2026-09-15', '2026-09-17', LucideIcons.brain, AppColors.tertiaryAccent, '48-hour hackathon focused on AI solutions for African challenges. Teams of 3-5. Grand prize M15,000.', true, 'M100'),
    const _EventData('Entrepreneurship Workshop', 'workshop', 'Business School Auditorium', '2026-08-20', '2026-08-20', LucideIcons.briefcase, AppColors.secondaryAccent, 'Learn startup fundamentals from successful founders. Covers ideation, MVP, funding.', false, 'Free'),
    const _EventData('Annual Research Conference', 'conference', 'Main Campus Hall', '2026-10-05', '2026-10-07', LucideIcons.microscope, AppColors.primaryAccent, 'Three-day conference featuring research presentations, keynote speakers, and networking.', true, 'M250'),
    const _EventData('Web Development Bootcamp', 'workshop', 'CS Lab 101', '2026-09-01', '2026-09-30', LucideIcons.globe, AppColors.info, 'Four-week intensive web development bootcamp. HTML, CSS, JavaScript, React, Node.js.', false, 'Free'),
    const _EventData('Debate Competition', 'competition', 'Humanities Hall', '2026-08-25', '2026-08-25', LucideIcons.messageSquare, AppColors.warning, 'Inter-university debate competition. Topics include politics, technology, and social issues.', false, 'Free'),
    const _EventData('Career Fair 2026', 'seminar', 'Student Centre', '2026-09-20', '2026-09-20', LucideIcons.users, AppColors.primaryAccent, 'Meet top employers from across Africa. Bring your CV. Dress code: formal.', false, 'Free'),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final types = ['All', 'seminar', 'workshop', 'competition', 'conference', 'hackathon'];
    final typeIcons = {
      'All': LucideIcons.list, 'seminar': LucideIcons.presentation, 'workshop': LucideIcons.settings,
      'competition': LucideIcons.trophy, 'conference': LucideIcons.mic, 'hackathon': LucideIcons.terminal,
    };

    final filtered = _selectedType == 'All'
        ? _events
        : _events.where((e) => e.type == _selectedType).toList();

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('Seminars & Competitions',
                style: Theme.of(context).textTheme.headlineSmall),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: types.map((type) {
                    final isSelected = _selectedType == type;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: CampusChip(
                        label: type == 'All' ? 'All' : '${type[0].toUpperCase()}${type.substring(1)}s',
                        isSelected: isSelected,
                        onTap: () => setState(() => _selectedType = type),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            if (filtered.isEmpty)
              const SliverFillRemaining(
                child: EmptyState(icon: LucideIcons.calendarX, title: 'No events found',
                  message: 'Try a different category'),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final e = filtered[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: CampusCard(
                          onTap: () => _showDetail(context, e, isDark),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 52, height: 52,
                                  decoration: BoxDecoration(
                                    gradient: AppColors.heroGradient,
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: Icon(e.icon, color: Colors.white, size: 24),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(e.name,
                                        style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          const Icon(LucideIcons.calendar, size: 12, color: AppColors.textSecondary),
                                          const SizedBox(width: 4),
                                          Text('${e.startDate}${e.startDate != e.endDate ? ' - ${e.endDate}' : ''}',
                                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
                                        ],
                                      ),
                                      const SizedBox(height: 2),
                                      Row(
                                        children: [
                                          const Icon(LucideIcons.mapPin, size: 12, color: AppColors.textSecondary),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text(e.location,
                                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                                              overflow: TextOverflow.ellipsis),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          StatusBadge(text: e.type[0].toUpperCase() + e.type.substring(1), color: e.color, isSmall: true),
                                          const SizedBox(width: 6),
                                          Text(e.fee == 'Free' ? 'Free' : e.fee,
                                            style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600, color: AppColors.tertiaryAccent)),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(LucideIcons.chevronRight, color: AppColors.textSecondary, size: 18),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                    childCount: filtered.length,
                  ),
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }

  void _showDetail(BuildContext context, _EventData e, bool isDark) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7, minChildSize: 0.4, maxChildSize: 0.9,
        expand: false,
        builder: (ctx, scrollCtrl) => SingleChildScrollView(
          controller: scrollCtrl,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2)))),
              Row(
                children: [
                  Container(
                    width: 56, height: 56,
                    decoration: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(14)),
                    child: Icon(e.icon, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(e.name, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      StatusBadge(text: e.type[0].toUpperCase() + e.type.substring(1), color: e.color),
                    ],
                  )),
                ],
              ),
              const Divider(height: 24),
              _detailRow(context, LucideIcons.calendar, '${e.startDate}${e.startDate != e.endDate ? ' to ${e.endDate}' : ''}'),
              const SizedBox(height: 8),
              _detailRow(context, LucideIcons.mapPin, e.location),
              const SizedBox(height: 8),
              _detailRow(context, LucideIcons.dollarSign, e.fee == 'Free' ? 'Free entry' : 'Entry: ${e.fee}'),
              const SizedBox(height: 8),
              _detailRow(context, LucideIcons.users, '${e.isOnline ? 'Online' : 'In-person'} event'),
              const SizedBox(height: 16),
              Text(e.description, style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.5)),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: CampusButton(
                  label: e.fee == 'Free' ? 'Register Now' : 'Register (${e.fee})',
                  icon: LucideIcons.ticket,
                  onPressed: () {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Registration submitted! Check your email.'), duration: Duration(seconds: 2)));
                  },
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailRow(BuildContext context, IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: Theme.of(context).textTheme.bodyMedium)),
      ],
    );
  }
}

class _EventData {
  final String name;
  final String type;
  final String location;
  final String startDate;
  final String endDate;
  final IconData icon;
  final Color color;
  final String description;
  final bool isOnline;
  final String fee;

  const _EventData(this.name, this.type, this.location, this.startDate, this.endDate,
    this.icon, this.color, this.description, this.isOnline, this.fee);
}
