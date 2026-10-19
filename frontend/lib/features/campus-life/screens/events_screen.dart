import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

enum EventCategory { all, academic, sports, social, career, cultural }

class _EventData {
  final String name;
  final String dateTime;
  final String location;
  final EventCategory category;
  final int goingCount;
  final String description;
  final String organizer;
  final String? ticketPrice;
  final IconData icon;
  final Gradient gradient;

  const _EventData({
    required this.name,
    required this.dateTime,
    required this.location,
    required this.category,
    required this.goingCount,
    required this.description,
    required this.organizer,
    this.ticketPrice,
    required this.icon,
    required this.gradient,
  });
}

final _demoEvents = [
  _EventData(
    name: 'Annual Career Fair',
    dateTime: 'Fri, Aug 14 · 9:00 AM – 4:00 PM',
    location: 'Student Center, Main Hall',
    category: EventCategory.career,
    goingCount: 234,
    description:
        'Meet recruiters from top companies across various industries. Bring your résumé and dress professionally. On-the-spot interviews available for select positions.',
    organizer: 'Career Services Office',
    ticketPrice: null,
    icon: LucideIcons.briefcase,
    gradient: AppColors.heroGradient,
  ),
  _EventData(
    name: 'Basketball Tournament Finals',
    dateTime: 'Sat, Aug 22 · 2:00 PM – 6:00 PM',
    location: 'Indoor Sports Arena',
    category: EventCategory.sports,
    goingCount: 412,
    description:
        'The championship match of the inter-department basketball tournament. Come support your faculty team and enjoy halftime entertainment.',
    organizer: 'Department of Sports',
    ticketPrice: 'M25 (students) / M50 (general)',
    icon: LucideIcons.trophy,
    gradient: AppColors.warmGradient,
  ),
  _EventData(
    name: 'End-of-Year Social Gala',
    dateTime: 'Sat, Sep 5 · 7:00 PM – 11:00 PM',
    location: 'Campus Amphitheatre',
    category: EventCategory.social,
    goingCount: 389,
    description:
        'An evening of music, dancing, and celebration to wrap up the academic year. Live band performance, photo booth, and refreshments included.',
    organizer: 'Student Affairs Council',
    ticketPrice: 'M150 (early bird) / M200 (at door)',
    icon: LucideIcons.music,
    gradient: AppColors.successGradient,
  ),
  _EventData(
    name: 'Research Symposium 2026',
    dateTime: 'Wed, Aug 19 · 10:00 AM – 3:00 PM',
    location: 'Library Auditorium',
    category: EventCategory.academic,
    goingCount: 98,
    description:
        'Undergraduate and postgraduate students present their research projects across all faculties. Prizes awarded for best presentations.',
    organizer: 'Faculty of Science & Technology',
    ticketPrice: null,
    icon: LucideIcons.microscope,
    gradient: const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppColors.violet, AppColors.indigo],
    ),
  ),
  _EventData(
    name: 'Cultural Festival & Food Fair',
    dateTime: 'Thu, Aug 27 · 11:00 AM – 7:00 PM',
    location: 'University Quad',
    category: EventCategory.cultural,
    goingCount: 567,
    description:
        'Celebrate diversity with traditional performances, art exhibitions, and cuisines from around the world. Wear your traditional attire and represent your culture!',
    organizer: 'Cultural Affairs Committee',
    ticketPrice: 'M30 (entry)',
    icon: LucideIcons.globe,
    gradient: const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppColors.cyan, AppColors.cyanText],
    ),
  ),
  _EventData(
    name: 'Tech Talk: AI in Africa',
    dateTime: 'Mon, Aug 31 · 2:00 PM – 4:00 PM',
    location: 'Engineering Block, Room 201',
    category: EventCategory.academic,
    goingCount: 145,
    description:
        'Guest lecture by Dr. Amara Okafor on the impact of artificial intelligence across African industries. Q&A session to follow.',
    organizer: 'Computer Science Department',
    ticketPrice: null,
    icon: LucideIcons.brain,
    gradient: const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppColors.orange, AppColors.orangeText],
    ),
  ),
  _EventData(
    name: 'Startup Pitch Night',
    dateTime: 'Wed, Sep 9 · 5:30 PM – 8:00 PM',
    location: 'Innovation Hub, Ground Floor',
    category: EventCategory.career,
    goingCount: 176,
    description:
        'Student entrepreneurs pitch their startup ideas to a panel of investors and industry experts. Network with founders and potential co-founders over refreshments.',
    organizer: 'Innovation Hub & Entrepreneurship Club',
    ticketPrice: null,
    icon: LucideIcons.rocket,
    gradient: AppColors.heroGradient,
  ),
  _EventData(
    name: 'Spoken Word & Poetry Slam',
    dateTime: 'Fri, Sep 11 · 6:00 PM – 9:00 PM',
    location: 'Performing Arts Centre',
    category: EventCategory.cultural,
    goingCount: 203,
    description:
        'An evening of powerful storytelling and spoken word performances. Open mic slots available — sign up at the door. Winners receive publication opportunities.',
    organizer: 'Literature & Arts Society',
    ticketPrice: 'M15',
    icon: LucideIcons.feather,
    gradient: AppColors.warmGradient,
  ),
  _EventData(
    name: 'Faculty vs Faculty Soccer Match',
    dateTime: 'Tue, Sep 15 · 4:00 PM – 6:00 PM',
    location: 'Main Sports Field',
    category: EventCategory.sports,
    goingCount: 521,
    description:
        'The rivalry continues! Engineering takes on Humanities in this annual grudge match. Bring your banners and show your faculty pride.',
    organizer: 'Sports Union',
    ticketPrice: null,
    icon: LucideIcons.circle,
    gradient: AppColors.successGradient,
  ),
  _EventData(
    name: 'Board Games Night',
    dateTime: 'Sat, Sep 19 · 6:00 PM – 10:00 PM',
    location: 'Student Lounge, Block C',
    category: EventCategory.social,
    goingCount: 67,
    description:
        'Unwind with friends over board games, card games, and console gaming. Snacks and drinks provided. Bring your favourite game to share!',
    organizer: 'Social Activities Committee',
    ticketPrice: null,
    icon: LucideIcons.dices,
    gradient: const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppColors.tertiaryAccent, AppColors.emeraldText],
    ),
  ),
];

final _categoryColors = {
  EventCategory.academic: AppColors.primaryAccent,
  EventCategory.sports: AppColors.warning,
  EventCategory.social: AppColors.tertiaryAccent,
  EventCategory.career: AppColors.violet,
  EventCategory.cultural: AppColors.cyan,
};

final _categoryIcons = {
  EventCategory.academic: LucideIcons.graduationCap,
  EventCategory.sports: LucideIcons.trophy,
  EventCategory.social: LucideIcons.users,
  EventCategory.career: LucideIcons.briefcase,
  EventCategory.cultural: LucideIcons.globe,
};

String _categoryLabel(EventCategory c) {
  switch (c) {
    case EventCategory.all:
      return 'All';
    case EventCategory.academic:
      return 'Academic';
    case EventCategory.sports:
      return 'Sports';
    case EventCategory.social:
      return 'Social';
    case EventCategory.career:
      return 'Career';
    case EventCategory.cultural:
      return 'Cultural';
  }
}

class EventsScreen extends ConsumerStatefulWidget {
  const EventsScreen({super.key});

  @override
  ConsumerState<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends ConsumerState<EventsScreen> {
  EventCategory _selectedCategory = EventCategory.all;

  List<_EventData> get _filteredEvents {
    if (_selectedCategory == EventCategory.all) return _demoEvents;
    return _demoEvents.where((e) => e.category == _selectedCategory).toList();
  }

  void _showEventDetails(_EventData event) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _EventDetailSheet(event: event),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filtered = _filteredEvents;

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('Events', style: Theme.of(context).textTheme.headlineSmall),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 48,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: EventCategory.values.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final cat = EventCategory.values[index];
                    final isSelected = cat == _selectedCategory;
                    return CampusChip(
                      label: _categoryLabel(cat),
                      isSelected: isSelected,
                      selectedColor: cat == EventCategory.all
                          ? AppColors.primaryAccent
                          : _categoryColors[cat],
                      icon: cat == EventCategory.all ? null : _categoryIcons[cat],
                      onTap: () => setState(() => _selectedCategory = cat),
                    );
                  },
                ),
              ),
            ),
            if (filtered.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: EmptyState(
                  icon: LucideIcons.calendarX,
                  title: 'No events found',
                  message: 'No ${_selectedCategory.name.toLowerCase()} events scheduled',
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final event = filtered[index];
                    final catColor = _categoryColors[event.category]!;
                    return CampusCard(
                      onTap: () => _showEventDetails(event),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              gradient: event.gradient,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(event.icon, color: Colors.white, size: 22),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  event.name,
                                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(LucideIcons.clock, size: 12, color: AppColors.textSecondary),
                                    const SizedBox(width: 4),
                                    Text(
                                      event.dateTime,
                                      style: Theme.of(context).textTheme.bodySmall,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Icon(LucideIcons.mapPin, size: 12, color: AppColors.textSecondary),
                                    const SizedBox(width: 4),
                                    Text(
                                      event.location,
                                      style: Theme.of(context).textTheme.bodySmall,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    StatusBadge(text: _categoryLabel(event.category), color: catColor, isSmall: true),
                                    const SizedBox(width: 8),
                                    Icon(LucideIcons.userCheck, size: 12, color: AppColors.tertiaryAccent),
                                    const SizedBox(width: 3),
                                    Text(
                                      '${event.goingCount} going',
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: AppColors.tertiaryAccent,
                                            fontSize: 11,
                                          ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            LucideIcons.chevronRight,
                            size: 18,
                            color: AppColors.textSecondary,
                          ),
                        ],
                      ),
                    );
                  },
                  childCount: filtered.length,
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }
}

class _EventDetailSheet extends StatelessWidget {
  final _EventData event;

  const _EventDetailSheet({required this.event});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final catColor = _categoryColors[event.category]!;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      margin: const EdgeInsets.only(top: 60),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(24, 8, 24, 24 + bottomInset),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : AppColors.skeletonBase(),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: event.gradient,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(event.icon, color: Colors.white, size: 26),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        event.name,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 4),
                      StatusBadge(text: _categoryLabel(event.category), color: catColor),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _detailRow(context, LucideIcons.clock, event.dateTime),
            const SizedBox(height: 8),
            _detailRow(context, LucideIcons.mapPin, event.location),
            const SizedBox(height: 8),
            _detailRow(context, LucideIcons.userCheck, '${event.goingCount} people going'),
            const SizedBox(height: 8),
            _detailRow(context, LucideIcons.building, event.organizer),
            if (event.ticketPrice != null) ...[
              const SizedBox(height: 8),
              _detailRow(context, LucideIcons.ticket, event.ticketPrice!),
            ],
            const SizedBox(height: 20),
            Text(
              'Description',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              event.description,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
                    height: 1.5,
                  ),
            ),
            const SizedBox(height: 24),
            CampusButton(
              label: 'RSVP',
              icon: LucideIcons.calendarCheck,
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('RSVP\'d for ${event.name}'),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(BuildContext context, IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}
