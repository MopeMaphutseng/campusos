import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/services/api_service.dart';

class Conversation {
  final String id;
  final String name;
  final String type;
  final List<String> participantIds;
  final String lastMessagePreview;
  final DateTime lastMessageAt;

  Conversation({
    required this.id,
    required this.name,
    required this.type,
    required this.participantIds,
    required this.lastMessagePreview,
    required this.lastMessageAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'direct',
      participantIds: List<String>.from(json['participantIds'] ?? []),
      lastMessagePreview: json['lastMessagePreview'] ?? '',
      lastMessageAt:
          DateTime.tryParse(json['lastMessageAt'] ?? '') ?? DateTime.now(),
    );
  }

  factory Conversation.fallback() => Conversation(
        id: '',
        name: 'No conversations',
        type: 'direct',
        participantIds: [],
        lastMessagePreview: '',
        lastMessageAt: DateTime.now(),
      );
}

class ChatMessage {
  final String id;
  final String conversationId;
  final String senderId;
  final String type;
  final String content;
  final String status;
  final DateTime createdAt;

  ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.type,
    required this.content,
    required this.status,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] ?? '',
      conversationId: json['conversationId'] ?? '',
      senderId: json['senderId'] ?? '',
      type: json['type'] ?? 'text',
      content: json['content'] ?? '',
      status: json['status'] ?? 'sent',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  factory ChatMessage.fallback() => ChatMessage(
        id: '',
        conversationId: '',
        senderId: '',
        type: 'text',
        content: '',
        status: 'unknown',
        createdAt: DateTime.now(),
      );
}

final conversationsProvider =
    FutureProvider<List<Conversation>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/messaging/conversations');
    final data = response.data['data'] as List;
    return data.map((item) => Conversation.fromJson(item)).toList();
  } catch (e) {
    return [];
  }
});
