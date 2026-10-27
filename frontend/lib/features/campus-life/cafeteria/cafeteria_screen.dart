import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/core/services/api_service.dart';
import 'package:campusos/features/campus-life/providers/campus_life_providers.dart';

class CafeteriaScreen extends ConsumerStatefulWidget {
  const CafeteriaScreen({super.key});

  @override
  ConsumerState<CafeteriaScreen> createState() => _CafeteriaScreenState();
}

class _CafeteriaScreenState extends ConsumerState<CafeteriaScreen> {
  String _searchQuery = '';
  String _selectedMeal = 'all';
  final _searchController = TextEditingController();

  /// itemId -> quantity
  final Map<String, int> _cart = {};
  /// itemId -> menu item (needed to build the order payload)
  final Map<String, CafeteriaMenuItem> _catalog = {};

  final _meals = const [
    ('all', 'All'),
    ('breakfast', 'Breakfast'),
    ('lunch', 'Lunch'),
    ('dinner', 'Dinner'),
    ('snack', 'Snacks'),
  ];

  int get _cartCount => _cart.values.fold(0, (sum, q) => sum + q);

  double get _cartTotal => _cart.entries.fold(0.0, (sum, e) {
        final item = _catalog[e.key];
        return sum + (item?.price ?? 0) * e.value;
      });

  void _addToCart(CafeteriaMenuItem item) {
    setState(() {
      _catalog[item.id] = item;
      _cart[item.id] = (_cart[item.id] ?? 0) + 1;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${item.itemName} added'),
        duration: const Duration(milliseconds: 900),
      ),
    );
  }

  Future<bool> _submitOrder() async {
    if (_cart.isEmpty) return false;
    final api = ref.read(apiServiceProvider);
    try {
      // The server resolves the name/price from the menu, so only send the
      // menu row id and quantity. This prevents client-side price tampering.
      final items = _cart.entries
          .map((e) => {'menuItemId': e.key, 'quantity': e.value})
          .toList();
      await api.createCafeteriaOrder({'items': items});
      return true;
    } catch (_) {
      return false;
    }
  }

  void _showCartSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).brightness == Brightness.dark
          ? AppColors.surfaceDark
          : AppColors.surfaceLight,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        var placing = false;
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            Future<void> place() async {
              if (placing) return;
              setSheetState(() => placing = true);
              final messenger = ScaffoldMessenger.of(context);
              final ok = await _submitOrder();
              if (!mounted) return;
              if (ok) {
                if (ctx.mounted) Navigator.of(ctx).pop();
                setState(() => _cart.clear());
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Order placed! Track it in Orders.'),
                    duration: Duration(seconds: 2),
                  ),
                );
              } else {
                if (ctx.mounted) setSheetState(() => placing = false);
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Could not place order. Please try again.'),
                    duration: Duration(seconds: 2),
                  ),
                );
              }
            }

            void changeQty(String id, int delta) {
              setSheetState(() {
                final next = (_cart[id] ?? 0) + delta;
                if (next <= 0) {
                  _cart.remove(id);
                } else {
                  _cart[id] = next;
                }
              });
              setState(() {}); // keep the FAB badge in sync behind the sheet
              if (_cart.isEmpty) Navigator.of(ctx).pop();
            }

            final entries = _cart.entries.toList();
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Text('Your Order',
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(fontWeight: FontWeight.w700)),
                      const Spacer(),
                      StatusBadge.success('$_cartCount items'),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ...entries.map((e) {
                    final item = _catalog[e.key]!;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.itemName,
                                    style: Theme.of(context).textTheme.bodyMedium),
                                Text(item.shopName,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodySmall
                                        ?.copyWith(fontSize: 11)),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(LucideIcons.minus, size: 16),
                            onPressed: placing ? null : () => changeQty(e.key, -1),
                          ),
                          Text('x${e.value}',
                              style: Theme.of(context).textTheme.bodySmall),
                          IconButton(
                            icon: const Icon(LucideIcons.plus, size: 16),
                            onPressed: placing ? null : () => changeQty(e.key, 1),
                          ),
                          SizedBox(
                            width: 64,
                            child: Text(
                              'M${(item.price * e.value).toStringAsFixed(2)}',
                              textAlign: TextAlign.right,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                  const Divider(),
                  Row(
                    children: [
                      Text('Total',
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700)),
                      const Spacer(),
                      Text(
                        'M${_cartTotal.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.tertiaryAccent,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: placing ? null : place,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryAccent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: placing
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Place Order',
                              style: TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<CafeteriaMenuItem> _filtered(List<CafeteriaMenuItem> items) {
    return items.where((item) {
      final matchesMeal = _selectedMeal == 'all' || item.mealType == _selectedMeal;
      final q = _searchQuery.toLowerCase();
      final matchesSearch = q.isEmpty ||
          item.itemName.toLowerCase().contains(q) ||
          item.shopName.toLowerCase().contains(q) ||
          item.category.toLowerCase().contains(q);
      return matchesMeal && matchesSearch;
    }).toList();
  }

  IconData _iconFor(String category) {
    switch (category.toLowerCase()) {
      case 'meals':
        return LucideIcons.utensilsCrossed;
      case 'snacks':
        return LucideIcons.cookie;
      case 'drinks':
        return LucideIcons.cupSoda;
      case 'breakfast':
        return LucideIcons.eggFried;
      default:
        return LucideIcons.star;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final menuAsync = ref.watch(cafeteriaMenuProvider(null));

    return Scaffold(
      floatingActionButton: _cartCount == 0
          ? null
          : FloatingActionButton(
              onPressed: _showCartSheet,
              backgroundColor: AppColors.primaryAccent,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(LucideIcons.shoppingCart, color: Colors.white),
                  Positioned(
                    right: -8,
                    top: -8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: AppColors.error,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '$_cartCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => ref.invalidate(cafeteriaMenuProvider(null)),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              SliverAppBar(
                floating: true,
                backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
                title: Text("Today's Menu", style: Theme.of(context).textTheme.headlineSmall),
                actions: [
                  IconButton(
                    icon: const Icon(LucideIcons.refreshCw, size: 20),
                    onPressed: () => ref.invalidate(cafeteriaMenuProvider(null)),
                  ),
                ],
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        height: 44,
                        child: TextField(
                          controller: _searchController,
                          onChanged: (v) => setState(() => _searchQuery = v),
                          style: Theme.of(context).textTheme.bodyMedium,
                          decoration: InputDecoration(
                            hintText: 'Search menu items...',
                            hintStyle: TextStyle(
                                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary),
                            prefixIcon: const Icon(LucideIcons.search, size: 20),
                            suffixIcon: _searchQuery.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(LucideIcons.x, size: 18),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() => _searchQuery = '');
                                    },
                                  )
                                : null,
                            filled: true,
                            fillColor: isDark ? AppColors.surfaceDark : Colors.grey.withValues(alpha: 0.06),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        height: 36,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _meals.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (context, index) {
                            final meal = _meals[index];
                            final selected = meal.$1 == _selectedMeal;
                            return GestureDetector(
                              onTap: () => setState(() => _selectedMeal = meal.$1),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 18),
                                decoration: BoxDecoration(
                                  color: selected
                                      ? AppColors.primaryAccent
                                      : (isDark
                                          ? AppColors.surfaceDark
                                          : Colors.grey.withValues(alpha: 0.08)),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Center(
                                  child: Text(
                                    meal.$2,
                                    style: TextStyle(
                                      color: selected
                                          ? Colors.white
                                          : (isDark
                                              ? AppColors.textSecondaryDark
                                              : AppColors.textSecondary),
                                      fontSize: 13,
                                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              menuAsync.when(
                loading: () => const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (e, _) => const SliverFillRemaining(
                  hasScrollBody: false,
                  child: EmptyState(
                    icon: LucideIcons.wifiOff,
                    title: 'Menu unavailable',
                    message: 'Could not reach the cafeteria. Pull down to retry.',
                  ),
                ),
                data: (items) {
                  for (final item in items) {
                    _catalog[item.id] = item;
                  }
                  final filtered = _filtered(items);
                  if (filtered.isEmpty) {
                    return const SliverFillRemaining(
                      hasScrollBody: false,
                      child: EmptyState(
                        icon: LucideIcons.utensilsCrossed,
                        title: 'No items found',
                        message: 'Try a different meal or search term.',
                      ),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(0, 4, 0, 100),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) => _buildItemCard(filtered[index], isDark),
                        childCount: filtered.length,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildItemCard(CafeteriaMenuItem item, bool isDark) {
    return CampusCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primaryAccent.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(_iconFor(item.category), color: AppColors.primaryAccent, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.itemName,
                    style: Theme.of(context)
                        .textTheme
                        .titleSmall
                        ?.copyWith(fontWeight: FontWeight.w600)),
                if (item.description.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    item.description,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontSize: 12,
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
                        ),
                  ),
                ],
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(LucideIcons.store,
                        size: 12,
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        item.shopName,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              fontSize: 11,
                              color:
                                  isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
                            ),
                      ),
                    ),
                    if (item.dietaryFlags.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      StatusBadge.success(item.dietaryFlags.first),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'M${item.price.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.tertiaryAccent,
                    ),
              ),
              const SizedBox(height: 6),
              GestureDetector(
                onTap: () => _addToCart(item),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.primaryAccent,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.plus, size: 14, color: Colors.white),
                      SizedBox(width: 3),
                      Text(
                        'Add',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
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
