import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class PaymentsScreen extends ConsumerWidget {
  const PaymentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('Payments & Fees', style: Theme.of(context).textTheme.headlineSmall),
              actions: [
                CampusIconButton(
                  icon: LucideIcons.download,
                  onPressed: () {
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
                            child: Text('Download Statement', style: Theme.of(ctx).textTheme.titleMedium),
                          ),
                          ListTile(
                            leading: const Icon(LucideIcons.fileText, color: AppColors.primaryAccent),
                            title: const Text('PDF Statement'),
                            subtitle: const Text('Full transaction history'),
                            trailing: const Icon(LucideIcons.download, size: 18),
                            onTap: () => Navigator.pop(ctx),
                          ),
                          ListTile(
                            leading: const Icon(LucideIcons.fileSpreadsheet, color: AppColors.tertiaryAccent),
                            title: const Text('CSV Export'),
                            subtitle: const Text('For spreadsheets'),
                            trailing: const Icon(LucideIcons.download, size: 18),
                            onTap: () => Navigator.pop(ctx),
                          ),
                          const SizedBox(height: 8),
                        ],
                      ),
                    );
                  },
                  tooltip: 'Download Statements',
                ),
                const SizedBox(width: 12),
              ],
            ),
            SliverToBoxAdapter(child: _buildBalanceHero(context)),
            SliverToBoxAdapter(child: _buildQuickPayButtons(context, isDark)),
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 20, 16, 4),
                child: SectionHeader(title: 'Upcoming Payments'),
              ),
            ),
            SliverToBoxAdapter(child: _buildUpcomingPayments(context, isDark)),
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 20, 16, 4),
                child: SectionHeader(title: 'Financial Aid'),
              ),
            ),
            SliverToBoxAdapter(child: _buildFinancialAid(context, isDark)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 4),
                child: SectionHeader(
                  title: 'Transaction History',
                  actionText: 'View All',
                  onAction: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      builder: (ctx) => DraggableScrollableSheet(
                        initialChildSize: 0.7,
                        minChildSize: 0.4,
                        maxChildSize: 0.9,
                        expand: false,
                        builder: (ctx, scrollCtrl) => Column(
                          children: [
                            Center(
                              child: Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12, bottom: 8),
                                decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2))),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Text('All Transactions', style: Theme.of(ctx).textTheme.titleMedium),
                            ),
                            Expanded(
                              child: ListView.builder(
                                controller: scrollCtrl,
                                itemCount: _transactions.length,
                                itemBuilder: (ctx, i) => ListTile(
                                  leading: Container(
                                    width: 40, height: 40,
                                    decoration: BoxDecoration(
                                      color: _transactions[i].statusColor.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(
                                      _transactions[i].amount.startsWith('-') ? LucideIcons.trendingDown : LucideIcons.trendingUp,
                                      color: _transactions[i].statusColor, size: 18,
                                    ),
                                  ),
                                  title: Text(_transactions[i].description, style: const TextStyle(fontSize: 13)),
                                  subtitle: Text(_transactions[i].date),
                                  trailing: Text(_transactions[i].amount, style: TextStyle(fontWeight: FontWeight.w600, color: _transactions[i].statusColor)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _TransactionTile(
                  transaction: _transactions[index],
                  isDark: isDark,
                ),
                childCount: _transactions.length,
              ),
            ),
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 20, 16, 4),
                child: SectionHeader(title: 'Payment Methods'),
              ),
            ),
            SliverToBoxAdapter(child: _buildPaymentMethods(context, isDark)),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  Widget _buildBalanceHero(BuildContext context) {
    return CampusCard(
      gradient: AppColors.heroGradient,
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Total Due',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.8),
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'M 12,450.00',
            style: Theme.of(context).textTheme.displayMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _balanceStat(context, 'Paid', 'M 3,550.00'),
              Container(
                width: 1,
                height: 32,
                color: Colors.white.withValues(alpha: 0.3),
                margin: const EdgeInsets.symmetric(horizontal: 16),
              ),
              _balanceStat(context, 'Remaining', 'M 12,450.00'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _balanceStat(BuildContext context, String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.white.withValues(alpha: 0.7),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontSize: 16,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickPayButtons(BuildContext context, bool isDark) {
    final amounts = ['M 500', 'M 1,000', 'M 2,500', 'M 5,000'];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: amounts.map((amount) {
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: OutlinedButton(
                onPressed: () {
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
                          child: Text('Confirm Payment', style: Theme.of(ctx).textTheme.titleMedium),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Amount'),
                                  Text(amount, style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.tertiaryAccent)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              const Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Payment Method'),
                                  Text('M-Pesa'),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: SizedBox(
                            width: double.infinity,
                            child: CampusButton(
                              label: 'Pay $amount',
                              onPressed: () {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Payment of $amount successful')),
                                );
                              },
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  );
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  side: BorderSide(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.12)
                        : Colors.grey.withValues(alpha: 0.2),
                  ),
                ),
                child: Text(amount, style: const TextStyle(fontSize: 12)),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildUpcomingPayments(BuildContext context, bool isDark) {
    return Column(
      children: _upcomingPayments.map((payment) {
        return CampusCard(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: payment.color.withValues(alpha: isDark ? 0.15 : 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(payment.icon, color: payment.color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(payment.title, style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 2),
                    Text(
                      'Due: ${payment.dueDate}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    payment.amount,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: payment.color,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 4),
                  StatusBadge(
                    text: payment.status,
                    color: payment.statusColor,
                    isSmall: true,
                  ),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildFinancialAid(BuildContext context, bool isDark) {
    return CampusCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Column(
        children: [
          _financialAidItem(
            context,
            icon: LucideIcons.award,
            color: AppColors.secondaryAccent,
            title: 'NLDF Merit Bursary',
            detail: 'M 25,000 awarded',
            trailing: StatusBadge.success('Disbursed'),
            isDark: isDark,
          ),
          const Divider(height: 1, indent: 60),
          _financialAidItem(
            context,
            icon: LucideIcons.sparkles,
            color: AppColors.tertiaryAccent,
            title: 'Maseru Tech Innovation Award',
            detail: 'M 50,000 awarded',
            trailing: StatusBadge.warning('Pending'),
            isDark: isDark,
          ),
          const Divider(height: 1, indent: 60),
          _financialAidItem(
            context,
            icon: LucideIcons.banknote,
            color: AppColors.primaryAccent,
            title: 'Campus Work-Study',
            detail: 'M 300/week',
            trailing: StatusBadge.info('Active'),
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _financialAidItem(
    BuildContext context, {
    required IconData icon,
    required Color color,
    required String title,
    required String detail,
    required Widget trailing,
    required bool isDark,
  }) {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: color.withValues(alpha: isDark ? 0.15 : 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(title, style: Theme.of(context).textTheme.bodyMedium),
      subtitle: Text(detail, style: Theme.of(context).textTheme.bodySmall),
      trailing: trailing,
    );
  }

  Widget _buildPaymentMethods(BuildContext context, bool isDark) {
    return CampusCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Column(
        children: [
          ListTile(
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.tertiaryAccent.withValues(alpha: isDark ? 0.15 : 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(LucideIcons.smartphone, color: AppColors.tertiaryAccent, size: 20),
            ),
            title: Text('M-Pesa', style: Theme.of(context).textTheme.bodyMedium),
            subtitle: Text('+266 5700 1234', style: Theme.of(context).textTheme.bodySmall),
            trailing: StatusBadge.success('Primary'),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
          ),
          const Divider(height: 1, indent: 60),
          ListTile(
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.info.withValues(alpha: isDark ? 0.15 : 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(LucideIcons.creditCard, color: AppColors.info, size: 20),
            ),
            title: Text('Add Card', style: Theme.of(context).textTheme.bodyMedium),
            subtitle: Text('Visa, Mastercard accepted', style: Theme.of(context).textTheme.bodySmall),
            trailing: const Icon(LucideIcons.plus, size: 18),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
          ),
        ],
      ),
    );
  }

  static const _upcomingPayments = [
    _UpcomingPayment(
      title: 'Tuition Fees - Semester 2',
      dueDate: '15 Aug 2026',
      amount: 'M 8,500.00',
      icon: LucideIcons.graduationCap,
      color: AppColors.primaryAccent,
      status: 'Unpaid',
      statusColor: AppColors.error,
    ),
    _UpcomingPayment(
      title: 'Hostel Fees',
      dueDate: '20 Aug 2026',
      amount: 'M 2,500.00',
      icon: LucideIcons.home,
      color: AppColors.secondaryAccent,
      status: 'Due Soon',
      statusColor: AppColors.warning,
    ),
    _UpcomingPayment(
      title: 'Library Fine - Overdue Book',
      dueDate: '01 Aug 2026',
      amount: 'M 150.00',
      icon: LucideIcons.bookOpen,
      color: AppColors.error,
      status: 'Overdue',
      statusColor: AppColors.error,
    ),
  ];

  static const _transactions = [
    _TransactionData(
      date: '22 Jul 2026',
      description: 'Tuition Fees - Semester 1',
      amount: 'M 8,500.00',
      status: 'Completed',
      statusColor: AppColors.success,
    ),
    _TransactionData(
      date: '15 Jul 2026',
      description: 'NLDF Bursary Disbursal',
      amount: '- M 25,000.00',
      status: 'Completed',
      statusColor: AppColors.success,
    ),
    _TransactionData(
      date: '01 Jul 2026',
      description: 'Hostel Deposit',
      amount: 'M 1,500.00',
      status: 'Completed',
      statusColor: AppColors.success,
    ),
    _TransactionData(
      date: '20 Jun 2026',
      description: 'Registration Fee',
      amount: 'M 500.00',
      status: 'Completed',
      statusColor: AppColors.success,
    ),
    _TransactionData(
      date: '10 Jun 2026',
      description: 'Work-Study Payout',
      amount: '- M 1,200.00',
      status: 'Processing',
      statusColor: AppColors.warning,
    ),
  ];
}

class _UpcomingPayment {
  final String title;
  final String dueDate;
  final String amount;
  final IconData icon;
  final Color color;
  final String status;
  final Color statusColor;

  const _UpcomingPayment({
    required this.title,
    required this.dueDate,
    required this.amount,
    required this.icon,
    required this.color,
    required this.status,
    required this.statusColor,
  });
}

class _TransactionData {
  final String date;
  final String description;
  final String amount;
  final String status;
  final Color statusColor;

  const _TransactionData({
    required this.date,
    required this.description,
    required this.amount,
    required this.status,
    required this.statusColor,
  });
}

class _TransactionTile extends StatelessWidget {
  final _TransactionData transaction;
  final bool isDark;

  const _TransactionTile({required this.transaction, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return CampusCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: transaction.statusColor.withValues(alpha: isDark ? 0.15 : 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              transaction.amount.startsWith('-') ? LucideIcons.trendingDown : LucideIcons.trendingUp,
              color: transaction.statusColor,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(transaction.description, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontSize: 13)),
                const SizedBox(height: 2),
                Text(transaction.date, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                transaction.amount,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: transaction.amount.startsWith('-') ? AppColors.success : AppColors.textPrimary,
                    ),
              ),
              const SizedBox(height: 4),
              StatusBadge(text: transaction.status, color: transaction.statusColor, isSmall: true),
            ],
          ),
        ],
      ),
    );
  }
}
