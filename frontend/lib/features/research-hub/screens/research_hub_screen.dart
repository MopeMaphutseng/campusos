import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class ResearchHubScreen extends ConsumerStatefulWidget {
  const ResearchHubScreen({super.key});

  @override
  ConsumerState<ResearchHubScreen> createState() => _ResearchHubScreenState();
}

class _ResearchHubScreenState extends ConsumerState<ResearchHubScreen> {
  int _selectedTab = 0;

  final _openCalls = const [
    _ResearchCallData(
      title: 'Machine Learning for Crop Yield Prediction',
      supervisor: 'Dr. Mokete Ranthimo',
      supervisorInitials: 'MR',
      department: 'Computer Science',
      deadline: '2026-09-01',
      slots: 2,
      accentColor: AppColors.primaryAccent,
      icon: LucideIcons.brain,
    ),
    _ResearchCallData(
      title: 'Water Quality Monitoring IoT System',
      supervisor: 'Prof. Thabo Molefe',
      supervisorInitials: 'TM',
      department: 'Engineering',
      deadline: '2026-08-30',
      slots: 3,
      accentColor: AppColors.tertiaryAccent,
      icon: LucideIcons.droplets,
    ),
    _ResearchCallData(
      title: 'Low-Resource NLP for Sesotho',
      supervisor: 'Dr. Nthabiseng Tau',
      supervisorInitials: 'NT',
      department: 'Computer Science',
      deadline: '2026-10-15',
      slots: 1,
      accentColor: AppColors.info,
      icon: LucideIcons.languages,
    ),
    _ResearchCallData(
      title: 'Renewable Energy for Rural Lesotho',
      supervisor: 'Prof. Liteboho Makoa',
      supervisorInitials: 'LM',
      department: 'Physics',
      deadline: '2026-09-20',
      slots: 4,
      accentColor: AppColors.secondaryAccent,
      icon: LucideIcons.sun,
    ),
  ];

  final _collaborations = const [
    _CollaborationData(
      title: 'Cross-Border Research: AI in Agriculture',
      institutions: ['UL', 'UCT', 'Wits'],
      lead: 'UL',
      description: 'Multi-institution project on AI-driven agricultural solutions for Southern Africa.',
    ),
    _CollaborationData(
      title: 'Digital Health Records Standardization',
      institutions: ['NUL', 'Stellenbosch', 'MU'],
      lead: 'NUL',
      description: 'Standardizing digital health records across SADC region universities.',
    ),
  ];

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
              title: Text('Research Hub', style: Theme.of(context).textTheme.headlineSmall),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: CampusCard(
                  gradient: AppColors.heroGradient,
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(LucideIcons.sparkles, color: Colors.white.withValues(alpha: 0.9), size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  'AI Research Assistant',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w700,
                                      ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Literature review, methodology suggestions, and writing support.',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.85),
                                  ),
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () {
                                final queryCtrl = TextEditingController();
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
                                        Text('AI Research Assistant', style: Theme.of(ctx).textTheme.titleMedium),
                                        const SizedBox(height: 16),
                                        TextField(
                                          controller: queryCtrl,
                                          maxLines: 4,
                                          decoration: const InputDecoration(
                                            hintText: 'Describe your research topic or question...',
                                            alignLabelWithHint: true,
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        SizedBox(
                                          width: double.infinity,
                                          child: CampusButton(
                                            label: 'Launch Assistant',
                                            icon: LucideIcons.sparkles,
                                            onPressed: () {
                                              Navigator.pop(ctx);
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                const SnackBar(content: Text('Research assistant launched')),
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
                                backgroundColor: Colors.white,
                                foregroundColor: AppColors.primary,
                              ),
                              child: const Text('Launch Assistant'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08),
                  ),
                ),
                child: Row(
                  children: [
                    _tabButton('Open Calls', 0),
                    _tabButton('Collaborate', 1),
                  ],
                ),
              ),
            ),
            if (_selectedTab == 0) ...[
              SliverToBoxAdapter(
                child: SectionHeader(title: 'Research Assistant Openings', actionText: '${_openCalls.length} open'),
              ),
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _ResearchCallCard(call: _openCalls[index], isDark: isDark),
                  childCount: _openCalls.length,
                ),
              ),
            ] else ...[
              SliverToBoxAdapter(
                child: SectionHeader(title: 'Cross-Institution Board', actionText: 'Post Opportunity'),
              ),
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _CollaborationCard(collab: _collaborations[index], isDark: isDark),
                  childCount: _collaborations.length,
                ),
              ),
            ],
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
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
}

class _ResearchCallCard extends StatelessWidget {
  final _ResearchCallData call;
  final bool isDark;

  const _ResearchCallCard({required this.call, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final deadlineDate = DateTime.parse(call.deadline);
    final daysLeft = deadlineDate.difference(DateTime.now()).inDays;

    return CampusCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: call.accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(call.icon, color: call.accentColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(call.title, style: Theme.of(context).textTheme.titleSmall),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              UserAvatar(initials: call.supervisorInitials, size: 28),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(call.supervisor, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
                    Text(call.department, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(LucideIcons.calendar, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text(
                daysLeft > 0 ? '$daysLeft days left' : 'Closed',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: daysLeft <= 7 ? AppColors.error : AppColors.textSecondary,
                    ),
              ),
              const SizedBox(width: 16),
              Icon(LucideIcons.users, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text('${call.slots} slots', style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                final statementCtrl = TextEditingController();
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
                        Text('Apply as Research Assistant', style: Theme.of(ctx).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Text('${call.title} — ${call.supervisor}', style: Theme.of(ctx).textTheme.bodySmall),
                        const SizedBox(height: 16),
                        TextField(
                          controller: statementCtrl,
                          maxLines: 4,
                          decoration: const InputDecoration(
                            hintText: 'Why are you interested in this position?',
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
                                const SnackBar(content: Text('Research assistant application submitted')),
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
              child: const Text('Apply as Research Assistant'),
            ),
          ),
        ],
      ),
    );
  }
}

class _CollaborationCard extends StatelessWidget {
  final _CollaborationData collab;
  final bool isDark;

  const _CollaborationCard({required this.collab, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return CampusCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(collab.title, style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 6),
          Text(collab.description, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: collab.institutions.map((inst) {
              final isLead = inst == collab.lead;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isLead
                      ? AppColors.primaryAccent.withValues(alpha: 0.15)
                      : Colors.grey.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  inst,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isLead ? AppColors.primaryAccent : AppColors.textSecondary,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text('Lead: ${collab.lead}', style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
              const Spacer(),
              OutlinedButton(
                onPressed: () {
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
                              decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2))),
                          ),
                          const SizedBox(height: 16),
                          Text('Join Collaboration', style: Theme.of(ctx).textTheme.titleMedium),
                          const SizedBox(height: 8),
                          Text(collab.title, style: Theme.of(ctx).textTheme.bodySmall),
                          const SizedBox(height: 16),
                          TextField(
                            controller: msgCtrl,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              hintText: 'Brief introduction / reason for joining...',
                              alignLabelWithHint: true,
                            ),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: CampusButton(
                              label: 'Send Request',
                              onPressed: () {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Collaboration request sent')),
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
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                ),
                child: const Text('Join', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ResearchCallData {
  final String title;
  final String supervisor;
  final String supervisorInitials;
  final String department;
  final String deadline;
  final int slots;
  final Color accentColor;
  final IconData icon;

  const _ResearchCallData({
    required this.title,
    required this.supervisor,
    required this.supervisorInitials,
    required this.department,
    required this.deadline,
    required this.slots,
    required this.accentColor,
    required this.icon,
  });
}

class _CollaborationData {
  final String title;
  final List<String> institutions;
  final String lead;
  final String description;

  const _CollaborationData({
    required this.title,
    required this.institutions,
    required this.lead,
    required this.description,
  });
}
