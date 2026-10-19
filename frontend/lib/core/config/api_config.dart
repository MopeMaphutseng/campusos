class ApiConfig {
  ApiConfig._();

  static const String _rawBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3005',
  );

  /// Base URL for the API. A bare host (no scheme) is assumed to be HTTPS,
  /// so hosted environments can pass just the service hostname.
  static String get baseUrl {
    final url = _rawBaseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return 'https://$url';
  }

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
  static const int maxRetries = 3;
  static const int pageSize = 20;
}
