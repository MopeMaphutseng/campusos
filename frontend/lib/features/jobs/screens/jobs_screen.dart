import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/jobs/providers/jobs_provider.dart';

class JobsScreen extends ConsumerStatefulWidget {
  const JobsScreen({super.key});

  @override
  ConsumerState<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends ConsumerState<JobsScreen> {
  String _searchQuery = '';
  String _selectedFilter = 'All';

  final _filters = ['All', 'Remote', 'Full-time', 'Part-time', 'Internship', 'Graduate'];
  int _selectedTab = 0;

  List<JobListing> _filterJobs(List<JobListing> jobs) {
    var list = jobs;
    if (_selectedFilter != 'All') {
      list = list.where((j) => j.type == _selectedFilter).toList();
    }
    if (_searchQuery.isNotEmpty) {
      list = list.where((j) =>
          j.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          j.company.toLowerCase().contains(_searchQuery.toLowerCase())).toList();
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final jobsAsync = ref.watch(jobsProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      onChanged: (v) => setState(() => _searchQuery = v),
                      decoration: const InputDecoration(
                        hintText: 'Search jobs & internships...',
                        prefixIcon: Icon(LucideIcons.search, size: 18),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Container(
              height: 40,
              margin: const EdgeInsets.symmetric(horizontal: 16),
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                itemCount: _filters.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  return CampusChip(
                    label: _filters[index],
                    isSelected: _selectedFilter == _filters[index],
                    onTap: () => setState(() => _selectedFilter = _filters[index]),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08),
                ),
              ),
              child: Row(
                children: [
                  _tabButton('Listings', 0),
                  _tabButton('Tracker', 1),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: _selectedTab == 0 ? _buildListingsTab(jobsAsync, isDark) : _buildTrackerTab(isDark),
            ),
          ],
        ),
      ),
      floatingActionButton: Container(
        decoration: BoxDecoration(
          gradient: AppColors.heroGradient,
          borderRadius: BorderRadius.circular(16),
        ),
        child: FloatingActionButton.extended(
          onPressed: () {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              builder: (ctx) => Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Center(
                    child: Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12, bottom: 8),
                      decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
                  ),
                  const SizedBox(height: 8),
                  const Icon(LucideIcons.fileText, size: 48, color: AppColors.primaryAccent),
                  const SizedBox(height: 16),
                  Text('Upload your CV', style: Theme.of(ctx).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text('PDF or DOCX, max 5MB', style: Theme.of(ctx).textTheme.bodySmall),
                  const SizedBox(height: 24),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: SizedBox(
                      width: double.infinity,
                      child: CampusButton(
                        label: 'Analyze CV',
                        icon: LucideIcons.sparkles,
                        onPressed: () {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('AI CV analysis in progress')),
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
          backgroundColor: Colors.transparent,
          elevation: 0,
          icon: const Icon(LucideIcons.sparkles, color: Colors.white, size: 20),
          label: const Text('AI CV Review', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        ),
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

  Widget _buildListingsTab(AsyncValue<List<JobListing>> jobsAsync, bool isDark) {
    return jobsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, st) => EmptyState(
        icon: LucideIcons.alertCircle,
        title: 'Something went wrong',
        message: 'Pull to refresh and try again',
        actionLabel: 'Retry',
        onAction: () => ref.invalidate(jobsProvider),
      ),
      data: (jobs) {
        final filtered = _filterJobs(jobs);
        if (filtered.isEmpty) {
          return EmptyState(
            icon: LucideIcons.briefcase,
            title: 'No jobs found',
            message: 'Try adjusting your filters or search.',
          );
        }
        return ListView.builder(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 100),
          itemCount: filtered.length,
          itemBuilder: (context, index) => _JobCard(
            job: filtered[index],
            isDark: isDark,
            onSave: () {},
          ),
        );
      },
    );
  }

  Widget _buildTrackerTab(bool isDark) {
    final applications = [
      _ApplicationData('Vodacom Lesotho', 'Software Eng. Intern', 'Interview', AppColors.warning),
      _ApplicationData('Standard Bank', 'Junior Developer', 'Applied', AppColors.info),
      _ApplicationData('UNDP Lesotho', 'Digital Intern', 'Rejected', AppColors.error),
    ];

    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        SectionHeader(title: 'Your Applications', actionText: '${applications.length} total'),
        ...applications.map((app) => CampusCard(
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: app.statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(LucideIcons.briefcase, color: app.statusColor, size: 20),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(app.company, style: Theme.of(context).textTheme.titleSmall),
                        Text(app.position, style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                  StatusBadge(text: app.status, color: app.statusColor, isSmall: true),
                ],
              ),
            )),
      ],
    );
  }
}

Color _colorForJobType(String type) {
  switch (type) {
    case 'Internship':
      return AppColors.error;
    case 'Full-time':
      return AppColors.primaryAccent;
    case 'Remote':
      return AppColors.info;
    case 'Part-time':
      return AppColors.tertiaryAccent;
    case 'Graduate':
      return AppColors.secondaryAccent;
    default:
      return AppColors.primaryAccent;
  }
}

class _JobCard extends StatelessWidget {
  final JobListing job;
  final bool isDark;
  final VoidCallback onSave;

  const _JobCard({required this.job, required this.isDark, required this.onSave});

  @override
  Widget build(BuildContext context) {
    final accentColor = _colorForJobType(job.type);
    final companyInitials = job.company.length >= 2
        ? job.company.substring(0, 2).toUpperCase()
        : job.company.toUpperCase();
    final posted = _timeAgo(job.deadline);
    final salaryStr = job.salaryMax > 0
        ? '${job.currency} ${job.salaryMax.toStringAsFixed(0)}'
        : 'Negotiable';

    return CampusCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: Text(
                  companyInitials,
                  style: TextStyle(color: accentColor, fontWeight: FontWeight.w800, fontSize: 14),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(job.company, style: Theme.of(context).textTheme.titleSmall),
                        ),
                        if (job.isRemote)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.error.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text('HOT', style: TextStyle(color: AppColors.error, fontSize: 9, fontWeight: FontWeight.w800)),
                          ),
                      ],
                    ),
                    Text(job.title, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              _infoChip(LucideIcons.mapPin, job.location),
              _infoChip(LucideIcons.clock, job.type),
              _infoChip(LucideIcons.banknote, salaryStr),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Text(posted, style: Theme.of(context).textTheme.bodySmall),
              const Spacer(),
              CampusIconButton(
                icon: LucideIcons.bookmark,
                onPressed: onSave,
                size: 34,
              ),
              const SizedBox(width: 8),
              SizedBox(
                height: 34,
                child: ElevatedButton(
                  onPressed: () {
                    final nameCtrl = TextEditingController();
                    final emailCtrl = TextEditingController();
                    final msgCtrl = TextEditingController();
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
                            Text('Apply for ${job.title}', style: Theme.of(ctx).textTheme.titleMedium),
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
                              controller: msgCtrl,
                              maxLines: 3,
                              decoration: const InputDecoration(
                                hintText: 'Cover letter / message (optional)',
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
                                    const SnackBar(content: Text('Application submitted successfully')),
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
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  child: const Text('Apply', style: TextStyle(fontSize: 12)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _infoChip(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      ],
    );
  }
}

String _timeAgo(DateTime date) {
  final diff = DateTime.now().difference(date);
  if (diff.inDays > 6) return '${(diff.inDays / 7).floor()}w ago';
  if (diff.inDays > 0) return '${diff.inDays}d ago';
  if (diff.inHours > 0) return '${diff.inHours}h ago';
  return 'Just now';
}

class _ApplicationData {
  final String company;
  final String position;
  final String status;
  final Color statusColor;

  const _ApplicationData(this.company, this.position, this.status, this.statusColor);
}
