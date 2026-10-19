import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/scholarships/providers/scholarships_provider.dart';

class ScholarshipsScreen extends ConsumerStatefulWidget {
  const ScholarshipsScreen({super.key});

  @override
  ConsumerState<ScholarshipsScreen> createState() => _ScholarshipsScreenState();
}

class _ScholarshipsScreenState extends ConsumerState<ScholarshipsScreen> {
  String _selectedCountry = 'All';
  String _selectedDegree = 'All';
  String _selectedFaculty = 'All';

  final _countries = ['All', 'Lesotho', 'South Africa', 'USA', 'UK', 'Germany'];
  final _degrees = ['All', 'Undergraduate', 'Masters', 'PhD'];
  final _faculties = ['All', 'Science', 'Engineering', 'Business', 'Arts'];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final scholarshipsAsync = ref.watch(scholarshipsProvider);

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('Scholarships', style: Theme.of(context).textTheme.headlineSmall),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: CampusCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(LucideIcons.sparkles, size: 18, color: AppColors.secondaryAccent),
                          const SizedBox(width: 8),
                          Text('AI Match', style: Theme.of(context).textTheme.titleSmall),
                          const Spacer(),
                          StatusBadge.success('3 new matches'),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'We found 3 scholarships that match your profile with high probability.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _filterDropdown('Country', _selectedCountry, _countries, (v) => setState(() => _selectedCountry = v)),
                    const SizedBox(height: 8),
                    _filterDropdown('Degree', _selectedDegree, _degrees, (v) => setState(() => _selectedDegree = v)),
                    const SizedBox(height: 8),
                    _filterDropdown('Faculty', _selectedFaculty, _faculties, (v) => setState(() => _selectedFaculty = v)),
                  ],
                ),
              ),
            ),
            scholarshipsAsync.when(
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, st) => SliverFillRemaining(
                child: EmptyState(
                  icon: LucideIcons.alertCircle,
                  title: 'Something went wrong',
                  message: 'Pull to refresh and try again',
                  actionLabel: 'Retry',
                  onAction: () => ref.invalidate(scholarshipsProvider),
                ),
              ),
              data: (scholarships) {
                final filtered = scholarships.where((s) {
                  if (_selectedCountry != 'All' && s.country != _selectedCountry) return false;
                  if (_selectedDegree != 'All' && s.degreeLevel != _selectedDegree) return false;
                  if (_selectedFaculty != 'All' && s.faculty != _selectedFaculty && s.faculty != 'All') return false;
                  return true;
                }).toList();
                if (filtered.isEmpty) {
                  return SliverFillRemaining(
                    child: EmptyState(
                      icon: LucideIcons.award,
                      title: 'No scholarships found',
                      message: 'Try adjusting your filters.',
                    ),
                  );
                }
                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _ScholarshipCard(scholarship: filtered[index], isDark: isDark),
                    childCount: filtered.length,
                  ),
                );
              },
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SectionHeader(title: 'Application Checklist'),
                    CampusCard(
                      child: Column(
                        children: [
                          _checklistItem(context, 'Update CV/Resume', true),
                          _checklistItem(context, 'Write personal statement', false),
                          _checklistItem(context, 'Get recommendation letters', false),
                          _checklistItem(context, 'Gather transcripts', true),
                          _checklistItem(context, 'Proofread all documents', false),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 80)),
          ],
        ),
      ),
    );
  }

  Widget _filterDropdown(String label, String value, List<String> options, ValueChanged<String> onChanged) {
    return Row(
      children: [
        SizedBox(
          width: 80,
          child: Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
        ),
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark ? AppColors.surfaceDark : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: Theme.of(context).brightness == Brightness.dark
                    ? Colors.white.withValues(alpha: 0.06)
                    : Colors.grey.withValues(alpha: 0.08),
              ),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: value,
                isExpanded: true,
                items: options.map((o) => DropdownMenuItem(value: o, child: Text(o, style: Theme.of(context).textTheme.bodyMedium))).toList(),
                onChanged: (v) => onChanged(v!),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _checklistItem(BuildContext context, String label, bool isChecked) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(
            isChecked ? LucideIcons.checkCircle2 : LucideIcons.circle,
            size: 20,
            color: isChecked ? AppColors.success : AppColors.textSecondary,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: isChecked ? AppColors.textSecondary : null,
                    decoration: isChecked ? TextDecoration.lineThrough : null,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

Color _colorForCountry(String country) {
  switch (country) {
    case 'Lesotho':
      return AppColors.primaryAccent;
    case 'South Africa':
      return AppColors.tertiaryAccent;
    case 'USA':
      return AppColors.secondaryAccent;
    case 'UK':
      return AppColors.info;
    case 'Germany':
      return AppColors.error;
    default:
      return AppColors.primaryAccent;
  }
}

class _ScholarshipCard extends StatelessWidget {
  final ScholarshipItem scholarship;
  final bool isDark;

  const _ScholarshipCard({required this.scholarship, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final daysLeft = scholarship.deadline.difference(DateTime.now()).inDays;
    final color = _colorForCountry(scholarship.country);
    final matchPercent = scholarship.fundingPercentage.toInt();
    final amountStr = scholarship.amount > 0
        ? '${scholarship.currency} ${scholarship.amount.toStringAsFixed(0)}'
        : scholarship.title;

    return CampusCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(LucideIcons.award, color: color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(scholarship.title, style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 4),
                    Text(amountStr, style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: color,
                          fontWeight: FontWeight.w600,
                        )),
                  ],
                ),
              ),
              _matchBadge(matchPercent),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(LucideIcons.calendar, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text(
                daysLeft > 0 ? '$daysLeft days left' : 'Deadline passed',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: daysLeft <= 14 ? AppColors.error : AppColors.textSecondary,
                    ),
              ),
              const SizedBox(width: 16),
              StatusBadge(
                text: scholarship.country,
                color: AppColors.info,
                isSmall: true,
              ),
              const SizedBox(width: 6),
              StatusBadge(
                text: scholarship.degreeLevel,
                color: AppColors.tertiaryAccent,
                isSmall: true,
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                final nameCtrl = TextEditingController();
                final emailCtrl = TextEditingController();
                final essayCtrl = TextEditingController();
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
                            decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
                        ),
                        const SizedBox(height: 16),
                        Text('Apply for Scholarship', style: Theme.of(ctx).textTheme.titleMedium),
                        const SizedBox(height: 16),
                        TextField(
                          controller: nameCtrl,
                          decoration: const InputDecoration(
                            hintText: 'Full Name',
                            prefixIcon: Icon(LucideIcons.user, size: 18),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: emailCtrl,
                          decoration: const InputDecoration(
                            hintText: 'Email',
                            prefixIcon: Icon(LucideIcons.mail, size: 18),
                          ),
                          keyboardType: TextInputType.emailAddress,
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: essayCtrl,
                          maxLines: 4,
                          decoration: const InputDecoration(
                            hintText: 'Personal statement / essay',
                            alignLabelWithHint: true,
                          ),
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: CampusButton(
                            label: 'Submit Application',
                            onPressed: () {
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Scholarship application submitted')),
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
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 10)),
              child: const Text('View & Apply'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _matchBadge(int percent) {
    final color = percent >= 80
        ? AppColors.success
        : percent >= 60
            ? AppColors.warning
            : AppColors.error;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '$percent%',
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w800,
          fontSize: 14,
        ),
      ),
    );
  }
}
