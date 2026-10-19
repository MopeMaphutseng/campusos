import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/services/api_service.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class BusinessAssistantScreen extends ConsumerStatefulWidget {
  const BusinessAssistantScreen({super.key});

  @override
  ConsumerState<BusinessAssistantScreen> createState() => _BusinessAssistantScreenState();
}

class _BusinessAssistantScreenState extends ConsumerState<BusinessAssistantScreen> {
  int _mode = 0; // 0 = business plan, 1 = pitch deck
  final _idea = TextEditingController();
  final _industry = TextEditingController();
  final _market = TextEditingController();

  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _sections = [];
  List<Map<String, dynamic>> _slides = [];

  Future<void> _generate() async {
    final idea = _idea.text.trim();
    if (idea.isEmpty || _loading) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
      _sections = [];
      _slides = [];
    });

    try {
      final api = ref.read(apiServiceProvider);
      if (_mode == 0) {
        final res = await api.post(
          '/api/v1/planner/business-plan',
          data: {
            'idea': idea,
            if (_industry.text.trim().isNotEmpty) 'industry': _industry.text.trim(),
            if (_market.text.trim().isNotEmpty) 'targetMarket': _market.text.trim(),
          },
          timeout: const Duration(seconds: 150),
        );
        final data = _unwrap(res.data);
        final sections = (data['sections'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        setState(() => _sections = sections);
      } else {
        final res = await api.post(
          '/api/v1/planner/pitch-deck',
          data: {'business': idea, if (_market.text.trim().isNotEmpty) 'audience': _market.text.trim()},
          timeout: const Duration(seconds: 150),
        );
        final data = _unwrap(res.data);
        final slides = (data['slides'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        setState(() => _slides = slides);
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
    _idea.dispose();
    _industry.dispose();
    _market.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isEmpty = _sections.isEmpty && _slides.isEmpty;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Business Assistant'),
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
                    ? EmptyState(
                        icon: LucideIcons.alertTriangle,
                        title: 'Something went wrong',
                        message: _error,
                        actionLabel: 'Try again',
                        onAction: _generate,
                      )
                    : isEmpty
                        ? EmptyState(
                            icon: _mode == 0 ? LucideIcons.briefcase : LucideIcons.presentation,
                            title: _mode == 0 ? 'Draft a business plan' : 'Build a pitch deck',
                            message: _mode == 0
                                ? 'Describe your idea and get a structured plan with market, revenue and milestones.'
                                : 'Describe your business to generate a 10-slide investor pitch outline.',
                          )
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
                _segment('Business Plan', LucideIcons.briefcase, 0),
                _segment('Pitch Deck', LucideIcons.presentation, 1),
              ],
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _idea,
            textInputAction: TextInputAction.next,
            decoration: InputDecoration(
              hintText: _mode == 0 ? 'Describe your business idea' : 'What is the business?',
              prefixIcon: const Icon(LucideIcons.lightbulb, size: 18),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
          const SizedBox(height: 8),
          if (_mode == 0)
            Row(
              children: [
                Expanded(child: _smallField(_industry, 'Industry (optional)')),
                const SizedBox(width: 8),
                Expanded(child: _smallField(_market, 'Target market (optional)')),
              ],
            )
          else
            _smallField(_market, 'Audience (e.g. investors, judges)'),
          const SizedBox(height: 12),
          CampusButton(
            label: _mode == 0 ? 'Draft Plan' : 'Generate Deck',
            icon: LucideIcons.sparkles,
            isLoading: _loading,
            onPressed: _generate,
          ),
        ],
      ),
    );
  }

  Widget _smallField(TextEditingController c, String hint) {
    return TextField(
      controller: c,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(fontSize: 12),
        isDense: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
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
            color: selected ? AppColors.secondaryAccent : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: selected ? Colors.white : AppColors.textSecondary),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: selected ? Colors.white : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              LoadingShimmer(width: 140, height: 18),
              SizedBox(height: 12),
              LoadingShimmer(),
              SizedBox(height: 8),
              LoadingShimmer(width: 220),
            ],
          ),
        ),
      ),
    );
  }

  Widget _results(bool isDark) {
    if (_mode == 0) {
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _sections.length,
        itemBuilder: (context, i) => _sectionCard(_sections[i], isDark),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _slides.length,
      itemBuilder: (context, i) => _slideCard(_slides[i], isDark, i),
    );
  }

  Widget _sectionCard(Map<String, dynamic> section, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            section['title']?.toString() ?? '',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.secondaryAccent,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            section['body']?.toString() ?? '',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _slideCard(Map<String, dynamic> slide, bool isDark, int index) {
    final bullets = (slide['bullets'] as List?)?.map((b) => b.toString()).toList() ?? [];
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 26,
                height: 26,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.secondaryAccent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('${index + 1}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.secondaryAccent)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  slide['title']?.toString() ?? '',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              InkWell(
                onTap: () async {
                  final txt = '${slide['title']}\n${bullets.map((b) => '• $b').join('\n')}';
                  await Clipboard.setData(ClipboardData(text: txt));
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Copied'), duration: Duration(seconds: 1)),
                  );
                },
                child: const Padding(
                  padding: EdgeInsets.all(4),
                  child: Icon(LucideIcons.copy, size: 14, color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...bullets.map((b) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 6),
                      child: Icon(LucideIcons.dot, size: 12, color: AppColors.secondaryAccent),
                    ),
                    const SizedBox(width: 4),
                    Expanded(child: Text(b, style: Theme.of(context).textTheme.bodyMedium)),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}
