import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class CafeteriaScreen extends ConsumerStatefulWidget {
  const CafeteriaScreen({super.key});

  @override
  ConsumerState<CafeteriaScreen> createState() => _CafeteriaScreenState();
}

class _CafeteriaScreenState extends ConsumerState<CafeteriaScreen> {
  String _searchQuery = '';
  String _selectedCategory = 'All';
  final _searchController = TextEditingController();

  final _categories = ['All', 'Meals', 'Snacks', 'Drinks', 'Specials'];

  final _menuItems = [
    _MenuItem('Grilled Chicken', 45.0, 'Mountain View Café', 'Meals'),
    _MenuItem('Beef Burger', 55.0, 'Mountain View Café', 'Meals'),
    _MenuItem('Vegetable Stir Fry', 40.0, 'Mountain View Café', 'Meals'),
    _MenuItem('French Fries', 25.0, 'Snack Corner', 'Snacks'),
    _MenuItem('Samosa (3 pcs)', 20.0, 'Snack Corner', 'Snacks'),
    _MenuItem('Brownie', 18.0, 'Snack Corner', 'Snacks'),
    _MenuItem('Fresh Orange Juice', 22.0, 'The Juice Bar', 'Drinks'),
    _MenuItem('Smoothie', 30.0, 'The Juice Bar', 'Drinks'),
    _MenuItem('Cappuccino', 28.0, 'The Juice Bar', 'Drinks'),
    _MenuItem('Chef\'s Special Platter', 70.0, 'Mountain View Café', 'Specials'),
    _MenuItem('Grilled Fish', 65.0, 'Mountain View Café', 'Specials'),
    _MenuItem('Veggie Wrap', 35.0, 'Snack Corner', 'Meals'),
    _MenuItem('Milkshake', 35.0, 'The Juice Bar', 'Drinks'),
    _MenuItem('Muffin', 15.0, 'Snack Corner', 'Snacks'),
    _MenuItem('Spaghetti Bolognese', 50.0, 'Mountain View Café', 'Meals'),
  ];

  final _orderItems = [
    _OrderItem('Grilled Chicken', 45.0, 2),
    _OrderItem('French Fries', 25.0, 1),
    _OrderItem('Fresh Orange Juice', 22.0, 1),
  ];

  List<_MenuItem> get _filteredItems {
    return _menuItems.where((item) {
      final matchesCategory = _selectedCategory == 'All' || item.category == _selectedCategory;
      final matchesSearch = _searchQuery.isEmpty ||
          item.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item.cafeteria.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showOrderSheet() {
    final total = _orderItems.fold(0.0, (sum, item) => sum + item.price * item.quantity);

    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).brightness == Brightness.dark
          ? AppColors.surfaceDark
          : AppColors.surfaceLight,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
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
                Text('Your Order', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                const Spacer(),
                StatusBadge.success('${_orderItems.length} items'),
              ],
            ),
            const SizedBox(height: 16),
            ..._orderItems.map((item) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  Expanded(
                    child: Text(item.name, style: Theme.of(context).textTheme.bodyMedium),
                  ),
                  Text('x${item.quantity}', style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(width: 16),
                  SizedBox(
                    width: 64,
                    child: Text(
                      'M${(item.price * item.quantity).toStringAsFixed(2)}',
                      textAlign: TextAlign.right,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            )),
            const Divider(),
            Row(
              children: [
                Text('Total', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                const Spacer(),
                Text(
                  'M${total.toStringAsFixed(2)}',
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
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryAccent,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Checkout', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filtered = _filteredItems;

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('Cafeteria', style: Theme.of(context).textTheme.headlineSmall),
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
                          hintStyle: TextStyle(color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary),
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
                        itemCount: _categories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final cat = _categories[index];
                          final selected = cat == _selectedCategory;
                          return GestureDetector(
                            onTap: () => setState(() => _selectedCategory = cat),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 18),
                              decoration: BoxDecoration(
                                color: selected
                                    ? AppColors.primaryAccent
                                    : (isDark ? AppColors.surfaceDark : Colors.grey.withValues(alpha: 0.08)),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Center(
                                child: Text(
                                  cat,
                                  style: TextStyle(
                                    color: selected ? Colors.white : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondary),
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
            if (filtered.isEmpty)
              SliverFillRemaining(
                child: EmptyState(
                  icon: LucideIcons.utensilsCrossed,
                  title: 'No items found',
                  message: 'Try a different category or search term.',
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(0, 4, 0, 100),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final item = filtered[index];
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
                              child: Icon(
                                item.category == 'Meals' ? LucideIcons.utensilsCrossed
                                    : item.category == 'Snacks' ? LucideIcons.cookie
                                    : item.category == 'Drinks' ? LucideIcons.cupSoda
                                    : LucideIcons.star,
                                color: AppColors.primaryAccent,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.name, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Icon(LucideIcons.store, size: 12, color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary),
                                      const SizedBox(width: 4),
                                      Text(
                                        item.cafeteria,
                                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                          fontSize: 12,
                                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
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
                                const SizedBox(height: 4),
                                GestureDetector(
                                  onTap: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('${item.name} added to order'),
                                        duration: const Duration(seconds: 1),
                                      ),
                                    );
                                  },
                                  child: StatusBadge.info('Add'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                    childCount: filtered.length,
                  ),
                ),
              ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showOrderSheet,
        backgroundColor: AppColors.primaryAccent,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            const Icon(LucideIcons.shoppingCart, color: Colors.white),
            Positioned(
              right: -6,
              top: -6,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  '${_orderItems.length}',
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuItem {
  final String name;
  final double price;
  final String cafeteria;
  final String category;

  const _MenuItem(this.name, this.price, this.cafeteria, this.category);
}

class _OrderItem {
  final String name;
  final double price;
  final int quantity;

  const _OrderItem(this.name, this.price, this.quantity);
}
