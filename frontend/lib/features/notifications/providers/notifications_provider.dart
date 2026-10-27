import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/services/api_service.dart';

class AppNotification {
  final String id;
  final String title;
  final String body;
  final String type;
  final String module;
  final String priority;
  final bool isRead;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.module,
    required this.priority,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    // Backend serialises the boolean as `read`; tolerate `isRead` too.
    final read = json['read'] ?? json['isRead'] ?? false;
    return AppNotification(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      body: (json['body'] ?? '').toString(),
      type: (json['type'] ?? '').toString(),
      module: (json['module'] ?? '').toString(),
      priority: (json['priority'] ?? 'normal').toString(),
      isRead: read == true,
      createdAt: DateTime.tryParse((json['createdAt'] ?? '').toString()) ?? DateTime.now(),
    );
  }
}

/// All notifications for the signed-in user (newest first).
final notificationsProvider =
    FutureProvider<List<AppNotification>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/notifications');
    final raw = response.data;
    final list = raw is List
        ? raw
        : raw is Map && raw['data'] is List
            ? raw['data'] as List
            : const [];
    return list
        .map((e) => AppNotification.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  } catch (e) {
    return <AppNotification>[];
  }
});

/// Server-side unread count (used for the bell badge).
final unreadNotificationsCountProvider = FutureProvider<int>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/notifications/unread-count');
    final data = response.data;
    final map = data is Map && data['data'] is Map
        ? Map<String, dynamic>.from(data['data'] as Map)
        : data is Map
            ? Map<String, dynamic>.from(data)
            : const <String, dynamic>{};
    return (map['count'] as num?)?.toInt() ?? 0;
  } catch (_) {
    return 0;
  }
});

/// Marks a single notification as read, then refreshes the lists.
Future<void> markNotificationRead(WidgetRef ref, String id) async {
  final api = ref.read(apiServiceProvider);
  try {
    await api.patch('/api/v1/notifications/$id/read');
  } catch (_) {
    // Best-effort; the UI still reflects the local interaction below.
  }
  ref.invalidate(notificationsProvider);
  ref.invalidate(unreadNotificationsCountProvider);
}

/// Marks every notification as read, then refreshes the lists.
Future<void> markAllNotificationsRead(WidgetRef ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    await api.patch('/api/v1/notifications/read-all');
  } catch (_) {}
  ref.invalidate(notificationsProvider);
  ref.invalidate(unreadNotificationsCountProvider);
}

/// Registers the device push token with the backend (no-op scaffold on web).
Future<void> registerPushToken(WidgetRef ref, String token, {String platform = 'web'}) async {
  final api = ref.read(apiServiceProvider);
  try {
    await api.post('/api/v1/notifications/fcm-token', data: {
      'token': token,
      'platform': platform,
    });
  } catch (_) {}
}
