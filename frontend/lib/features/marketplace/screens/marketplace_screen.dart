import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/marketplace/providers/marketplace_provider.dart';
import 'package:campusos/features/marketplace/screens/food_screen.dart';

enum MarketplaceCategory { all, books, electronics, furniture, services, food }

class MarketplaceScreen extends ConsumerStatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  ConsumerState<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends ConsumerState<MarketplaceScreen> {
  MarketplaceCategory _selectedCategory = MarketplaceCategory.all;
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final listingsAsync = ref.watch(marketplaceListingsProvider);

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
                      decoration: InputDecoration(
                        hintText: 'Search marketplace...',
                        prefixIcon: const Icon(LucideIcons.search, size: 18),
                        prefixIconConstraints: const BoxConstraints(minWidth: 40),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  CampusIconButton(
                    icon: LucideIcons.slidersHorizontal,
                    onPressed: () => _showFilterSheet(context),
                    tooltip: 'Filters',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: MarketplaceCategory.values.map((cat) {
                  final isSelected = _selectedCategory == cat;
                  final labels = {
                    MarketplaceCategory.all: 'All',
                    MarketplaceCategory.books: 'Textbooks',
                    MarketplaceCategory.electronics: 'Electronics',
                    MarketplaceCategory.furniture: 'Furniture',
                    MarketplaceCategory.services: 'Services',
                    MarketplaceCategory.food: 'Food',
                  };
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: CampusChip(
                      label: labels[cat]!,
                      isSelected: isSelected,
                      onTap: () => setState(() => _selectedCategory = cat),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 8),
            if (_selectedCategory == MarketplaceCategory.food)
              const Expanded(child: FoodScreen())
            else
              Expanded(
              child: listingsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, st) => EmptyState(
                  icon: LucideIcons.alertCircle,
                  title: 'Something went wrong',
                  message: 'Pull to refresh and try again',
                  actionLabel: 'Retry',
                  onAction: () => ref.invalidate(marketplaceListingsProvider),
                ),
                data: (listings) {
                  final filtered = _filterListings(listings);
                  if (filtered.isEmpty) {
                    return EmptyState(
                      icon: LucideIcons.store,
                      title: 'No listings found',
                      message: 'Try adjusting your filters or search.',
                    );
                  }
                  return ListView.builder(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.only(bottom: 100),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) => _ListingCard(
                      listing: filtered[index],
                      isDark: isDark,
                      onTap: () => _openListingDetails(filtered[index]),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: Container(
        decoration: BoxDecoration(
          gradient: AppColors.heroGradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: FloatingActionButton.extended(
          onPressed: () {
            final titleCtrl = TextEditingController();
            final priceCtrl = TextEditingController();
            final descCtrl = TextEditingController();
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
                    Text('Post a Listing', style: Theme.of(ctx).textTheme.titleMedium),
                    const SizedBox(height: 16),
                    TextField(
                      controller: titleCtrl,
                      decoration: const InputDecoration(
                        hintText: 'Title',
                        prefixIcon: Icon(LucideIcons.tag, size: 18),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: priceCtrl,
                      decoration: const InputDecoration(
                        hintText: 'Price (M)',
                        prefixIcon: Icon(LucideIcons.banknote, size: 18),
                      ),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descCtrl,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        hintText: 'Description',
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: CampusButton(
                        label: 'Post Listing',
                        onPressed: () {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Listing posted')),
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
          backgroundColor: Colors.transparent,
          elevation: 0,
          icon: const Icon(LucideIcons.plus, color: Colors.white),
          label: const Text('Post Listing', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }

  void _openListingDetails(MarketplaceListing listing) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final accentColor = _colorForCategory(listing.category);
    final icon = _iconForCategory(listing.category);
    final sellerInitials = listing.sellerName.isNotEmpty
        ? listing.sellerName.split(' ').map((w) => w[0]).take(2).join().toUpperCase()
        : '?';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
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
              Container(
                height: 180,
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [accentColor.withValues(alpha: 0.2), accentColor.withValues(alpha: 0.05)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Center(child: Icon(icon, size: 64, color: accentColor.withValues(alpha: 0.4))),
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(listing.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                  ),
                  Text('${listing.currency} ${listing.price.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppColors.tertiaryAccent, fontWeight: FontWeight.w700)),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  StatusBadge(text: listing.condition, color: accentColor, isSmall: true),
                  const SizedBox(width: 8),
                  StatusBadge(text: listing.category, color: AppColors.textSecondary, isSmall: true),
                  const Spacer(),
                  StatusBadge(text: listing.status, color: listing.status == 'active' ? AppColors.success : AppColors.textSecondary, isSmall: true),
                ],
              ),
              const Divider(height: 24),
              if (listing.description.isNotEmpty) ...[
                Text('Description', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                Text(listing.description, style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.5)),
                const SizedBox(height: 16),
              ],
              Text('Seller', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              Row(
                children: [
                  UserAvatar(initials: sellerInitials, size: 36),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(listing.sellerName, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
                      Text('Listed ${_timeAgo(listing.createdAt)}', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    return '${diff.inMinutes}m ago';
  }

  List<MarketplaceListing> _filterListings(List<MarketplaceListing> listings) {
    var result = listings;
    if (_selectedCategory != MarketplaceCategory.all) {
      const backendCat = {
        MarketplaceCategory.books: 'textbooks',
        MarketplaceCategory.electronics: 'electronics',
        MarketplaceCategory.furniture: 'furniture',
        MarketplaceCategory.services: 'services',
      };
      final cat = backendCat[_selectedCategory]!;
      result = result.where((l) => l.category == cat).toList();
    }
    if (_searchQuery.isNotEmpty) {
      result = result
          .where((l) => l.title.toLowerCase().contains(_searchQuery.toLowerCase()))
          .toList();
    }
    return result;
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        minChildSize: 0.3,
        maxChildSize: 0.8,
        expand: false,
        builder: (context, scrollController) => ListView(
          controller: scrollController,
          padding: const EdgeInsets.all(20),
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text('Filters', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 20),
            Text('Condition', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: ['New', 'Like New', 'Good', 'Fair'].map((c) {
                return CampusChip(label: c, onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))));
              }).toList(),
            ),
            const SizedBox(height: 20),
            Text('Price Range', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 10),
            RangeSlider(
              values: const RangeValues(0, 5000),
              min: 0,
              max: 10000,
              labels: const RangeLabels('M 0', 'M 5,000'),
              onChanged: (_) {},
            ),
            const SizedBox(height: 20),
            Text('Distance', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: ['On Campus', '1 km', '5 km', 'Any'].map((d) {
                return CampusChip(label: d, onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))));
              }).toList(),
            ),
            const SizedBox(height: 24),
            CampusButton(label: 'Apply Filters', onPressed: () => Navigator.pop(context)),
          ],
        ),
      ),
    );
  }
}

IconData _iconForCategory(String category) {
  switch (category) {
    case 'textbooks':
      return LucideIcons.bookOpen;
    case 'electronics':
      return LucideIcons.laptop;
    case 'furniture':
      return LucideIcons.armchair;
    case 'services':
      return LucideIcons.code;
    default:
      return LucideIcons.package;
  }
}

Color _colorForCategory(String category) {
  switch (category) {
    case 'textbooks':
      return AppColors.primaryAccent;
    case 'electronics':
      return AppColors.tertiaryAccent;
    case 'furniture':
      return AppColors.secondaryAccent;
    case 'services':
      return AppColors.info;
    default:
      return AppColors.primaryAccent;
  }
}

class _ListingCard extends StatelessWidget {
  final MarketplaceListing listing;
  final bool isDark;
  final VoidCallback? onTap;

  const _ListingCard({required this.listing, required this.isDark, this.onTap});

  @override
  Widget build(BuildContext context) {
    final accentColor = _colorForCategory(listing.category);
    final icon = _iconForCategory(listing.category);
    final sellerInitials = listing.sellerName.isNotEmpty
        ? listing.sellerName.split(' ').map((w) => w[0]).take(2).join().toUpperCase()
        : '?';

    return CampusCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 160,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  accentColor.withValues(alpha: 0.2),
                  accentColor.withValues(alpha: 0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Icon(icon, size: 48, color: accentColor.withValues(alpha: 0.5)),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(listing.title, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(listing.description, style: Theme.of(context).textTheme.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              Text(
                '${listing.currency} ${listing.price.toStringAsFixed(0)}',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.tertiaryAccent,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              StatusBadge(text: listing.condition, color: accentColor, isSmall: true),
              const SizedBox(width: 8),
              StatusBadge(text: listing.category, color: AppColors.textSecondary, isSmall: true),
              const Spacer(),
              UserAvatar(initials: sellerInitials, size: 24),
              const SizedBox(width: 6),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    listing.sellerName,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
