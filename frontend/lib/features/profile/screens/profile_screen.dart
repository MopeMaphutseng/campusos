import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/services/api_service.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/settings/screens/settings_screen.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _data = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get(
        '/api/v1/profile/analytics',
        timeout: const Duration(seconds: 30),
      );
      final body = res.data;
      final data = (body is Map && body['data'] is Map)
          ? Map<String, dynamic>.from(body['data'] as Map)
          : <String, dynamic>{};
      if (mounted) setState(() => _data = data);
    } on DioException {
      if (mounted) setState(() => _error = 'Could not load your profile. Pull to retry.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile & Analytics'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.settings, size: 20),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? EmptyState(
                  icon: LucideIcons.userX,
                  title: 'Unable to load',
                  message: _error,
                  actionLabel: 'Retry',
                  onAction: _load,
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: _content(isDark),
                ),
    );
  }

  Widget _content(bool isDark) {
    final profile = (_data['profile'] as Map?)?.cast<String, dynamic>() ?? {};
    final stats = (_data['stats'] as Map?)?.cast<String, dynamic>() ?? {};
    final goals = (_data['goals'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final achievements = (_data['achievements'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    return ListView(
      padding: const EdgeInsets.all(16),
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        _header(profile, isDark),
        const SizedBox(height: 16),
        _statsGrid(stats, isDark),
        const SizedBox(height: 20),
        if (goals.isNotEmpty) ...[
          _sectionTitle('Goals'),
          const SizedBox(height: 10),
          ...goals.map((g) => _goalTile(g, isDark)),
          const SizedBox(height: 20),
        ],
        if (achievements.isNotEmpty) ...[
          _sectionTitle('Achievements'),
          const SizedBox(height: 10),
          _achievementsGrid(achievements, isDark),
        ],
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _sectionTitle(String text) {
    return Text(
      text,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
    );
  }

  Widget _header(Map<String, dynamic> p, bool isDark) {
    final first = (p['firstName'] ?? '').toString();
    final last = (p['lastName'] ?? '').toString();
    final name = '$first $last'.trim();
    final initials = [first, last]
        .where((s) => s.isNotEmpty)
        .map((s) => s[0].toUpperCase())
        .join();

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: Colors.white.withValues(alpha: 0.2),
            backgroundImage: (p['avatarUrl'] != null && p['avatarUrl'].toString().isNotEmpty)
                ? NetworkImage(p['avatarUrl'].toString())
                : null,
            child: (p['avatarUrl'] == null || p['avatarUrl'].toString().isEmpty)
                ? Text(
                    initials.isEmpty ? '?' : initials,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 22),
                  )
                : null,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name.isEmpty ? 'Student' : name,
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 2),
                Text(
                  (p['email'] ?? '').toString(),
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    if ((p['program'] ?? '').toString().isNotEmpty) _badge(p['program'].toString()),
                    if ((p['faculty'] ?? '').toString().isNotEmpty) _badge(p['faculty'].toString()),
                    if (p['yearOfStudy'] != null) _badge('Year ${p['yearOfStudy']}'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _badge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }

  Widget _statsGrid(Map<String, dynamic> s, bool isDark) {
    final items = [
      ('Tutor Chats', s['sessions'] ?? 0, LucideIcons.messageCircle, AppColors.primaryAccent),
      ('Messages', s['messages'] ?? 0, LucideIcons.messageSquare, AppColors.violet),
      ('Courses', s['enrolledCourses'] ?? 0, LucideIcons.bookOpen, AppColors.tertiaryAccent),
      ('Streak', '${s['currentStreak'] ?? 0}d', LucideIcons.flame, AppColors.warning),
      ('Avg Grade', s['averageGrade'] != null ? '${s['averageGrade']}%' : '—', LucideIcons.trendingUp, AppColors.success),
      ('Days Active', s['daysActive'] ?? 0, LucideIcons.calendarCheck, AppColors.info),
    ];

    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 0.95,
      children: items.map((it) {
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.black.withValues(alpha: 0.06),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(it.$3, size: 18, color: it.$4),
              const Spacer(),
              Text(
                it.$2.toString(),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
              ),
              Text(
                it.$1,
                style: TextStyle(fontSize: 11, color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _goalTile(Map<String, dynamic> g, bool isDark) {
    final target = (g['target'] as num?)?.toDouble() ?? 1;
    final progress = (g['progress'] as num?)?.toDouble() ?? 0;
    final ratio = (progress / (target == 0 ? 1 : target)).clamp(0.0, 1.0);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.black.withValues(alpha: 0.06),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  g['title']?.toString() ?? '',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
              Text(
                '${g['progress']}/${g['target']} ${g['unit'] ?? ''}',
                style: TextStyle(fontSize: 12, color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: ratio,
              minHeight: 8,
              backgroundColor: AppColors.primaryAccent.withValues(alpha: 0.12),
              valueColor: const AlwaysStoppedAnimation(AppColors.primaryAccent),
            ),
          ),
        ],
      ),
    );
  }

  Widget _achievementsGrid(List<Map<String, dynamic>> achievements, bool isDark) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: achievements.map((a) {
        final earned = a['earned'] == true;
        return Container(
          width: 104,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: earned
                ? AppColors.secondaryAccent.withValues(alpha: 0.12)
                : (isDark ? AppColors.surfaceDark : AppColors.surfaceLight),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: earned
                  ? AppColors.secondaryAccent.withValues(alpha: 0.4)
                  : (isDark ? Colors.white.withValues(alpha: 0.06) : Colors.black.withValues(alpha: 0.06)),
            ),
          ),
          child: Column(
            children: [
              Icon(
                earned ? LucideIcons.medal : LucideIcons.lock,
                size: 22,
                color: earned ? AppColors.secondaryAccent : AppColors.textSecondary,
              ),
              const SizedBox(height: 6),
              Text(
                a['title']?.toString() ?? '',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: earned ? null : AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                a['description']?.toString() ?? '',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 9, color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
