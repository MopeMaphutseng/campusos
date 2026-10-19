import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/services/api_service.dart';

class NewsArticle {
  final String id;
  final String title;
  final String summary;
  final String authorName;
  final String category;
  final String imageUrl;
  final List<String> tags;
  final DateTime publishedAt;
  final int viewCount;

  NewsArticle({
    required this.id,
    required this.title,
    required this.summary,
    required this.authorName,
    required this.category,
    required this.imageUrl,
    required this.tags,
    required this.publishedAt,
    required this.viewCount,
  });

  factory NewsArticle.fromJson(Map<String, dynamic> json) {
    return NewsArticle(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      summary: json['summary'] ?? '',
      authorName: json['authorName'] ?? '',
      category: json['category'] ?? '',
      imageUrl: json['imageUrl'] ?? '',
      tags: List<String>.from(json['tags'] ?? []),
      publishedAt:
          DateTime.tryParse(json['publishedAt'] ?? '') ?? DateTime.now(),
      viewCount: json['viewCount'] ?? 0,
    );
  }

  factory NewsArticle.fallback() => NewsArticle(
        id: '',
        title: 'No articles available',
        summary: '',
        authorName: '',
        category: '',
        imageUrl: '',
        tags: [],
        publishedAt: DateTime.now(),
        viewCount: 0,
      );
}

final newsArticlesProvider = FutureProvider<List<NewsArticle>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/news/articles');
    final data = response.data['data'] as List;
    return data.map((item) => NewsArticle.fromJson(item)).toList();
  } catch (e) {
    return [];
  }
});
