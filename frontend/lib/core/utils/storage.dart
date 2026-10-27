import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _secureStorage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';
  static const _refreshKey = 'refresh_token';
  static const _universityKey = 'university_id';
  static const _userIdKey = 'user_id';
  static const _loggedInKey = 'is_logged_in';

  static Future<void> saveTokens(String accessToken, String refreshToken) async {
    try {
      await _secureStorage.write(key: _tokenKey, value: accessToken);
      await _secureStorage.write(key: _refreshKey, value: refreshToken);
    } catch (_) {}
  }

  static Future<String?> getAccessToken() async {
    try {
      final t = await _secureStorage.read(key: _tokenKey);
      if (t != null && t.isNotEmpty) return t;
    } catch (_) {}
    return null;
  }

  static Future<String?> getRefreshToken() async {
    try {
      final t = await _secureStorage.read(key: _refreshKey);
      if (t != null && t.isNotEmpty) return t;
    } catch (_) {}
    return null;
  }

  static Future<void> saveUniversityId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_universityKey, id);
  }

  static Future<String?> getUniversityId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_universityKey);
  }

  static Future<void> saveUserId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userIdKey, id);
  }

  static Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userIdKey);
  }

  static const _roleKey = 'user_role';
  static const _userNameKey = 'user_name';
  static const _userEmailKey = 'user_email';

  static Future<void> saveRole(String role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_roleKey, role);
  }

  static Future<String?> getRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_roleKey);
  }

  static Future<bool> isAdmin() async {
    final role = await getRole();
    return role == 'admin' || role == 'super_admin';
  }

  static Future<void> saveUserIdentity({String? name, String? email}) async {
    final prefs = await SharedPreferences.getInstance();
    if (name != null) await prefs.setString(_userNameKey, name);
    if (email != null) await prefs.setString(_userEmailKey, email);
  }

  static Future<String?> getUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userNameKey);
  }

  static Future<void> saveLoginState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_loggedInKey, true);
  }

  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_loggedInKey) ?? false;
  }

  static const _rememberedEmailKey = 'remembered_email';
  static const _rememberedPasswordKey = 'remembered_password';
  static const _rememberedUniversityKey = 'remembered_university';
  static const _rememberMeKey = 'remember_me';

  static Future<void> saveRememberedCredentials({
    required String email,
    required String password,
    required String? universityName,
    required bool rememberMe,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_rememberMeKey, rememberMe);
    if (rememberMe) {
      await prefs.setString(_rememberedEmailKey, email);
      try {
        await _secureStorage.write(key: _rememberedPasswordKey, value: password);
      } catch (_) {}
      if (universityName != null) {
        await prefs.setString(_rememberedUniversityKey, universityName);
      }
    } else {
      await prefs.remove(_rememberedEmailKey);
      try {
        await _secureStorage.delete(key: _rememberedPasswordKey);
      } catch (_) {}
      await prefs.remove(_rememberedUniversityKey);
    }
  }

  static Future<bool> getRememberMe() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_rememberMeKey) ?? false;
  }

  static Future<String?> getRememberedEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_rememberedEmailKey);
  }

  static Future<String?> getRememberedPassword() async {
    try {
      final p = await _secureStorage.read(key: _rememberedPasswordKey);
      if (p != null && p.isNotEmpty) return p;
    } catch (_) {}
    return null;
  }

  static Future<String?> getRememberedUniversity() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_rememberedUniversityKey);
  }

  static Future<void> clearAll() async {
    try {
      await _secureStorage.deleteAll();
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}

class OfflineCache {
  static const _timetableKey = 'cached_timetable';
  static const _materialsKey = 'cached_materials';
  static const _profileKey = 'cached_profile';

  static Future<void> cacheTimetable(dynamic timetable) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_timetableKey, timetable.toString());
  }

  static Future<String?> getCachedTimetable() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_timetableKey);
  }

  static Future<void> cacheMaterials(dynamic materials) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_materialsKey, materials.toString());
  }

  static Future<String?> getCachedMaterials() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_materialsKey);
  }

  static Future<void> cacheProfile(dynamic profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_profileKey, profile.toString());
  }

  static Future<String?> getCachedProfile() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_profileKey);
  }
}
