import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/services/api_service.dart';

class AppNotification {
  final String id;
  final String title;
  final String body;
  final String type;
  final String module;
  final bool isRead;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.module,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      type: json['type'] ?? '',
      module: json['module'] ?? '',
      isRead: json['isRead'] ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  factory AppNotification.fallback() => AppNotification(
        id: '',
        title: 'No notifications',
        body: '',
        type: '',
        module: '',
        isRead: true,
        createdAt: DateTime.now(),
      );
}

final notificationsProvider =
    FutureProvider<List<AppNotification>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/notifications');
    final data = response.data['data'] as List;
    return data
        .map((item) => AppNotification.fromJson(item))
        .toList();
  } catch (e) {
    return [];
  }
});
