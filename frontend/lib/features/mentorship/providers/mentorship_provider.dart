import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/services/api_service.dart';

class MentorProfile {
  final String id;
  final String userId;
  final String name;
  final String bio;
  final List<String> expertise;
  final double averageRating;
  final int totalSessions;
  final String status;

  MentorProfile({
    required this.id,
    required this.userId,
    required this.name,
    required this.bio,
    required this.expertise,
    required this.averageRating,
    required this.totalSessions,
    required this.status,
  });

  factory MentorProfile.fromJson(Map<String, dynamic> json) {
    return MentorProfile(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      name: json['name'] ?? '',
      bio: json['bio'] ?? '',
      expertise: List<String>.from(json['expertise'] ?? []),
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      totalSessions: json['totalSessions'] ?? 0,
      status: json['status'] ?? 'active',
    );
  }

  factory MentorProfile.fallback() => MentorProfile(
        id: '',
        userId: '',
        name: 'No mentors available',
        bio: '',
        expertise: [],
        averageRating: 0,
        totalSessions: 0,
        status: 'inactive',
      );
}

class Booking {
  final String id;
  final String mentorId;
  final String mentorName;
  final DateTime scheduledAt;
  final String status;
  final String topic;

  Booking({
    required this.id,
    required this.mentorId,
    required this.mentorName,
    required this.scheduledAt,
    required this.status,
    required this.topic,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] ?? '',
      mentorId: json['mentorId'] ?? '',
      mentorName: json['mentorName'] ?? '',
      scheduledAt:
          DateTime.tryParse(json['scheduledAt'] ?? '') ?? DateTime.now(),
      status: json['status'] ?? 'pending',
      topic: json['topic'] ?? '',
    );
  }

  factory Booking.fallback() => Booking(
        id: '',
        mentorId: '',
        mentorName: '',
        scheduledAt: DateTime.now(),
        status: 'unknown',
        topic: '',
      );
}

final mentorsProvider = FutureProvider<List<MentorProfile>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/mentorship/mentors');
    final data = response.data['data'] as List;
    return data.map((item) => MentorProfile.fromJson(item)).toList();
  } catch (e) {
    return [];
  }
});

final myBookingsProvider = FutureProvider<List<Booking>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/mentorship/bookings/mine');
    final data = response.data['data'] as List;
    return data.map((item) => Booking.fromJson(item)).toList();
  } catch (e) {
    return [];
  }
});
