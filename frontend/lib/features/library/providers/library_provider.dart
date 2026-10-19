import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/services/api_service.dart';

class LibraryResource {
  final String id;
  final String title;
  final String description;
  final String content;
  final String type;
  final String category;
  final String courseCode;
  final String faculty;
  final String topic;
  final int viewCount;
  final int downloadCount;
  final int upvotes;
  final bool isVerified;

  LibraryResource({
    required this.id,
    required this.title,
    required this.description,
    required this.content,
    required this.type,
    required this.category,
    required this.courseCode,
    required this.faculty,
    required this.topic,
    required this.viewCount,
    required this.downloadCount,
    required this.upvotes,
    required this.isVerified,
  });

  factory LibraryResource.fromJson(Map<String, dynamic> json) {
    return LibraryResource(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      content: json['content'] ?? '',
      type: json['type'] ?? '',
      category: json['category'] ?? '',
      courseCode: json['courseCode'] ?? '',
      faculty: json['faculty'] ?? '',
      topic: json['topic'] ?? '',
      viewCount: json['viewCount'] ?? 0,
      downloadCount: json['downloadCount'] ?? 0,
      upvotes: json['upvotes'] ?? 0,
      isVerified: json['isVerified'] ?? false,
    );
  }

  factory LibraryResource.fallback() => LibraryResource(
        id: '',
        title: 'No resources available',
        description: '',
        content: '',
        type: '',
        category: '',
        courseCode: '',
        faculty: '',
        topic: '',
        viewCount: 0,
        downloadCount: 0,
        upvotes: 0,
        isVerified: false,
      );
}

final libraryProvider =
    FutureProvider<List<LibraryResource>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/library/items');
    final raw = response.data['data'];
    final items = raw is List ? raw : (raw['items'] as List);
    return items
        .map((item) => LibraryResource.fromJson(item))
        .toList();
  } catch (e) {
    return [];
  }
});

final libraryCategoriesProvider = FutureProvider<List<String>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/library/categories');
    final data = response.data['data'] as List;
    return data.map((item) => item.toString()).toList();
  } catch (e) {
    return [];
  }
});
