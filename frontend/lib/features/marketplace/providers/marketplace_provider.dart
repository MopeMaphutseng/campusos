import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/services/api_service.dart';

class MarketplaceListing {
  final String id;
  final String title;
  final String description;
  final String category;
  final double price;
  final String currency;
  final String condition;
  final List<String> images;
  final String status;
  final String sellerName;
  final DateTime createdAt;

  MarketplaceListing({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.price,
    required this.currency,
    required this.condition,
    required this.images,
    required this.status,
    required this.sellerName,
    required this.createdAt,
  });

  factory MarketplaceListing.fromJson(Map<String, dynamic> json) {
    return MarketplaceListing(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? '',
      price: (json['price'] is String ? double.parse(json['price']) : (json['price'] ?? 0)).toDouble(),
      currency: json['currency'] ?? 'USD',
      condition: json['condition'] ?? '',
      images: List<String>.from(json['images'] ?? []),
      status: json['status'] ?? 'active',
      sellerName: json['sellerName'] ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  factory MarketplaceListing.fallback() => MarketplaceListing(
        id: '',
        title: 'No listings available',
        description: '',
        category: '',
        price: 0,
        currency: 'USD',
        condition: '',
        images: [],
        status: 'inactive',
        sellerName: '',
        createdAt: DateTime.now(),
      );
}

final marketplaceListingsProvider =
    FutureProvider<List<MarketplaceListing>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/marketplace/listings');
    final raw = response.data['data'];
    final items = raw is List ? raw : (raw['items'] as List);
    return items
        .map((item) => MarketplaceListing.fromJson(item))
        .toList();
  } catch (e) {
    return [];
  }
});

final marketplaceCategoriesProvider = FutureProvider<List<String>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/marketplace/categories');
    final data = response.data['data'] as List;
    return data.map((item) => item.toString()).toList();
  } catch (e) {
    return [];
  }
});
