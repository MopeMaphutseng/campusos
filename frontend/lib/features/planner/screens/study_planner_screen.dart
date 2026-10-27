import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/services/api_service.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class StudyPlannerScreen extends ConsumerStatefulWidget {
  const StudyPlannerScreen({super.key});

  @override
  ConsumerState<StudyPlannerScreen> createState() => _StudyPlannerScreenState();
}

class _StudyPlannerScreenState extends ConsumerState<StudyPlannerScreen> {
  int _mode = 0; // 0 = roadmap, 1 = practice exam
  final _input = TextEditingController();
  int _weeks = 4;
  String _level = 'intermediate';
  int _questionCount = 5;
  String _difficulty = 'medium';

  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _plans = [];
  List<Map<String, dynamic>> _questions = [];

  Future<void> _generate() async {
    final text = _input.text.trim();
    if (text.isEmpty || _loading) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
      _plans = [];
      _questions = [];
    });

    try {
      final api = ref.read(apiServiceProvider);
      if (_mode == 0) {
        final res = await api.post(
          '/api/v1/planner/study-roadmap',
          data: {'subject': text, 'weeks': _weeks, 'level': _level},
          timeout: const Duration(seconds: 120),
        );
        final data = _unwrap(res.data);
        final plan = (data['plan'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        setState(() => _plans = plan);
      } else {
        final res = await api.post(
          '/api/v1/planner/exam-questions',
          data: {'topic': text, 'count': _questionCount, 'difficulty': _difficulty},
          timeout: const Duration(seconds: 120),
        );
        final data = _unwrap(res.data);
        final qs = (data['questions'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        setState(() => _questions = qs);
      }
    } on DioException catch (e) {
      setState(() => _error = _errorText(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic> _unwrap(dynamic body) {
    if (body is Map && body['data'] is Map) {
      return Map<String, dynamic>.from(body['data'] as Map);
    }
    return body is Map ? Map<String, dynamic>.from(body) : {};
  }

  String _errorText(DioException e) {
    final status = e.response?.statusCode;
    if (status == 401 || status == 403) return 'Your session expired. Please sign in again.';
    final data = e.response?.data;
    if (data is Map && data['message'] != null) return data['message'].toString();
    return 'Could not generate right now. Please try again.';
  }

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isEmpty = _plans.isEmpty && _questions.isEmpty;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Study Planner'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          _controls(isDark),
          Expanded(
            child: _loading
                ? _loadingState(isDark)
                : _error != null
                    ? _errorState()
                    : isEmpty
                        ? _emptyState()
                        : _results(isDark),
          ),
        ],
      ),
    );
  }

  Widget _controls(bool isDark) {
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    return Container(
      color: surface,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                _segment('Roadmap', LucideIcons.map, 0),
                _segment('Practice Exam', LucideIcons.fileQuestion, 1),
              ],
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _input,
            onSubmitted: (_) => _generate(),
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: _mode == 0 ? 'e.g. Data Structures final exam' : 'e.g. Linear Algebra',
              prefixIcon: const Icon(LucideIcons.search, size: 18),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: AppColors.hairline(isDark: Theme.of(context).brightness == Brightness.dark)),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
          const SizedBox(height: 12),
          if (_mode == 0)
            Row(
              children: [
                _chip('$_weeks weeks', true, () => _cycleWeeks()),
                const SizedBox(width: 8),
                _chip(_level, true, _cycleLevel),
              ],
            )
          else
            Row(
              children: [
                _chip('$_questionCount questions', true, _cycleCount),
                const SizedBox(width: 8),
                _chip(_difficulty, true, _cycleDifficulty),
              ],
            ),
          const SizedBox(height: 12),
          CampusButton(
            label: _mode == 0 ? 'Generate Roadmap' : 'Generate Questions',
            icon: LucideIcons.sparkles,
            isLoading: _loading,
            onPressed: _generate,
          ),
        ],
      ),
    );
  }

  Widget _segment(String label, IconData icon, int value) {
    final selected = _mode == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _mode = value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AppColors.primaryAccent : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: selected ? Colors.white : (Theme.of(context).brightness == Brightness.dark ? AppColors.textSecondaryDark : AppColors.textSecondary)),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: selected ? Colors.white : (Theme.of(context).brightness == Brightness.dark ? AppColors.textSecondaryDark : AppColors.textSecondary),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _chip(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.primaryAccent.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.primaryAccent,
          ),
        ),
      ),
    );
  }

  void _cycleWeeks() => setState(() => _weeks = _weeks >= 12 ? 2 : _weeks + 2);
  void _cycleLevel() {
    const levels = ['beginner', 'intermediate', 'advanced'];
    setState(() => _level = levels[(levels.indexOf(_level) + 1) % levels.length]);
  }

  void _cycleCount() => setState(() => _questionCount = _questionCount >= 10 ? 3 : _questionCount + 1);
  void _cycleDifficulty() {
    const diffs = ['easy', 'medium', 'hard'];
    setState(() => _difficulty = diffs[(diffs.indexOf(_difficulty) + 1) % diffs.length]);
  }

  Widget _loadingState(bool isDark) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: List.generate(
        4,
        (_) => Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LoadingShimmer(width: 120, height: 18),
              SizedBox(height: 12),
              LoadingShimmer(),
              SizedBox(height: 8),
              LoadingShimmer(width: 200),
              SizedBox(height: 8),
              LoadingShimmer(width: 160),
            ],
          ),
        ),
      ),
    );
  }

  Widget _errorState() {
    return EmptyState(
      icon: LucideIcons.alertTriangle,
      title: 'Something went wrong',
      message: _error,
      actionLabel: 'Try again',
      onAction: _generate,
    );
  }

  Widget _emptyState() {
    return EmptyState(
      icon: _mode == 0 ? LucideIcons.map : LucideIcons.fileQuestion,
      title: _mode == 0 ? 'Plan your study' : 'Practice makes perfect',
      message: _mode == 0
          ? 'Enter a subject and we will build a week-by-week roadmap you can follow.'
          : 'Enter a topic to generate exam-style questions with model answers.',
    );
  }

  Widget _results(bool isDark) {
    if (_mode == 0) {
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _plans.length,
        itemBuilder: (context, i) => _weekCard(_plans[i], isDark, i),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _questions.length,
      itemBuilder: (context, i) => _questionCard(_questions[i], isDark, i),
    );
  }

  Widget _weekCard(Map<String, dynamic> plan, bool isDark, int index) {
    final tasks = (plan['tasks'] as List?)?.map((t) => t.toString()).toList() ?? [];
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  gradient: AppColors.heroGradient,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  plan['week']?.toString() ?? 'Week ${index + 1}',
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  plan['focus']?.toString() ?? '',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...tasks.map((t) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Icon(LucideIcons.checkCircle, size: 14, color: AppColors.tertiaryAccent),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(t, style: Theme.of(context).textTheme.bodyMedium),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _questionCard(Map<String, dynamic> q, bool isDark, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
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
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Q${index + 1}.',
                  style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primaryAccent)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  q['question']?.toString() ?? '',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
              InkWell(
                onTap: () async {
                  await Clipboard.setData(ClipboardData(
                    text: '${q['question']}\n\nAnswer: ${q['answer']}',
                  ));
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Copied'), duration: Duration(seconds: 1)),
                  );
                },
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Icon(LucideIcons.copy,
                      size: 14,
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.tertiaryAccent.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Model answer',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.accentText(
                        AppColors.tertiaryAccent,
                        isDark: Theme.of(context).brightness == Brightness.dark,
                      ),
                    )),
                const SizedBox(height: 4),
                Text(q['answer']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
