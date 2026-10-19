import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/services/api_service.dart';

class FoodShop {
  final String id;
  final String name;
  final String description;
  final String type;
  final String location;
  final String contactPhone;
  final List<String> images;
  final List<Map<String, dynamic>> menu;
  final double rating;
  final int reviewCount;
  final String openingHours;
  final String status;
  final bool deliveryAvailable;
  final int deliveryFee;

  FoodShop({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    required this.location,
    required this.contactPhone,
    required this.images,
    required this.menu,
    required this.rating,
    required this.reviewCount,
    required this.openingHours,
    required this.status,
    required this.deliveryAvailable,
    required this.deliveryFee,
  });

  factory FoodShop.fromJson(Map<String, dynamic> json) {
    return FoodShop(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      type: json['type'] ?? '',
      location: json['location'] ?? '',
      contactPhone: json['contactPhone'] ?? '',
      images: List<String>.from(json['images'] ?? []),
      menu: List<Map<String, dynamic>>.from(json['menu'] ?? []),
      rating: (json['rating'] is String ? double.parse(json['rating']) : (json['rating'] ?? 0)).toDouble(),
      reviewCount: json['reviewCount'] ?? 0,
      openingHours: json['openingHours'] ?? '',
      status: json['status'] ?? '',
      deliveryAvailable: json['deliveryAvailable'] ?? false,
      deliveryFee: json['deliveryFee'] ?? 0,
    );
  }
}

final foodShopsProvider = FutureProvider.family<List<FoodShop>, String?>((ref, type) async {
  final api = ref.read(apiServiceProvider);
  try {
    final query = type != null ? '?type=$type' : '';
    final response = await api.get('/api/v1/marketplace/food/shops$query');
    final raw = response.data is List ? response.data : (response.data?['data'] as List? ?? []);
    return raw.map((item) => FoodShop.fromJson(item)).toList();
  } catch (e) {
    return [];
  }
});
