import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/marketplace/providers/food_provider.dart';

class FoodScreen extends ConsumerStatefulWidget {
  const FoodScreen({super.key});

  @override
  ConsumerState<FoodScreen> createState() => _FoodScreenState();
}

class _FoodScreenState extends ConsumerState<FoodScreen> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(12),
          ),
          child: TabBar(
            controller: _tabCtrl,
            indicator: BoxDecoration(
              gradient: AppColors.heroGradient,
              borderRadius: BorderRadius.circular(10),
            ),
            indicatorSize: TabBarIndicatorSize.tab,
            dividerColor: Colors.transparent,
            labelColor: Colors.white,
            unselectedLabelColor: AppColors.textSecondary,
            labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            tabs: const [
              Tab(text: 'In Campus'),
              Tab(text: 'Off Campus'),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: TabBarView(
            controller: _tabCtrl,
            children: [
              _buildShopList('incamp'),
              _buildShopList('offcamp'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildShopList(String type) {
    final shopsAsync = ref.watch(foodShopsProvider(type));
    return shopsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, st) => EmptyState(
        icon: LucideIcons.alertCircle,
        title: 'Something went wrong',
        message: 'Pull to refresh and try again',
      ),
      data: (shops) {
        if (shops.isEmpty) {
          return EmptyState(
            icon: LucideIcons.store,
            title: 'No shops found',
            message: 'No ${type == 'incamp' ? 'in-campus' : 'off-campus'} food shops available.',
          );
        }
        return ListView.builder(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 100),
          itemCount: shops.length,
          itemBuilder: (context, index) => _ShopCard(
            shop: shops[index],
            isDark: isDark,
            onTap: () => _openShopDetails(shops[index]),
          ),
        );
      },
    );
  }

  bool get isDark => Theme.of(context).brightness == Brightness.dark;

  void _openShopDetails(FoodShop shop) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        minChildSize: 0.4,
        maxChildSize: 0.9,
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
              Text(shop.name, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(LucideIcons.mapPin, size: 14, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Expanded(child: Text(shop.location, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary))),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  StatusBadge(text: shop.type == 'incamp' ? 'In Campus' : 'Off Campus', color: AppColors.primaryAccent, isSmall: true),
                  const SizedBox(width: 8),
                  const Icon(LucideIcons.star, size: 14, color: AppColors.tertiaryAccent),
                  const SizedBox(width: 4),
                  Text(shop.rating.toStringAsFixed(1), style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(width: 4),
                  Text('(${shop.reviewCount})', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
                  if (shop.deliveryAvailable) ...[
                    const SizedBox(width: 8),
                    StatusBadge(text: 'Delivery${shop.deliveryFee > 0 ? ' M${shop.deliveryFee}' : ''}', color: AppColors.success, isSmall: true),
                  ],
                ],
              ),
              const Divider(height: 24),
              if (shop.description.isNotEmpty) ...[
                Text(shop.description, style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.5)),
                const SizedBox(height: 16),
              ],
              Row(
                children: [
                  const Icon(LucideIcons.clock, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 6),
                  Text(shop.openingHours, style: Theme.of(context).textTheme.bodyMedium),
                  const Spacer(),
                  const Icon(LucideIcons.phone, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 6),
                  Text(shop.contactPhone, style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
              if (shop.menu.isNotEmpty) ...[
                const Divider(height: 24),
                Text('Menu', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                ...shop.menu.map((item) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Expanded(child: Text(item['name'] ?? '', style: Theme.of(context).textTheme.bodyMedium)),
                      Text('M${(item['price'] ?? 0).toStringAsFixed(0)}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600, color: AppColors.tertiaryAccent)),
                    ],
                  ),
                )),
              ],
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShopCard extends StatelessWidget {
  final FoodShop shop;
  final bool isDark;
  final VoidCallback? onTap;

  const _ShopCard({required this.shop, required this.isDark, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: CampusCard(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: AppColors.heroGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Icon(
                    shop.type == 'incamp' ? LucideIcons.school : LucideIcons.mapPin,
                    color: Colors.white, size: 24,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(shop.name, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(shop.location, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        StatusBadge(text: shop.type == 'incamp' ? 'In Campus' : 'Off Campus', color: AppColors.primaryAccent, isSmall: true),
                        const SizedBox(width: 8),
                        const Icon(LucideIcons.star, size: 12, color: AppColors.tertiaryAccent),
                        const SizedBox(width: 2),
                        Text(shop.rating.toStringAsFixed(1), style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
                        if (shop.deliveryAvailable) ...[
                          const SizedBox(width: 6),
                          Icon(LucideIcons.truck, size: 12, color: AppColors.success),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(LucideIcons.chevronRight, color: AppColors.textSecondary, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}
