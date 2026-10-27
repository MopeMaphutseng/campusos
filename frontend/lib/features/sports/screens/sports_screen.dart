import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class SportsScreen extends ConsumerStatefulWidget {
  const SportsScreen({super.key});

  @override
  ConsumerState<SportsScreen> createState() => _SportsScreenState();
}

class _SportsScreenState extends ConsumerState<SportsScreen> {
  int _selectedTab = 0;

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
              title: Text('Sports', style: Theme.of(context).textTheme.headlineSmall),
            ),
            SliverToBoxAdapter(
              child: _buildLiveTicker(context, isDark),
            ),
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08),
                  ),
                ),
                child: Row(
                  children: [
                    _tabButton('Fixtures', 0),
                    _tabButton('Standings', 1),
                    _tabButton('League', 2),
                  ],
                ),
              ),
            ),
            if (_selectedTab == 0) ...[
              const SliverToBoxAdapter(
                child: SectionHeader(title: 'Today\'s Fixtures', actionText: 'This Week'),
              ),
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _FixtureCard(fixture: _fixtures[index], isDark: isDark),
                  childCount: _fixtures.length,
                ),
              ),
            ] else if (_selectedTab == 1) ...[
              const SliverToBoxAdapter(
                child: SectionHeader(title: 'Premier League Standings'),
              ),
              SliverToBoxAdapter(
                child: _buildStandingsTable(context, isDark),
              ),
            ] else ...[
              const SliverToBoxAdapter(
                child: SectionHeader(title: 'Campus League'),
              ),
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _LeagueCard(league: _campusLeagues[index], isDark: isDark),
                  childCount: _campusLeagues.length,
                ),
              ),
            ],
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveTicker(BuildContext context, bool isDark) {
    return Container(
      height: 100,
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      decoration: BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Stack(
        children: [
          Positioned(
            top: 10,
            left: 16,
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.error,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(width: 6),
                const Text('Premier League', style: TextStyle(color: Colors.white70, fontSize: 11)),
              ],
            ),
          ),
          Positioned(
            bottom: 12,
            left: 16,
            right: 16,
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Matlama FC', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
                      Text('LM RFC', style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 12)),
                    ],
                  ),
                ),
                const Text('2 – 1', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
                const Spacer(),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('67\'', style: TextStyle(color: AppColors.secondaryAccent, fontSize: 14, fontWeight: FontWeight.w700)),
                    Text('2nd Half', style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 10)),
                  ],
                ),
              ],
            ),
          ),
        ],
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

  Widget _buildStandingsTable(BuildContext context, bool isDark) {
    return CampusCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.grey.withValues(alpha: 0.05),
            ),
            child: Row(
              children: [
                const SizedBox(width: 24, child: Text('#', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700))),
                const Expanded(flex: 3, child: Text('Team', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700))),
                _tableHeader('P'),
                _tableHeader('W'),
                _tableHeader('D'),
                _tableHeader('L'),
                _tableHeader('Pts', isBold: true),
              ],
            ),
          ),
          ..._standings.asMap().entries.map((entry) {
            final i = entry.key;
            final team = entry.value;
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.withValues(alpha: 0.06),
                  ),
                ),
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 24,
                    child: Text('${i + 1}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                  ),
                  Expanded(
                    flex: 3,
                    child: Text(team[0], style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
                  ),
                  _tableCell(team[1]),
                  _tableCell(team[2]),
                  _tableCell(team[3]),
                  _tableCell(team[4]),
                  _tableCell(team[5], isBold: true),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _tableHeader(String text, {bool isBold = false}) {
    return SizedBox(
      width: 32,
      child: Text(text, style: TextStyle(fontSize: 11, fontWeight: isBold ? FontWeight.w700 : FontWeight.w600), textAlign: TextAlign.center),
    );
  }

  Widget _tableCell(String text, {bool isBold = false}) {
    return SizedBox(
      width: 32,
      child: Text(text, style: TextStyle(fontSize: 12, fontWeight: isBold ? FontWeight.w700 : FontWeight.w400), textAlign: TextAlign.center),
    );
  }
}

class _FixtureCard extends StatelessWidget {
  final _FixtureData fixture;
  final bool isDark;

  const _FixtureCard({required this.fixture, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return CampusCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              StatusBadge(
                text: fixture.league,
                color: AppColors.primaryAccent,
                isSmall: true,
              ),
              const SizedBox(width: 8),
              Text(fixture.date, style: Theme.of(context).textTheme.bodySmall),
              const Spacer(),
              Text(fixture.time, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Text(fixture.homeTeam, style: Theme.of(context).textTheme.titleSmall),
              ),
              Text('vs', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
              const SizedBox(width: 8),
              Text(fixture.score ?? '--', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(width: 8),
              Text('--', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
              Expanded(
                child: Text(fixture.awayTeam, style: Theme.of(context).textTheme.titleSmall, textAlign: TextAlign.end),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(LucideIcons.mapPin, size: 13, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text(fixture.venue, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }
}

class _LeagueCard extends StatelessWidget {
  final _LeagueData league;
  final bool isDark;

  const _LeagueCard({required this.league, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return CampusCard(
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: league.accentColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(league.icon, color: league.accentColor, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(league.name, style: Theme.of(context).textTheme.titleSmall),
                Text('${league.teams} teams • ${league.status}', style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: Text(league.isJoined ? 'Already Joined' : 'Join ${league.name}'),
                  content: Text(league.isJoined
                    ? 'You are already a member of this league.'
                    : 'Would you like to join the ${league.name}?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                    if (!league.isJoined)
                      ElevatedButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Joined ${league.name}')),
                          );
                        },
                        child: const Text('Join'),
                      ),
                  ],
                ),
              );
            },
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            ),
            child: Text(league.isJoined ? 'Joined' : 'Join', style: const TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }
}

const _fixtures = [
  _FixtureData('Matlama FC', 'LM RFC', 'Premier League', 'Today', '15:00', 'Setsoto Stadium', '2 - 1'),
  _FixtureData('LDF FC', 'Bantu FC', 'Premier League', 'Tomorrow', '14:00', 'Ratjomose', null),
  _FixtureData('CS vs ENG', 'Campus Derby', 'Campus League', 'Sat', '10:00', 'Main Field', null),
  _FixtureData('Lifofane', 'Galaxy FC', 'Premier League', 'Sun', '15:00', 'LCS Ground', null),
];

const _standings = [
  ['Matlama FC', '24', '18', '4', '2', '58'],
  ['Bantu FC', '24', '16', '5', '3', '53'],
  ['LDF FC', '24', '15', '4', '5', '49'],
  ['Galaxy FC', '24', '13', '6', '5', '45'],
  ['LM RFC', '24', '12', '5', '7', '41'],
];

const _campusLeagues = [
  _LeagueData('Football League', 8, 'In Progress', LucideIcons.trophy, AppColors.tertiaryAccent, true),
  _LeagueData('Basketball Cup', 6, 'Registration Open', LucideIcons.circle, AppColors.secondaryAccent, false),
  _LeagueData('Volleyball Tournament', 10, 'Starting Soon', LucideIcons.circle, AppColors.primaryAccent, false),
];

class _FixtureData {
  final String homeTeam;
  final String awayTeam;
  final String league;
  final String date;
  final String time;
  final String venue;
  final String? score;

  const _FixtureData(this.homeTeam, this.awayTeam, this.league, this.date, this.time, this.venue, this.score);
}

class _LeagueData {
  final String name;
  final int teams;
  final String status;
  final IconData icon;
  final Color accentColor;
  final bool isJoined;

  const _LeagueData(this.name, this.teams, this.status, this.icon, this.accentColor, this.isJoined);
}
