import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/services/api_service.dart';

class JobListing {
  final String id;
  final String title;
  final String company;
  final String description;
  final String location;
  final String type;
  final double salaryMin;
  final double salaryMax;
  final String currency;
  final List<String> skills;
  final bool isRemote;
  final DateTime deadline;

  JobListing({
    required this.id,
    required this.title,
    required this.company,
    required this.description,
    required this.location,
    required this.type,
    required this.salaryMin,
    required this.salaryMax,
    required this.currency,
    required this.skills,
    required this.isRemote,
    required this.deadline,
  });

  factory JobListing.fromJson(Map<String, dynamic> json) {
    return JobListing(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      company: json['company'] ?? '',
      description: json['description'] ?? '',
      location: json['location'] ?? '',
      type: json['type'] ?? '',
      salaryMin: (json['salaryMin'] ?? 0).toDouble(),
      salaryMax: (json['salaryMax'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'USD',
      skills: List<String>.from(json['skills'] ?? []),
      isRemote: json['isRemote'] ?? false,
      deadline: DateTime.tryParse(json['deadline'] ?? '') ?? DateTime.now(),
    );
  }

  factory JobListing.fallback() => JobListing(
        id: '',
        title: 'No jobs available',
        company: '',
        description: '',
        location: '',
        type: '',
        salaryMin: 0,
        salaryMax: 0,
        currency: 'USD',
        skills: [],
        isRemote: false,
        deadline: DateTime.now(),
      );
}

final jobsProvider = FutureProvider<List<JobListing>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/jobs');
    final data = response.data['data'] as List;
    return data.map((item) => JobListing.fromJson(item)).toList();
  } catch (e) {
    return [];
  }
});
