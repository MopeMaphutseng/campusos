import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/routes/app_router.dart';
import 'package:campusos/core/theme/app_theme.dart';
import 'package:campusos/core/services/api_service.dart';
import 'package:campusos/core/utils/storage.dart';

enum ThemeModeOption { light, dark, system }

final themeModeProvider = StateProvider<ThemeModeOption>((ref) => ThemeModeOption.dark);

class App extends ConsumerStatefulWidget {
  const App({super.key});

  @override
  ConsumerState<App> createState() => _AppState();
}

class _AppState extends ConsumerState<App> {
  @override
  void initState() {
    super.initState();
    ref.read(apiServiceProvider).onSessionExpired = _endSession;
    _restoreSession();
  }

  /// Signs the user out when the session is unrecoverable, so the router sends
  /// them to /login instead of staying on an authenticated screen whose every
  /// request would 401. Also wipes the stored tokens: a dead refresh token must
  /// not survive a reload and lock the user into the same broken loop.
  Future<void> _endSession() async {
    try {
      await SecureStorage.clearAll();
    } catch (_) {}
    if (mounted) {
      ref.read(authStateProvider.notifier).state = false;
      ref.read(userRoleProvider.notifier).state = null;
    }
  }

  /// Restores a previously authenticated session from secure storage.
  /// Never signs in on its own: without stored tokens the user is sent to login.
  ///
  /// The stored access token only lives 15 minutes, so we validate it here and
  /// refresh it *before* marking the session authenticated. That way the first
  /// wave of API calls (dashboard, library, marketplace, messaging) never fires
  /// with a dead token and 401s. If the session can't be recovered we fall back
  /// to the login screen instead of an authenticated shell full of failures.
  Future<void> _restoreSession() async {
    try {
      final loggedIn = await SecureStorage.isLoggedIn();
      final accessToken = await SecureStorage.getAccessToken();
      if (!loggedIn || accessToken == null || accessToken.isEmpty) {
        if (mounted) {
          ref.read(authStateProvider.notifier).state = false;
        }
        return;
      }

      final api = ref.read(apiServiceProvider);
      String? refreshToken = await SecureStorage.getRefreshToken();
      final universityId = await SecureStorage.getUniversityId();

      var effectiveAccess = accessToken;

      if (_tokenExpired(accessToken)) {
        // Access token is stale. Only proceed if we can refresh it.
        if (refreshToken == null || refreshToken.isEmpty) {
          if (mounted) {
            ref.read(authStateProvider.notifier).state = false;
          }
          return;
        }
        try {
          final resp = await api.post(
            '/api/v1/auth/refresh',
            data: {'refreshToken': refreshToken},
          );
          final data = resp.data['data'];
          effectiveAccess = data['accessToken'] as String;
          final newRefresh = data['refreshToken'] as String? ?? refreshToken;
          refreshToken = newRefresh;
          await SecureStorage.saveTokens(effectiveAccess, newRefresh);
        } catch (_) {
          // Refresh rejected -> stale session: wipe it so the next launch
          // starts clean, then send the user to login.
          try {
            await SecureStorage.clearAll();
          } catch (_) {}
          if (mounted) {
            ref.read(authStateProvider.notifier).state = false;
          }
          return;
        }
      }

      api.setTokens(
        accessToken: effectiveAccess,
        refreshToken: refreshToken ?? '',
      );
      if (universityId != null && universityId.isNotEmpty) {
        api.setUniversityId(universityId);
      }
      if (mounted) {
        final role = await SecureStorage.getRole();
        ref.read(userRoleProvider.notifier).state = role ?? 'student';
        ref.read(authStateProvider.notifier).state = true;
      }
    } catch (_) {
      if (mounted) {
        ref.read(authStateProvider.notifier).state = false;
      }
    }
  }

  /// Returns true when the JWT's `exp` claim is in the past.
  /// If the token can't be parsed we assume it's valid and let the server decide.
  bool _tokenExpired(String jwt) {
    try {
      final parts = jwt.split('.');
      if (parts.length != 3) return true;
      final payload = base64Url.decode(base64Url.normalize(parts[1]));
      final decoded = json.decode(utf8.decode(payload));
      final exp = decoded['exp'];
      if (exp is int) {
        return DateTime.fromMillisecondsSinceEpoch(exp * 1000)
            .isBefore(DateTime.now());
      }
    } catch (_) {}
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final themeModeOption = ref.watch(themeModeProvider);

    ThemeMode themeMode;
    switch (themeModeOption) {
      case ThemeModeOption.light:
        themeMode = ThemeMode.light;
        break;
      case ThemeModeOption.dark:
        themeMode = ThemeMode.dark;
        break;
      case ThemeModeOption.system:
        themeMode = ThemeMode.system;
        break;
    }

    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'CampusOS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme(),
      darkTheme: AppTheme.darkTheme(),
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
