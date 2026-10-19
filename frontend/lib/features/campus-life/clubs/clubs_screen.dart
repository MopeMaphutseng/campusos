import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class ClubsScreen extends ConsumerStatefulWidget {
  const ClubsScreen({super.key});

  @override
  ConsumerState<ClubsScreen> createState() => _ClubsScreenState();
}

class _ClubsScreenState extends ConsumerState<ClubsScreen> {
  final _searchController = TextEditingController();
  String _selectedCategory = 'All';

  final _categories = ['All', 'Academic', 'Social', 'Sports', 'Cultural', 'Religious', 'Professional'];

  final _clubs = [
    {
      'name': 'Computer Science Society',
      'category': 'Academic',
      'members': 145,
      'description': 'Exploring the frontiers of computing through workshops, hackathons, and peer learning sessions.',
      'meetingSchedule': 'Every Wednesday, 15:00 - 16:30',
      'location': 'CS Building, Lab 3',
      'email': 'cssoc@campus.edu',
    },
    {
      'name': 'Debate & Public Speaking',
      'category': 'Academic',
      'members': 89,
      'description': 'Hone your argumentation and oratory skills in a supportive, competitive environment.',
      'meetingSchedule': 'Tuesdays & Thursdays, 17:00 - 18:30',
      'location': 'Humanities Hall, Room 204',
      'email': 'debate@campus.edu',
    },
    {
      'name': 'International Students Association',
      'category': 'Social',
      'members': 210,
      'description': 'Connecting students from around the world through cultural exchange and social events.',
      'meetingSchedule': 'Every Friday, 18:00 - 20:00',
      'location': 'Student Centre, International Lounge',
      'email': 'isa@campus.edu',
    },
    {
      'name': 'Board Games Club',
      'category': 'Social',
      'members': 67,
      'description': 'Weekly board game nights featuring classics, modern strategy games, and tournaments.',
      'meetingSchedule': 'Saturdays, 14:00 - 18:00',
      'location': 'Student Centre, Game Room',
      'email': 'boardgames@campus.edu',
    },
    {
      'name': 'Basketball Team',
      'category': 'Sports',
      'members': 32,
      'description': 'Competitive basketball with regular training, inter-varsity tournaments, and friendly matches.',
      'meetingSchedule': 'Mon/Wed/Fri, 06:00 - 08:00',
      'location': 'Main Gymnasium',
      'email': 'basketball@campus.edu',
    },
    {
      'name': 'Soccer Club',
      'category': 'Sports',
      'members': 55,
      'description': 'Men\'s and women\'s teams training year-round for local and national university leagues.',
      'meetingSchedule': 'Tue/Thu, 16:00 - 18:00',
      'location': 'University Sports Field',
      'email': 'soccer@campus.edu',
    },
    {
      'name': 'Music & Choir Society',
      'category': 'Cultural',
      'members': 120,
      'description': 'A vibrant community of vocalists and instrumentalists performing at campus events.',
      'meetingSchedule': 'Wednesdays, 17:00 - 19:00',
      'location': 'Performing Arts Centre',
      'email': 'music@campus.edu',
    },
    {
      'name': 'African Cultural Society',
      'category': 'Cultural',
      'members': 180,
      'description': 'Celebrating African heritage through dance, music, cuisine, and traditional ceremonies.',
      'meetingSchedule': 'Thursdays, 18:00 - 20:00',
      'location': 'Multipurpose Hall',
      'email': 'african-culture@campus.edu',
    },
    {
      'name': 'Christian Union',
      'category': 'Religious',
      'members': 200,
      'description': 'Weekly fellowship, Bible study, prayer meetings, and community outreach programmes.',
      'meetingSchedule': 'Sundays, 10:00 - 12:00 & Wednesdays 18:00 - 19:30',
      'location': 'Chapel',
      'email': 'christian-union@campus.edu',
    },
    {
      'name': 'Islamic Society',
      'category': 'Religious',
      'members': 95,
      'description': 'Providing prayer facilities, Quran study circles, and cultural awareness events.',
      'meetingSchedule': 'Fridays, 13:00 - 14:00 (Jumu\'ah)',
      'location': 'Prayer Room, Block B',
      'email': 'islamic-soc@campus.edu',
    },
    {
      'name': 'Startup & Innovation Club',
      'category': 'Professional',
      'members': 78,
      'description': 'Fostering entrepreneurship through mentorship, pitch competitions, and networking events.',
      'meetingSchedule': 'Every second Tuesday, 17:30 - 19:00',
      'location': 'Innovation Hub, Co-working Space',
      'email': 'startup@campus.edu',
    },
    {
      'name': 'Law Society',
      'category': 'Professional',
      'members': 112,
      'description': 'Mooting competitions, legal clinics, guest lectures from practising attorneys and judges.',
      'meetingSchedule': 'Wednesdays, 16:00 - 17:30',
      'location': 'Law Faculty, Moot Court',
      'email': 'lawsoc@campus.edu',
    },
  ];

  List<Map<String, dynamic>> get _filteredClubs {
    final query = _searchController.text.toLowerCase().trim();
    return _clubs.where((c) {
      final matchesCategory = _selectedCategory == 'All' || c['category'] == _selectedCategory;
      final matchesSearch = query.isEmpty ||
          (c['name'] as String).toLowerCase().contains(query) ||
          (c['description'] as String).toLowerCase().contains(query);
      return matchesCategory && matchesSearch;
    }).cast<Map<String, dynamic>>().toList();
  }

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  IconData _iconForCategory(String category) {
    switch (category) {
      case 'Academic':
        return LucideIcons.graduationCap;
      case 'Social':
        return LucideIcons.users;
      case 'Sports':
        return LucideIcons.trophy;
      case 'Cultural':
        return LucideIcons.globe;
      case 'Religious':
        return LucideIcons.cross;
      case 'Professional':
        return LucideIcons.briefcase;
      default:
        return LucideIcons.heart;
    }
  }

  Color _colorForCategory(String category) {
    switch (category) {
      case 'Academic':
        return AppColors.primaryAccent;
      case 'Social':
        return AppColors.tertiaryAccent;
      case 'Sports':
        return AppColors.secondaryAccent;
      case 'Cultural':
        return AppColors.info;
      case 'Religious':
        return AppColors.warning;
      case 'Professional':
        return AppColors.error;
      default:
        return AppColors.primaryAccent;
    }
  }

  void _showClubDetail(BuildContext context, Map<String, dynamic> club) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ClubDetailSheet(club: club),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filtered = _filteredClubs;

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('Clubs & Societies', style: Theme.of(context).textTheme.headlineSmall),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search clubs...',
                    prefixIcon: const Icon(LucideIcons.search, size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(LucideIcons.x, size: 18),
                            onPressed: () => _searchController.clear(),
                          )
                        : null,
                    filled: true,
                    fillColor: isDark
                        ? AppColors.surfaceDark.withValues(alpha: 0.5)
                        : Colors.grey.withValues(alpha: 0.06),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _categories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final cat = _categories[index];
                    final selected = cat == _selectedCategory;
                    return FilterChip(
                      label: Text(cat),
                      selected: selected,
                      onSelected: (_) => setState(() => _selectedCategory = cat),
                      selectedColor: _colorForCategory(cat).withValues(alpha: 0.15),
                      checkmarkColor: _colorForCategory(cat),
                      labelStyle: TextStyle(
                        fontSize: 13,
                        fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                        color: selected ? _colorForCategory(cat) : null,
                      ),
                      side: BorderSide.none,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      elevation: 0,
                    );
                  },
                ),
              ),
            ),
            if (filtered.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: EmptyState(
                  icon: LucideIcons.searchX,
                  title: 'No clubs found',
                  message: 'Try a different search or category.',
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final club = filtered[index];
                      final category = club['category'] as String;
                      final color = _colorForCategory(category);
                      return CampusCard(
                        margin: const EdgeInsets.only(bottom: 10),
                        onTap: () => _showClubDetail(context, club),
                        child: Padding(
                          padding: const EdgeInsets.all(0),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(_iconForCategory(category), color: color, size: 22),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            club['name'] as String,
                                            style: Theme.of(context).textTheme.titleSmall?.copyWith(fontSize: 14),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        Text(
                                          '${club['members']}',
                                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                                color: AppColors.textSecondary,
                                              ),
                                        ),
                                        const SizedBox(width: 4),
                                        const Icon(LucideIcons.user, size: 12, color: AppColors.textSecondary),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        StatusBadge(text: category, color: color, isSmall: true),
                                        const Spacer(),
                                        SizedBox(
                                          height: 28,
                                          child: ElevatedButton(
                                            onPressed: () {
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(
                                                  content: Text('Joined ${club['name']}!'),
                                                  duration: const Duration(seconds: 1),
                                                ),
                                              );
                                            },
                                            style: ElevatedButton.styleFrom(
                                              padding: const EdgeInsets.symmetric(horizontal: 12),
                                              backgroundColor: color.withValues(alpha: 0.12),
                                              foregroundColor: color,
                                              elevation: 0,
                                              shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                            ),
                                            child: const Text('Join', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                    childCount: filtered.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ClubDetailSheet extends StatelessWidget {
  final Map<String, dynamic> club;

  const _ClubDetailSheet({required this.club});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final category = club['category'] as String;
    final color = _colorForCategory(category);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.2) : Colors.grey.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(_iconForCategory(category), color: color, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      club['name'] as String,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        StatusBadge(text: category, color: color, isSmall: true),
                        const SizedBox(width: 8),
                        const Icon(LucideIcons.user, size: 12, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          '${club['members']} members',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            club['description'] as String,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.5),
          ),
          const SizedBox(height: 20),
          _DetailRow(icon: LucideIcons.clock, label: 'Meeting', value: club['meetingSchedule'] as String),
          const SizedBox(height: 12),
          _DetailRow(icon: LucideIcons.mapPin, label: 'Location', value: club['location'] as String),
          const SizedBox(height: 12),
          _DetailRow(icon: LucideIcons.mail, label: 'Contact', value: club['email'] as String),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Joined ${club['name']}!'),
                    duration: const Duration(seconds: 1),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                backgroundColor: color,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Join Club', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
  }

  IconData _iconForCategory(String category) {
    switch (category) {
      case 'Academic':
        return LucideIcons.graduationCap;
      case 'Social':
        return LucideIcons.users;
      case 'Sports':
        return LucideIcons.trophy;
      case 'Cultural':
        return LucideIcons.globe;
      case 'Religious':
        return LucideIcons.cross;
      case 'Professional':
        return LucideIcons.briefcase;
      default:
        return LucideIcons.heart;
    }
  }

  Color _colorForCategory(String category) {
    switch (category) {
      case 'Academic':
        return AppColors.primaryAccent;
      case 'Social':
        return AppColors.tertiaryAccent;
      case 'Sports':
        return AppColors.secondaryAccent;
      case 'Cultural':
        return AppColors.info;
      case 'Religious':
        return AppColors.warning;
      case 'Professional':
        return AppColors.error;
      default:
        return AppColors.primaryAccent;
    }
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 10),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: Theme.of(context).textTheme.bodyMedium,
              children: [
                TextSpan(
                  text: '$label: ',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                TextSpan(text: value),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
