import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/services/api_service.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class AcademicsScreen extends ConsumerStatefulWidget {
  const AcademicsScreen({super.key});

  @override
  ConsumerState<AcademicsScreen> createState() => _AcademicsScreenState();
}

class _AcademicsScreenState extends ConsumerState<AcademicsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';
  late final Future<List<dynamic>> _enrollmentsFuture;
  late final Future<List<dynamic>> _timetableFuture;
  late final Future<List<List<dynamic>>> _academicFuture;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    final api = ref.read(apiServiceProvider);
    _enrollmentsFuture = api.getMyEnrollments();
    _timetableFuture = api.getMyTimetable();
    _academicFuture = Future.wait([_enrollmentsFuture, _timetableFuture]);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: TextField(
                onChanged: (v) => setState(() => _searchQuery = v),
                decoration: InputDecoration(
                  hintText: 'Search courses, professors...',
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
            ),
            const SizedBox(height: 12),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.06)
                      : Colors.grey.withValues(alpha: 0.08),
                ),
              ),
              child: TabBar(
                controller: _tabController,
                labelColor: AppColors.primaryAccent,
                unselectedLabelColor: AppColors.textSecondary,
                labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                unselectedLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                indicatorColor: AppColors.primaryAccent,
                indicatorSize: TabBarIndicatorSize.tab,
                indicatorWeight: 3,
                indicatorPadding: const EdgeInsets.symmetric(horizontal: 12),
                dividerColor: Colors.transparent,
                tabs: const [
                  Tab(text: 'Courses'),
                  Tab(text: 'Timetable'),
                  Tab(text: 'Enrollment'),
                  Tab(text: 'Grades'),
                ],
              ),
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildCoursesTab(isDark),
                  _buildTimetableTab(isDark),
                  _buildEnrollmentTab(isDark),
                  _buildGradesTab(isDark),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static const List<Color> _courseColors = [
    AppColors.primaryAccent,
    AppColors.tertiaryAccent,
    AppColors.secondaryAccent,
    AppColors.info,
    AppColors.warning,
  ];

  String _hhmm(String raw) {
    final parts = raw.split(':');
    return '${parts[0].padLeft(2, '0')}:${parts.length > 1 ? parts[1].padLeft(2, '0') : '00'}';
  }

  String _dayAbbr(String day) {
    const abbr = {
      'monday': 'Mon', 'tuesday': 'Tue', 'wednesday': 'Wed',
      'thursday': 'Thu', 'friday': 'Fri', 'saturday': 'Sat', 'sunday': 'Sun',
    };
    return abbr[day.toLowerCase()] ?? day;
  }

  String _scheduleFrom(List<dynamic> entries) {
    const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    final sorted = [...entries]..sort((a, b) {
        final d = order.indexOf((a['dayOfWeek'] ?? '').toString().toLowerCase()) -
            order.indexOf((b['dayOfWeek'] ?? '').toString().toLowerCase());
        return d != 0
            ? d
            : _hhmm(a['startTime'].toString()).compareTo(_hhmm(b['startTime'].toString()));
      });
    final byTime = <String, List<String>>{};
    for (final e in sorted) {
      final key = '${_hhmm(e['startTime'].toString())} – ${_hhmm(e['endTime'].toString())}';
      byTime.putIfAbsent(key, () => []).add(_dayAbbr((e['dayOfWeek'] ?? '').toString()));
    }
    return byTime.entries.map((kv) => '${kv.value.join(', ')} ${kv.key}').join(' · ');
  }

  String _nextClassFrom(List<dynamic> entries) {
    if (entries.isEmpty) return 'To be announced';
    const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    final now = DateTime.now();
    final todayIdx = now.weekday % 7;
    final nowMin = now.hour * 60 + now.minute;
    var best = 'To be announced';
    var bestDelta = 1 << 30;
    for (final e in entries) {
      final dayIdx = order.indexOf((e['dayOfWeek'] ?? '').toString().toLowerCase());
      if (dayIdx < 0) continue;
      final st = _hhmm(e['startTime'].toString()).split(':');
      final startMin = int.parse(st[0]) * 60 + int.parse(st[1]);
      var delta = (dayIdx - todayIdx) * 1440 + (startMin - nowMin);
      if (delta <= 0) delta += 7 * 1440;
      if (delta < bestDelta) {
        bestDelta = delta;
        final time = _hhmm(e['startTime'].toString());
        best = delta < 1440 && dayIdx == todayIdx
            ? 'Today, $time'
            : '${_dayAbbr((e['dayOfWeek'] ?? '').toString())}, $time';
      }
    }
    return best;
  }

  List<_CourseData> _buildLiveCourses(List<dynamic> enrollments, List<dynamic> timetable) {
    final courses = <_CourseData>[];
    var i = 0;
    for (final e in enrollments) {
      if ((e['status'] ?? '').toString() == 'dropped') continue;
      final course = e['course'] as Map<String, dynamic>? ?? const {};
      final entries = timetable.where((t) => t['courseId'] == e['courseId']).toList();
      var professor = 'To be announced';
      for (final t in entries) {
        final n = (t['instructorName'] ?? '').toString();
        if (n.isNotEmpty) {
          professor = n;
          break;
        }
      }
      final room = entries.isEmpty
          ? 'To be announced'
          : [entries.first['venue'], entries.first['building']]
              .where((x) => x != null && x.toString().isNotEmpty)
              .join(', ');
      final score = double.tryParse((e['grade'] ?? '').toString());
      final letter = (e['letterGrade'] ?? '').toString();
      courses.add(_CourseData(
        code: (course['code'] ?? '—').toString(),
        name: (course['name'] ?? '').toString(),
        professor: professor,
        schedule: entries.isEmpty ? 'No timetable entries yet' : _scheduleFrom(entries),
        room: room,
        nextClass: _nextClassFrom(entries),
        color: _courseColors[i % _courseColors.length],
        credits: course['credits']?.toString() ?? '—',
        department: (course['department'] ?? '—').toString(),
        status: (e['status'] ?? '—').toString(),
        gradeText: score != null
            ? '${score.toStringAsFixed(1)}%${letter.isNotEmpty ? ' ($letter)' : ''}'
            : 'No grade yet',
      ));
      i++;
    }
    return courses;
  }

  Widget _buildCoursesTab(bool isDark) {
    return FutureBuilder<List<List<dynamic>>>(
      future: _academicFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'Could not load your courses right now.',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ),
          );
        }
        final courses = _buildLiveCourses(snapshot.data![0], snapshot.data![1]);
        final filtered = _searchQuery.isEmpty
            ? courses
            : courses
                .where((c) =>
                    c.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                    c.code.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                    c.professor.toLowerCase().contains(_searchQuery.toLowerCase()))
                .toList();

        if (courses.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'You are not enrolled in any courses yet.',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.only(top: 16, bottom: 100),
          physics: const BouncingScrollPhysics(),
          itemCount: filtered.length,
          itemBuilder: (context, index) => _CourseCard(
            course: filtered[index],
            isDark: isDark,
            onTap: () => _openCourseDetails(filtered[index]),
          ),
        );
      },
    );
  }

  void _openCourseDetails(_CourseData course) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.65,
        minChildSize: 0.4,
        maxChildSize: 0.85,
        expand: false,
        builder: (ctx, scrollCtrl) => SingleChildScrollView(
          controller: scrollCtrl,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2))),
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: course.color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(course.code, style: TextStyle(color: course.color, fontWeight: FontWeight.w700, fontSize: 18)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(course.name, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(LucideIcons.user, size: 14, color: AppColors.textSecondary),
                            const SizedBox(width: 4),
                            Text(course.professor, style: Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 28),
              _detailRow(LucideIcons.clock, 'Schedule', course.schedule, isDark),
              const SizedBox(height: 12),
              _detailRow(LucideIcons.mapPin, 'Room', course.room, isDark),
              const SizedBox(height: 12),
              _detailRow(LucideIcons.calendar, 'Next Class', course.nextClass, isDark),
              const SizedBox(height: 24),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primaryAccent.withValues(alpha: isDark ? 0.08 : 0.04),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primaryAccent.withValues(alpha: 0.15)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(LucideIcons.info, size: 16, color: AppColors.primaryAccent),
                        const SizedBox(width: 8),
                        Text('Course Information', style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppColors.primaryAccent)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text('Credits: ${course.credits}', style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 4),
                    Text('Department: ${course.department}', style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 4),
                    Text('Enrollment: ${course.status}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.success)),
                    const SizedBox(height: 4),
                    Text('Grade: ${course.gradeText}', style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value, bool isDark) {
    return Row(
      children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : Colors.grey.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 16, color: AppColors.textSecondary),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
            Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500)),
          ],
        ),
      ],
    );
  }

  Widget _buildTimetableTab(bool isDark) {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    final hours = List.generate(12, (i) => 7 + i);
    return FutureBuilder<List<List<dynamic>>>(
      future: _academicFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'Could not load your timetable right now.',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ),
          );
        }
        final enrollments = snapshot.data![0];
        final timetable = snapshot.data![1];
        final enrolledIds = enrollments.map((e) => e['courseId']).toSet();
        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        final idIndex = <dynamic, int>{};
        for (final e in enrollments) {
          idIndex[e['courseId']] = idIndex.length;
        }
        final blocks = <_TimeBlock>[];
        for (final t in timetable) {
          if (!enrolledIds.contains(t['courseId'])) continue;
          final dayIdx = dayOrder.indexOf((t['dayOfWeek'] ?? '').toString().toLowerCase());
          if (dayIdx < 0) continue;
          final sp = _hhmm(t['startTime'].toString()).split(':');
          final ep = _hhmm(t['endTime'].toString()).split(':');
          final startHour = int.parse(sp[0]) + int.parse(sp[1]) / 60.0;
          final endHour = int.parse(ep[0]) + int.parse(ep[1]) / 60.0;
          blocks.add(_TimeBlock(
            day: dayIdx,
            startHour: startHour,
            duration: (endHour - startHour).clamp(0.25, 24.0),
            label: (t['courseCode'] ?? '').toString(),
            color: _courseColors[(idIndex[t['courseId']] ?? 0) % _courseColors.length],
          ));
        }

        return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      scrollDirection: Axis.vertical,
      child: Column(
        children: [
          const SizedBox(height: 16),
          SizedBox(
            height: 500,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: SizedBox(
                width: MediaQuery.of(context).size.width,
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 56),
                      child: Row(
                        children: days.map((d) {
                          return Expanded(
                            child: Center(
                              child: Text(
                                d,
                                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                      color: AppColors.textSecondary,
                                    ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Expanded(
                      child: Stack(
                        children: [
                          Column(
                            children: hours.map((hour) {
                              return Expanded(
                                child: Container(
                                  decoration: BoxDecoration(
                                    border: Border(
                                      bottom: BorderSide(
                                        color: Colors.grey.withValues(alpha: 0.08),
                                      ),
                                    ),
                                  ),
                                  child: Align(
                                    alignment: Alignment.centerLeft,
                                    child: Text(
                                      '${hour.toString().padLeft(2, '0')}:00',
                                      style: Theme.of(context).textTheme.bodySmall,
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                          ...blocks.map((block) {
                            final top = (block.startHour - 7) * (480 / 12);
                            final height = block.duration * (480 / 12);
                            return Positioned(
                              top: top,
                              left: 56 + (block.day * ((MediaQuery.of(context).size.width - 56) / 5)),
                              width: (MediaQuery.of(context).size.width - 56) / 5 - 4,
                              height: height,
                              child: Container(
                                margin: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  color: block.color.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: block.color.withValues(alpha: 0.3),
                                  ),
                                ),
                                padding: const EdgeInsets.all(4),
                                child: Text(
                                  block.label,
                                  style: TextStyle(
                                    color: block.color,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
      },
    );
  }

  Widget _buildEnrollmentTab(bool isDark) {
    final actions = [
      _EnrollmentAction('Add Course', LucideIcons.plusCircle, AppColors.success, 'Browse and add new courses'),
      _EnrollmentAction('Drop Course', LucideIcons.minusCircle, AppColors.error, 'Remove a course from your schedule'),
      _EnrollmentAction('Swap Course', LucideIcons.arrowLeftRight, AppColors.info, 'Exchange one course for another'),
      _EnrollmentAction('Waitlist', LucideIcons.clock, AppColors.warning, 'Join the waitlist for full courses'),
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      physics: const BouncingScrollPhysics(),
      children: [
        SectionHeader(
          title: 'Enrollment Actions',
          actionText: 'Deadline: Aug 30',
          onAction: () {
            showModalBottomSheet(
              context: context,
              builder: (ctx) => Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Center(
                    child: Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12, bottom: 8),
                      decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2))),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text('Enrollment Deadline', style: Theme.of(ctx).textTheme.titleMedium),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Deadline'),
                            Text('August 30, 2026', style: TextStyle(fontWeight: FontWeight.w600)),
                          ],
                        ),
                        SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Days Remaining'),
                            Text('31 days',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.accentText(
                                    AppColors.warning,
                                    isDark: Theme.of(context).brightness == Brightness.dark,
                                  ),
                                )),
                          ],
                        ),
                        SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Late Fee'),
                            Text('M 500',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.accentText(
                                    AppColors.error,
                                    isDark: Theme.of(context).brightness == Brightness.dark,
                                  ),
                                )),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: 4),
        ...actions.map((a) => CampusCard(
              onTap: () {
                final detailCtrl = TextEditingController();
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
                        Row(
                          children: [
                            ModuleIcon(icon: a.icon, color: a.color),
                            const SizedBox(width: 12),
                            Text(a.title, style: Theme.of(ctx).textTheme.titleMedium),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(a.description, style: Theme.of(ctx).textTheme.bodySmall),
                        const SizedBox(height: 16),
                        if (a.title == 'Add Course' || a.title == 'Swap Course')
                          TextField(
                            controller: detailCtrl,
                            decoration: const InputDecoration(
                              hintText: 'Course code or name',
                              prefixIcon: Icon(LucideIcons.search, size: 18),
                            ),
                          ),
                        if (a.title == 'Drop Course')
                          TextField(
                            controller: detailCtrl,
                            decoration: const InputDecoration(
                              hintText: 'Course to drop',
                              prefixIcon: Icon(LucideIcons.minusCircle, size: 18),
                            ),
                          ),
                        if (a.title == 'Waitlist')
                          TextField(
                            controller: detailCtrl,
                            decoration: const InputDecoration(
                              hintText: 'Course to join waitlist',
                              prefixIcon: Icon(LucideIcons.clock, size: 18),
                            ),
                          ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: CampusButton(
                            label: '${a.title}',
                            onPressed: () {
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('${a.title} request submitted')),
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
              child: Row(
                children: [
                  ModuleIcon(icon: a.icon, color: a.color),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(a.title, style: Theme.of(context).textTheme.titleSmall),
                        const SizedBox(height: 2),
                        Text(a.description, style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, size: 20),
                ],
              ),
            )),
        const SizedBox(height: 16),
        SectionHeader(title: 'Current Schedule'),
        _buildCurrentScheduleCard(),
      ],
    );
  }

  Widget _buildCurrentScheduleCard() {
    return FutureBuilder<List<dynamic>>(
      future: _enrollmentsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return CampusCard(
            child: const Center(
              child: Padding(
                padding: EdgeInsets.all(12),
                child: CircularProgressIndicator(),
              ),
            ),
          );
        }
        final enrollments = (snapshot.data ?? const [])
            .where((e) => (e['status'] ?? '').toString() != 'dropped')
            .toList();
        var totalCredits = 0;
        for (final e in enrollments) {
          totalCredits += int.tryParse((e['course']?['credits'] ?? 0).toString()) ?? 0;
        }
        return CampusCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Active Enrollments', style: Theme.of(context).textTheme.titleSmall),
                  StatusBadge.success('${enrollments.length} enrolled'),
                ],
              ),
              const SizedBox(height: 8),
              if (enrollments.isEmpty)
                Text('No active enrollments yet.', style: Theme.of(context).textTheme.bodyMedium),
              ...enrollments.map((e) {
                final course = e['course'] as Map<String, dynamic>? ?? const {};
                return _enrollmentRow(
                  context,
                  '${course['code'] ?? ''} – ${course['name'] ?? ''}',
                  '${course['credits'] ?? '—'} credits',
                );
              }),
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Credits', style: Theme.of(context).textTheme.titleSmall),
                  Text('$totalCredits', style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppColors.primaryAccent,
                      )),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _enrollmentRow(BuildContext context, String course, String credits) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(course, style: Theme.of(context).textTheme.bodyMedium),
          Text(credits, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }

  Widget _buildGradesTab(bool isDark) {
    return FutureBuilder<List<dynamic>>(
      future: _enrollmentsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'Could not load your grades right now.',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ),
          );
        }

        final enrollments = snapshot.data ?? const [];
        final grades = enrollments
            .where((e) => e['grade'] != null && e['grade'].toString().isNotEmpty)
            .map((e) {
          final course = e['course'] as Map<String, dynamic>? ?? const {};
          final score = double.tryParse(e['grade'].toString()) ?? 0;
          final letter = (e['letterGrade'] ?? '').toString();
          return _GradeData(
            (course['code'] ?? '—').toString(),
            (course['name'] ?? '').toString(),
            letter.isNotEmpty ? letter : '?',
            score.round(),
          );
        }).toList()
          ..sort((a, b) => a.code.compareTo(b.code));
        final avg =
            grades.isEmpty ? 0.0 : grades.map((g) => g.score).reduce((a, b) => a + b) / grades.length;

        return ListView(
          padding: const EdgeInsets.all(16),
          physics: const BouncingScrollPhysics(),
          children: [
            SectionHeader(title: 'Academic Performance'),
            CampusCard(
              child: Row(
                children: [
                  _gpaStat(context, 'Average', '${avg.toStringAsFixed(1)}%', AppColors.primaryAccent),
                  const SizedBox(width: 24),
                  _gpaStat(context, 'Graded', '${grades.length}', AppColors.tertiaryAccent),
                  const SizedBox(width: 24),
                  _gpaStat(context, 'Enrolled', '${enrollments.length}', AppColors.secondaryAccent),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (grades.isEmpty)
              CampusCard(
                child: Text(
                  'No grades published yet. Once your lecturers publish grades, they will appear here — and your AI tutor will know them too.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              )
            else ...[
              SectionHeader(title: 'Your Courses'),
              ...grades.map((g) => CampusCard(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: _gradeColor(g.grade).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            g.grade,
                            style: TextStyle(
                              color: _gradeColor(g.grade),
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(g.code, style: Theme.of(context).textTheme.labelMedium?.copyWith(
                                    color: AppColors.textSecondary,
                                  )),
                              Text(g.name, style: Theme.of(context).textTheme.titleSmall),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('${g.score}%', style: Theme.of(context).textTheme.titleSmall),
                            const SizedBox(width: 4),
                            SizedBox(
                              width: 80,
                              child: LinearProgressIndicator(
                                value: g.score / 100,
                                backgroundColor: Colors.grey.withValues(alpha: 0.1),
                                valueColor: AlwaysStoppedAnimation(_gradeColor(g.grade)),
                                minHeight: 4,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  )),
            ],
          ],
        );
      },
    );
  }

  Widget _gpaStat(BuildContext context, String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            )),
        const SizedBox(height: 4),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }

  Color _gradeColor(String grade) {
    if (grade.startsWith('A')) return AppColors.success;
    if (grade.startsWith('B')) return AppColors.info;
    if (grade.startsWith('C')) return AppColors.warning;
    return AppColors.error;
  }
}

class _CourseData {
  final String code;
  final String name;
  final String professor;
  final String schedule;
  final String room;
  final String nextClass;
  final Color color;
  final String credits;
  final String department;
  final String status;
  final String gradeText;

  const _CourseData({
    required this.code,
    required this.name,
    required this.professor,
    required this.schedule,
    required this.room,
    required this.nextClass,
    required this.color,
    this.credits = '—',
    this.department = '—',
    this.status = '—',
    this.gradeText = 'No grade yet',
  });
}

class _CourseCard extends StatelessWidget {
  final _CourseData course;
  final bool isDark;
  final VoidCallback? onTap;

  const _CourseCard({required this.course, required this.isDark, this.onTap});

  @override
  Widget build(BuildContext context) {
    return CampusCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: course.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  course.code,
                  style: TextStyle(
                    color: course.color,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
              const Spacer(),
              Icon(LucideIcons.moreVertical, size: 16, color: AppColors.textSecondary),
            ],
          ),
          const SizedBox(height: 12),
          Text(course.name, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(LucideIcons.user, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 6),
              Text(course.professor, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(LucideIcons.clock, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 6),
              Text(course.schedule, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(LucideIcons.mapPin, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 6),
              Text(course.room, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.primaryAccent.withValues(alpha: isDark ? 0.12 : 0.06),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.arrowRight, size: 14, color: AppColors.primaryAccent),
                const SizedBox(width: 6),
                Text(
                  'Next: ${course.nextClass}',
                  style: TextStyle(
                    color: AppColors.primaryAccent,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TimeBlock {
  final int day;
  final double startHour;
  final double duration;
  final String label;
  final Color color;

  const _TimeBlock({
    required this.day,
    required this.startHour,
    required this.duration,
    required this.label,
    required this.color,
  });
}

class _EnrollmentAction {
  final String title;
  final IconData icon;
  final Color color;
  final String description;

  const _EnrollmentAction(this.title, this.icon, this.color, this.description);
}

class _GradeData {
  final String code;
  final String name;
  final String grade;
  final int score;

  const _GradeData(this.code, this.name, this.grade, this.score);
}
