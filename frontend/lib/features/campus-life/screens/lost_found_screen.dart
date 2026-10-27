import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

enum ItemStatus { pending, resolved, claimed }
enum ItemCategory { all, electronics, books, clothing, accessories, other }

class _LostItem {
  final String name;
  final String description;
  final String location;
  final String date;
  final ItemStatus status;
  final ItemCategory category;
  const _LostItem({
    required this.name,
    required this.description,
    required this.location,
    required this.date,
    required this.status,
    required this.category,
  });
}

class _FoundItem {
  final String name;
  final String description;
  final String location;
  final String date;
  final ItemStatus status;
  final ItemCategory category;
  const _FoundItem({
    required this.name,
    required this.description,
    required this.location,
    required this.date,
    required this.status,
    required this.category,
  });
}

class LostFoundScreen extends ConsumerStatefulWidget {
  const LostFoundScreen({super.key});

  @override
  ConsumerState<LostFoundScreen> createState() => _LostFoundScreenState();
}

class _LostFoundScreenState extends ConsumerState<LostFoundScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';
  ItemCategory _selectedCategory = ItemCategory.all;

  final _lostItems = const [
    _LostItem(
      name: 'Blue Backpack',
      description: 'Nike backpack with laptop sleeve, contains notebooks',
      location: 'Science & Technology Block, Room 204',
      date: 'Mar 15, 2026',
      status: ItemStatus.pending,
      category: ItemCategory.other,
    ),
    _LostItem(
      name: 'Calculus Textbook',
      description: 'Stewart Calculus 8th Edition, blue cover',
      location: 'Library, 2nd Floor Study Area',
      date: 'Mar 12, 2026',
      status: ItemStatus.resolved,
      category: ItemCategory.books,
    ),
    _LostItem(
      name: 'HP Laptop Charger',
      description: 'HP 65W USB-C charger with cable',
      location: 'Computer Science Lab L1',
      date: 'Mar 10, 2026',
      status: ItemStatus.pending,
      category: ItemCategory.electronics,
    ),
    _LostItem(
      name: 'Black Hoodie',
      description: 'Plain black hoodie, size L, Adidas brand',
      location: 'Cafeteria near the counter',
      date: 'Mar 8, 2026',
      status: ItemStatus.claimed,
      category: ItemCategory.clothing,
    ),
    _LostItem(
      name: 'Wireless Mouse',
      description: 'Logitech MX Master 3, grey',
      location: 'Engineering Building, Lab 2',
      date: 'Mar 14, 2026',
      status: ItemStatus.pending,
      category: ItemCategory.electronics,
    ),
  ];

  final _foundItems = const [
    _FoundItem(
      name: 'Grey Jacket',
      description: 'North Face waterproof jacket, size M',
      location: 'Science & Technology Block, Room 105',
      date: 'Mar 16, 2026',
      status: ItemStatus.pending,
      category: ItemCategory.clothing,
    ),
    _FoundItem(
      name: 'USB Drive (32GB)',
      description: 'SanDisk 32GB USB 3.0 flash drive, black',
      location: 'Library, PC Station 8',
      date: 'Mar 13, 2026',
      status: ItemStatus.pending,
      category: ItemCategory.electronics,
    ),
    _FoundItem(
      name: 'Set of Keys',
      description: '3 keys on a key ring with a blue fob',
      location: 'Near Boys Residence Hall H1',
      date: 'Mar 11, 2026',
      status: ItemStatus.resolved,
      category: ItemCategory.other,
    ),
    _FoundItem(
      name: 'Python Programming Book',
      description: 'Automate the Boring Stuff with Python, 2nd Ed',
      location: 'Physics Lab L2',
      date: 'Mar 9, 2026',
      status: ItemStatus.claimed,
      category: ItemCategory.books,
    ),
    _FoundItem(
      name: 'Silver Earring',
      description: 'Small silver hoop earring',
      location: 'Cafeteria near the salad bar',
      date: 'Mar 15, 2026',
      status: ItemStatus.pending,
      category: ItemCategory.accessories,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  String _statusLabel(ItemStatus status) {
    switch (status) {
      case ItemStatus.pending:
        return 'Pending';
      case ItemStatus.resolved:
        return 'Resolved';
      case ItemStatus.claimed:
        return 'Claimed';
    }
  }

  StatusBadge _statusBadge(ItemStatus status) {
    switch (status) {
      case ItemStatus.pending:
        return StatusBadge.warning(_statusLabel(status));
      case ItemStatus.resolved:
        return StatusBadge.success(_statusLabel(status));
      case ItemStatus.claimed:
        return StatusBadge.info(_statusLabel(status));
    }
  }

  String _categoryLabel(ItemCategory category) {
    switch (category) {
      case ItemCategory.all:
        return 'All';
      case ItemCategory.electronics:
        return 'Electronics';
      case ItemCategory.books:
        return 'Books';
      case ItemCategory.clothing:
        return 'Clothing';
      case ItemCategory.accessories:
        return 'Accessories';
      case ItemCategory.other:
        return 'Other';
    }
  }

  List<_LostItem> get _filteredLostItems {
    return _lostItems.where((item) {
      final matchesCategory =
          _selectedCategory == ItemCategory.all || item.category == _selectedCategory;
      final matchesSearch = _searchQuery.isEmpty ||
          item.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item.description.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();
  }

  List<_FoundItem> get _filteredFoundItems {
    return _foundItems.where((item) {
      final matchesCategory =
          _selectedCategory == ItemCategory.all || item.category == _selectedCategory;
      final matchesSearch = _searchQuery.isEmpty ||
          item.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item.description.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();
  }

  void _showReportSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textSecondary.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            const Icon(LucideIcons.clipboardList, size: 48, color: AppColors.primaryAccent),
            const SizedBox(height: 16),
            Text(
              'Report an Item',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Report a lost or found item',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 24),
            CampusButton(
              label: 'Submit Report',
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Demo: Lost/found item report submitted'),
                    duration: Duration(seconds: 1),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lost & Found'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              onChanged: (v) => setState(() => _searchQuery = v),
              decoration: InputDecoration(
                hintText: 'Search items...',
                prefixIcon: const Icon(LucideIcons.search, size: 20),
                filled: true,
                fillColor: isDark
                    ? AppColors.surfaceDark
                    : AppColors.backgroundLight,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              physics: const BouncingScrollPhysics(),
              itemCount: ItemCategory.values.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final cat = ItemCategory.values[index];
                return CampusChip(
                  label: _categoryLabel(cat),
                  isSelected: _selectedCategory == cat,
                  onTap: () => setState(() => _selectedCategory = cat),
                );
              },
            ),
          ),
          TabBar(
            controller: _tabController,
            labelColor: AppColors.primaryAccent,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.primaryAccent,
            tabs: const [
              Tab(text: 'Lost Items'),
              Tab(text: 'Found Items'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildLostItemsList(isDark),
                _buildFoundItemsList(isDark),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showReportSheet,
        backgroundColor: AppColors.primaryAccent,
        child: const Icon(LucideIcons.plus, color: Colors.white),
      ),
    );
  }

  Widget _buildLostItemsList(bool isDark) {
    final items = _filteredLostItems;
    if (items.isEmpty) {
      return const EmptyState(
        icon: LucideIcons.search,
        title: 'No lost items found',
        message: 'Try adjusting your search or filters',
      );
    }
    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(0, 4, 0, 100),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return CampusCard(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: isDark ? 0.15 : 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(LucideIcons.search, color: AppColors.warning, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            item.name,
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ),
                        _statusBadge(item.status),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.description,
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(LucideIcons.mapPin, size: 12, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            item.location,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(LucideIcons.calendar, size: 12, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          item.date,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFoundItemsList(bool isDark) {
    final items = _filteredFoundItems;
    if (items.isEmpty) {
      return const EmptyState(
        icon: LucideIcons.package,
        title: 'No found items',
        message: 'Try adjusting your search or filters',
      );
    }
    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(0, 4, 0, 100),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return CampusCard(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.tertiaryAccent.withValues(alpha: isDark ? 0.15 : 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(LucideIcons.package, color: AppColors.tertiaryAccent, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            item.name,
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ),
                        _statusBadge(item.status),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.description,
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(LucideIcons.mapPin, size: 12, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            item.location,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(LucideIcons.calendar, size: 12, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          item.date,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
