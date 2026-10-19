import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:campusos/core/config/api_config.dart';

class ApiService {
  late final Dio _dio;
  String? _accessToken;
  String? _refreshToken;
  String _universityId = '';
  String _baseUrl;

  /// Called when a 401 proves the session is unrecoverable (refresh token
  /// missing/empty or the refresh call itself was rejected). The owner flips
  /// the auth state so the router redirects to login instead of leaving an
  /// authenticated shell that 401s every request.
  void Function()? onSessionExpired;

  ApiService({String? baseUrl})
      : _baseUrl = baseUrl ?? ApiConfig.baseUrl {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.addAll([
      _AuthInterceptor(this),
      _LogInterceptor(),
      _RetryInterceptor(),
    ]);
  }

  void setTokens({required String accessToken, required String refreshToken}) {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    _dio.options.headers['Authorization'] = 'Bearer $accessToken';
  }

  void setUniversityId(String id) {
    _universityId = id;
    _dio.options.headers['X-University-ID'] = id;
  }

  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;
  String get universityId => _universityId;
  Dio get dio => _dio;

  void clearTokens() {
    _accessToken = null;
    _refreshToken = null;
  }

  Options _injectAuth(Options? options) {
    final opts = options ?? Options();
    opts.headers ??= {};
    if (_accessToken != null) {
      opts.headers!['Authorization'] = 'Bearer $_accessToken';
    }
    if (_universityId.isNotEmpty) {
      opts.headers!['X-University-ID'] = _universityId;
    }
    return opts;
  }

  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? queryParameters, Options? options, Duration? timeout}) {
    return _dio.get(path, queryParameters: queryParameters, options: _withTimeout(_injectAuth(options), timeout));
  }

  /// Live enrollments (with published grades) for the signed-in student.
  Future<List<dynamic>> getMyEnrollments() async {
    final res = await get<dynamic>('/api/v1/academics/enrollments', timeout: const Duration(seconds: 10));
    final data = res.data;
    if (data is List) return data;
    if (data is Map && data['data'] is List) return List<dynamic>.from(data['data'] as List);
    return const [];
  }

  /// Live weekly timetable entries (filtered client-side to enrolled courses).
  Future<List<dynamic>> getMyTimetable() async {
    final res = await get<dynamic>('/api/v1/academics/timetable', timeout: const Duration(seconds: 10));
    final data = res.data;
    if (data is List) return data;
    if (data is Map && data['data'] is List) return List<dynamic>.from(data['data'] as List);
    return const [];
  }

  // ---- Admin content management -------------------------------------------

  Future<List<dynamic>> adminListContent(String type) async {
    final res = await get<dynamic>('/api/v1/admin/content/$type', timeout: const Duration(seconds: 20));
    final data = res.data;
    if (data is List) return data;
    if (data is Map && data['data'] is List) return List<dynamic>.from(data['data'] as List);
    return const [];
  }

  Future<Map<String, dynamic>> adminCreateContent(String type, Map<String, dynamic> body) async {
    final res = await post<dynamic>('/api/v1/admin/content/$type', data: body, timeout: const Duration(seconds: 25));
    final data = res.data;
    if (data is Map && data['data'] is Map) return Map<String, dynamic>.from(data['data'] as Map);
    if (data is Map) return Map<String, dynamic>.from(data);
    return <String, dynamic>{};
  }

  Future<Map<String, dynamic>> adminUpdateContent(String type, String id, Map<String, dynamic> body) async {
    final res = await patch<dynamic>('/api/v1/admin/content/$type/$id', data: body, timeout: const Duration(seconds: 25));
    final data = res.data;
    if (data is Map && data['data'] is Map) return Map<String, dynamic>.from(data['data'] as Map);
    return data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};
  }

  Future<void> adminDeleteContent(String type, String id) async {
    await delete<dynamic>('/api/v1/admin/content/$type/$id', timeout: const Duration(seconds: 20));
  }

  /// Uploads a file (image or document) and returns the public URL path.
  Future<String> adminUpload(String filename, List<int> bytes) async {
    final form = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: filename),
    });
    final res = await _dio.post<dynamic>(
      '/api/v1/admin/uploads',
      data: form,
      options: _withTimeout(_injectAuth(null), const Duration(seconds: 60))..contentType = 'multipart/form-data',
    );
    final data = res.data;
    final inner = (data is Map && data['data'] is Map) ? data['data'] as Map : data as Map;
    return (inner['url'] ?? '').toString();
  }

  Future<Response<T>> post<T>(String path, {dynamic data, Map<String, dynamic>? queryParameters, Options? options, Duration? timeout}) {
    return _dio.post(path, data: data, queryParameters: queryParameters, options: _withTimeout(_injectAuth(options), timeout));
  }

  Future<Response<T>> put<T>(String path, {dynamic data, Options? options, Duration? timeout}) {
    return _dio.put(path, data: data, options: _withTimeout(_injectAuth(options), timeout));
  }

  Future<Response<T>> patch<T>(String path, {dynamic data, Options? options, Duration? timeout}) {
    return _dio.patch(path, data: data, options: _withTimeout(_injectAuth(options), timeout));
  }

  Future<Response<T>> delete<T>(String path, {Options? options, Duration? timeout}) {
    return _dio.delete(path, options: _withTimeout(_injectAuth(options), timeout));
  }

  /// Overrides the receive timeout for a single request (e.g. AI calls that
  /// legitimately take longer than the default 15s). Leaves other requests
  /// using the base timeout unchanged.
  Options _withTimeout(Options? options, Duration? timeout) {
    final opts = options ?? Options();
    if (timeout != null) {
      // On web, dio's adapter uses connectTimeout as a "no response headers
      // yet" deadline (it aborts whenever readyState < HEADERS_RECEIVED when
      // it fires). Our AI endpoints send no headers until generation finishes
      // (25-65s), so the base 15s connectTimeout killed every long request
      // with response==null even though receiveTimeout was overridden.
      opts.connectTimeout = timeout;
      opts.receiveTimeout = timeout;
      opts.sendTimeout = timeout;
    }
    return opts;
  }
}

class _AuthInterceptor extends Interceptor {
  final ApiService _apiService;
  bool _isRefreshing = false;

  _AuthInterceptor(this._apiService);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (_apiService.accessToken != null) {
      options.headers['Authorization'] = 'Bearer ${_apiService.accessToken}';
    }
    if (_apiService.universityId.isNotEmpty) {
      options.headers['X-University-ID'] = _apiService.universityId;
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Never attempt a refresh from the refresh call itself: the refresh
    // endpoint returns 401 on an invalid token, and retrying here would
    // recurse forever (each pass logging another console error).
    final isRefreshCall =
        err.requestOptions.uri.path.endsWith('/auth/refresh');
    final canRefresh = err.response?.statusCode == 401 &&
        (_apiService.refreshToken?.isNotEmpty ?? false) &&
        !isRefreshCall &&
        !_isRefreshing;

    if (canRefresh) {
      _isRefreshing = true;
      try {
        final response = await _apiService._dio.post('/api/v1/auth/refresh', data: {
          'refreshToken': _apiService.refreshToken,
        });
        final data = response.data['data'];
        _apiService.setTokens(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'],
        );
        err.requestOptions.headers['Authorization'] = 'Bearer ${data['accessToken']}';
        final retryResponse = await _apiService._dio.fetch(err.requestOptions);
        handler.resolve(retryResponse);
        return;
      } catch (e) {
        if (e is DioException && e.response?.statusCode == 401) {
          // The refresh call itself was rejected: the refresh token is dead
          // and the session cannot be recovered. Clear it so the user gets a
          // clean login instead of a shell that 401s every request.
          _apiService.clearTokens();
          _expireSession();
        }
        // Anything else (offline, timeout, server hiccup) must NOT destroy the
        // session: the current request simply fails and a later retry can
        // refresh again once connectivity returns.
      } finally {
        _isRefreshing = false;
      }
    } else if (err.response?.statusCode == 401 &&
        !isRefreshCall &&
        !_isRefreshing) {
      // Terminal 401: no refresh token available (or already cleared). Without
      // this the request would fail and every later call would 401 too, while
      // the UI still believed it was signed in.
      _expireSession();
    }
    handler.next(err);
  }

  void _expireSession() {
    try {
      _apiService.onSessionExpired?.call();
    } catch (_) {}
  }
}

class _LogInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (kDebugMode) {
      // ignore: avoid_print
      print('[API REQ] ${options.method} ${options.uri}');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (kDebugMode) {
      // ignore: avoid_print
      print('[API RSP] ${response.statusCode} ${response.requestOptions.uri}');
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (kDebugMode) {
      // ignore: avoid_print
      print('[API ERR] ${err.response?.statusCode} ${err.requestOptions.uri}');
    }
    handler.next(err);
  }
}

class _RetryInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.sendTimeout) {
      final retryCount = err.requestOptions.extra['retryCount'] ?? 0;
      if (retryCount < 3) {
        err.requestOptions.extra['retryCount'] = retryCount + 1;
        await Future.delayed(Duration(seconds: retryCount + 1));
        try {
          final response = await Dio().fetch(err.requestOptions);
          handler.resolve(response);
          return;
        } catch (_) {}
      }
    }
    handler.next(err);
  }
}

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});
