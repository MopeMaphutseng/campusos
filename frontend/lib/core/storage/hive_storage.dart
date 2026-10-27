import 'dart:convert';

import 'package:hive_flutter/hive_flutter.dart';

/// Lightweight, typed local persistence for offline-first reads.
///
/// Data is stored as JSON strings inside Hive boxes so we can evolve models
/// without regenerating adapters. Every read is wrapped so a corrupt entry
/// never crashes the UI.
class HiveStorage {
  static const String academicBoxName = 'academic_cache';
  static const String campusBoxName = 'campus_cache';
  static const String offlineQueueBoxName = 'offline_queue';

  static bool _initialized = false;

  static const String _timetableKey = 'timetable';
  static const String _enrollmentsKey = 'enrollments';
  static const String _performanceKey = 'performance';

  static Future<void> init() async {
    if (_initialized) return;
    await Hive.initFlutter();
    await Future.wait([
      Hive.openBox<String>(academicBoxName),
      Hive.openBox<String>(campusBoxName),
      Hive.openBox<String>(offlineQueueBoxName),
    ]);
    _initialized = true;
  }

  static Box<String> get _academic => Hive.box<String>(academicBoxName);

  static Future<void> _write(Box<String> box, String key, Object? value) async {
    if (value == null) {
      await box.delete(key);
      return;
    }
    await box.put(key, jsonEncode(value));
  }

  static dynamic _read(Box<String> box, String key) {
    final raw = box.get(key);
    if (raw == null || raw.isEmpty) return null;
    try {
      return jsonDecode(raw);
    } catch (_) {
      return null;
    }
  }

  // ---- Academics -----------------------------------------------------------

  static Future<void> cacheTimetable(List<dynamic> entries) =>
      _write(_academic, _timetableKey, entries);

  static List<dynamic>? getCachedTimetable() {
    final v = _read(_academic, _timetableKey);
    return v is List ? List<dynamic>.from(v) : null;
  }

  static Future<void> cacheEnrollments(List<dynamic> enrollments) =>
      _write(_academic, _enrollmentsKey, enrollments);

  static List<dynamic>? getCachedEnrollments() {
    final v = _read(_academic, _enrollmentsKey);
    return v is List ? List<dynamic>.from(v) : null;
  }

  static Future<void> cachePerformance(Map<String, dynamic> summary) =>
      _write(_academic, _performanceKey, summary);

  static Map<String, dynamic>? getCachedPerformance() {
    final v = _read(_academic, _performanceKey);
    return v is Map ? Map<String, dynamic>.from(v) : null;
  }

  static DateTime? lastAcademicSync() {
    final raw = _academic.get('last_sync');
    if (raw == null) return null;
    return DateTime.tryParse(raw);
  }

  static Future<void> markAcademicSynced() =>
      _academic.put('last_sync', DateTime.now().toIso8601String());

  // ---- Generic campus cache ------------------------------------------------

  static Future<void> putCampus(String key, Object? value) =>
      _write(Hive.box<String>(campusBoxName), key, value);

  static dynamic getCampus(String key) =>
      _read(Hive.box<String>(campusBoxName), key);

  // ---- Offline action queue ------------------------------------------------

  static Future<void> enqueueAction(Map<String, dynamic> action) async {
    final box = Hive.box<String>(offlineQueueBoxName);
    final id = DateTime.now().microsecondsSinceEpoch.toString();
    await box.put(id, jsonEncode({...action, 'queuedAt': DateTime.now().toIso8601String()}));
  }

  static List<Map<String, dynamic>> pendingActions() {
    final box = Hive.box<String>(offlineQueueBoxName);
    final result = <Map<String, dynamic>>[];
    for (final key in box.keys) {
      final raw = box.get(key);
      if (raw == null) continue;
      try {
        final decoded = jsonDecode(raw);
        if (decoded is Map) {
          result.add({'__id': key, ...Map<String, dynamic>.from(decoded)});
        }
      } catch (_) {}
    }
    return result;
  }

  static Future<void> clearPendingActions() async {
    await Hive.box<String>(offlineQueueBoxName).clear();
  }

  static Future<void> removePendingAction(String id) async {
    await Hive.box<String>(offlineQueueBoxName).delete(id);
  }

  static Future<void> clearAcademicCache() async {
    await _academic.clear();
  }
}
