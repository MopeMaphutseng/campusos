import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/services/api_service.dart';

enum CredentialType { badge, certificate, transcript, enrollmentProof, skill, achievement }

enum CredentialStatus { active, revoked, expired }

class Credential {
  final String id;
  final String name;
  final String? description;
  final CredentialType type;
  final CredentialStatus status;
  final String issuanceDate;
  final String? expirationDate;
  final String issuerDid;
  final String? holderDid;
  final String? credentialUrl;
  final String? courseCode;
  final String? skill;
  final double? score;
  final String? qrCodeData;

  Credential({
    required this.id,
    required this.name,
    this.description,
    required this.type,
    required this.status,
    required this.issuanceDate,
    this.expirationDate,
    required this.issuerDid,
    this.holderDid,
    this.credentialUrl,
    this.courseCode,
    this.skill,
    this.score,
    this.qrCodeData,
  });

  factory Credential.fromJson(Map<String, dynamic> json) {
    return Credential(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      type: CredentialType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => CredentialType.badge,
      ),
      status: CredentialStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => CredentialStatus.active,
      ),
      issuanceDate: json['issuanceDate'] ?? '',
      expirationDate: json['expirationDate'],
      issuerDid: json['issuerDid'] ?? '',
      holderDid: json['holderDid'],
      credentialUrl: json['credentialUrl'],
      courseCode: json['courseCode'],
      skill: json['skill'],
      score: json['score'] != null ? double.tryParse(json['score'].toString()) : null,
      qrCodeData: json['qrCodeData'],
    );
  }

  bool get isActive => status == CredentialStatus.active;
  bool get isExpired => status == CredentialStatus.expired;
  String get statusLabel => status.name[0].toUpperCase() + status.name.substring(1);
}

final myCredentialsProvider = FutureProvider<List<Credential>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final response = await api.get('/api/v1/verifiable-credentials/me');
    final data = response.data['data'] as List;
    return data.map((item) => Credential.fromJson(item)).toList();
  } catch (e) {
    return [];
  }
});
