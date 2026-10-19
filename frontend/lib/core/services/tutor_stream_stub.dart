import 'tutor_stream_event.dart';

/// Fallback used on platforms without a browser fetch/XHR (e.g. mobile).
///
/// Returns an empty stream; callers detect the empty result and fall back to
/// the regular (non-streaming) request. This keeps the streaming path strictly
/// additive: it can never break the existing behaviour.
Stream<AiStreamEvent> streamTutorReply({
  required String baseUrl,
  required String path,
  required Map<String, String> headers,
  required String jsonBody,
}) {
  return const Stream<AiStreamEvent>.empty();
}
