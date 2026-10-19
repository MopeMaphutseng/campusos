import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/services/api_service.dart';

class ScholarshipItem {
  final String id;
  final String title;
  final String provider;
  final String country;
  final String degreeLevel;
  final double fundingPercentage;
  final double amount;
  final String currency;
  final DateTime deadline;
  final String faculty;
  final String description;

  ScholarshipItem({
    required this.id,
    required this.title,
    required this.provider,
    required this.country,
    required this.degreeLevel,
    required this.fundingPercentage,
    required this.amount,
    required this.currency,
    required this.deadline,
    required this.faculty,
    required this.description,
  });

  factory ScholarshipItem.fromJson(Map<String, dynamic> json) {
    return ScholarshipItem(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      provider: json['provider'] ?? '',
      country: json['country'] ?? '',
      degreeLevel: json['degreeLevel'] ?? '',
      fundingPercentage: (json['fundingPercentage'] ?? 0).toDouble(),
      amount: (json['amount'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'USD',
      deadline: DateTime.tryParse(json['deadline'] ?? '') ?? DateTime.now(),
      faculty: json['faculty'] ?? '',
      description: json['description'] ?? '',
    );
  }

  factory ScholarshipItem.fallback() => ScholarshipItem(
        id: '',
        title: 'No scholarships available',
        provider: '',
        country: '',
        degreeLevel: '',
        fundingPercentage: 0,
        amount: 0,
        currency: 'USD',
        deadline: DateTime.now(),
        faculty: '',
        description: '',
      );
}

final scholarshipsProvider =
    FutureProvider<List<ScholarshipItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/scholarships');
    final data = response.data['data'] as List;
    return data
        .map((item) => ScholarshipItem.fromJson(item))
        .toList();
  } catch (e) {
    return [];
  }
});
