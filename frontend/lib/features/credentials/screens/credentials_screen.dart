import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/library/screens/library_screen.dart';

enum CredentialFilter { all, certificates, badges, courseCompletions }

class CredentialsScreen extends ConsumerStatefulWidget {
  const CredentialsScreen({super.key});

  @override
  ConsumerState<CredentialsScreen> createState() => _CredentialsScreenState();
}

class _CredentialsScreenState extends ConsumerState<CredentialsScreen> {
  CredentialFilter _filter = CredentialFilter.all;

  final _credentials = const [
    _CredentialData(
      title: 'B.Sc. Computer Science',
      issuer: 'National University of Lesotho',
      issuerInitials: 'NUL',
      issueDate: '15 Dec 2025',
      expiryDate: 'No Expiry',
      status: 'Active',
      type: CredentialFilter.certificates,
      color: AppColors.primaryAccent,
    ),
    _CredentialData(
      title: 'Data Structures & Algorithms',
      issuer: 'National University of Lesotho',
      issuerInitials: 'NUL',
      issueDate: '10 Jun 2026',
      expiryDate: 'No Expiry',
      status: 'Active',
      type: CredentialFilter.courseCompletions,
      color: AppColors.tertiaryAccent,
    ),
    _CredentialData(
      title: 'Dean\'s List - Semester 1',
      issuer: 'Faculty of Science',
      issuerInitials: 'FS',
      issueDate: '01 Jul 2026',
      expiryDate: '31 Dec 2026',
      status: 'Active',
      type: CredentialFilter.badges,
      color: AppColors.secondaryAccent,
    ),
    _CredentialData(
      title: 'Python Programming',
      issuer: 'Coursera / NUL Partnership',
      issuerInitials: 'C+',
      issueDate: '15 Mar 2026',
      expiryDate: '15 Mar 2029',
      status: 'Active',
      type: CredentialFilter.certificates,
      color: AppColors.info,
    ),
    _CredentialData(
      title: 'Web Development Bootcamp',
      issuer: 'CampusOS Innovation Hub',
      issuerInitials: 'IH',
      issueDate: '20 Jan 2026',
      expiryDate: 'No Expiry',
      status: 'Expired',
      type: CredentialFilter.badges,
      color: AppColors.textSecondary,
    ),
  ];

  List<_CredentialData> get _filtered {
    if (_filter == CredentialFilter.all) return _credentials;
    return _credentials.where((c) => c.type == _filter).toList();
  }

  int get _totalEarned => _credentials.where((c) => c.status == 'Active').length;

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
              title: Text('Credentials', style: Theme.of(context).textTheme.headlineSmall),
              actions: [
                CampusIconButton(
                  icon: LucideIcons.scanLine,
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      builder: (ctx) => Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Center(
                            child: Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12, bottom: 8),
                              decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
                          ),
                          const SizedBox(height: 16),
                          const Icon(LucideIcons.scanLine, size: 64, color: AppColors.primaryAccent),
                          const SizedBox(height: 16),
                          Text('Scan to Verify', style: Theme.of(ctx).textTheme.titleMedium),
                          const SizedBox(height: 8),
                          Text('Scan the QR code on a credential\nto verify its authenticity.',
                            textAlign: TextAlign.center,
                            style: Theme.of(ctx).textTheme.bodySmall),
                          const SizedBox(height: 24),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: SizedBox(
                              width: double.infinity,
                              child: CampusButton(
                                label: 'Open Scanner',
                                icon: LucideIcons.camera,
                                onPressed: () {
                                  Navigator.pop(ctx);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Verification scanner opened')),
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
                  tooltip: 'Verify Credential',
                ),
                const SizedBox(width: 12),
              ],
            ),
            SliverToBoxAdapter(child: _buildHeroSection(context)),
            SliverToBoxAdapter(child: _buildHowItWorksCard(context, isDark)),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  children: CredentialFilter.values.map((f) {
                    final labels = {
                      CredentialFilter.all: 'All',
                      CredentialFilter.certificates: 'Certificates',
                      CredentialFilter.badges: 'Badges',
                      CredentialFilter.courseCompletions: 'Course Completions',
                    };
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: CampusChip(
                        label: labels[f]!,
                        isSelected: _filter == f,
                        onTap: () => setState(() => _filter = f),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            if (_filtered.isEmpty)
              SliverFillRemaining(
                child: EmptyState(
                  icon: LucideIcons.award,
                  title: 'No credentials yet',
                  message: 'Complete courses and achievements to earn verifiable credentials.',
                  actionLabel: 'Browse Courses',
                  onAction: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LibraryScreen()),
                    );
                  },
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _CredentialCard(
                    credential: _filtered[index],
                    isDark: isDark,
                  ),
                  childCount: _filtered.length,
                ),
              ),
            SliverToBoxAdapter(child: _buildTrustSection(context, isDark)),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroSection(BuildContext context) {
    return CampusCard(
      gradient: AppColors.successGradient,
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(LucideIcons.award, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$_totalEarned',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  'Credentials Earned',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.85),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${_credentials.length}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                'Total Issued',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.85),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHowItWorksCard(BuildContext context, bool isDark) {
    return CampusCard(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      isHighlighted: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.info, size: 18, color: AppColors.info),
              const SizedBox(width: 8),
              Text('How it works', style: Theme.of(context).textTheme.titleSmall),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Your credentials are W3C Verifiable Credentials — a tamper-proof, '
            'digitally signed standard recognized worldwide. Each credential is '
            'independently verifiable by any employer or institution.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _infoStep(context, '1', 'Earn'),
              Icon(LucideIcons.chevronRight, size: 14, color: AppColors.textSecondary),
              _infoStep(context, '2', 'Issue'),
              Icon(LucideIcons.chevronRight, size: 14, color: AppColors.textSecondary),
              _infoStep(context, '3', 'Share'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _infoStep(BuildContext context, String step, String label) {
    return Row(
      children: [
        Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: AppColors.primaryAccent.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              step,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.primaryAccent,
              ),
            ),
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildTrustSection(BuildContext context, bool isDark) {
    return CampusCard(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.tertiaryAccent.withValues(alpha: isDark ? 0.15 : 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(LucideIcons.shieldCheck, color: AppColors.tertiaryAccent, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Independently Verifiable',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 2),
                Text(
                  'Any employer can verify your credentials without contacting the university.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Icon(LucideIcons.checkCircle, color: AppColors.tertiaryAccent, size: 22),
        ],
      ),
    );
  }
}

class _CredentialCard extends StatelessWidget {
  final _CredentialData credential;
  final bool isDark;

  const _CredentialCard({required this.credential, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final isExpired = credential.status == 'Expired';

    return CampusCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: credential.color.withValues(alpha: isDark ? 0.15 : 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    credential.issuerInitials,
                    style: TextStyle(
                      color: credential.color,
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      credential.title,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      credential.issuer,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              StatusBadge(
                text: credential.status,
                color: isExpired ? AppColors.textSecondary : AppColors.success,
                isSmall: true,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(LucideIcons.calendar, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text(
                'Issued ${credential.issueDate}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(width: 12),
              Icon(LucideIcons.clock, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text(
                'Exp: ${credential.expiryDate}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: isExpired ? null : () {},
                  icon: const Icon(LucideIcons.share2, size: 16),
                  label: const Text('Share'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: isExpired ? null : () {},
                  icon: const Icon(LucideIcons.scanLine, size: 16),
                  label: const Text('Verify'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: isExpired ? null : () {},
                  icon: const Icon(LucideIcons.download, size: 16),
                  label: const Text('PDF'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CredentialData {
  final String title;
  final String issuer;
  final String issuerInitials;
  final String issueDate;
  final String expiryDate;
  final String status;
  final CredentialFilter type;
  final Color color;

  const _CredentialData({
    required this.title,
    required this.issuer,
    required this.issuerInitials,
    required this.issueDate,
    required this.expiryDate,
    required this.status,
    required this.type,
    required this.color,
  });
}
