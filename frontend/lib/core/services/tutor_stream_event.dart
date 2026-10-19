/// A single event emitted by the streaming AI tutor endpoint.
///
/// The backend sends Server-Sent Events shaped like:
///   data: {"type":"token","content":"..."}
///   data: {"type":"done","tokensUsed":123}
///   data: {"type":"error","message":"..."}
class AiStreamEvent {
  final String type;
  final String? content;
  final int tokensUsed;
  final String? error;

  const AiStreamEvent({
    required this.type,
    this.content,
    this.tokensUsed = 0,
    this.error,
  });

  bool get isToken => type == 'token';
  bool get isDone => type == 'done';
  bool get isReady => type == 'ready';
  bool get isError => type == 'error';

  factory AiStreamEvent.fromJson(Map<String, dynamic> json) {
    return AiStreamEvent(
      type: (json['type'] ?? 'token').toString(),
      content: json['content']?.toString(),
      tokensUsed: (json['tokensUsed'] as num?)?.toInt() ?? 0,
      error: json['message']?.toString(),
    );
  }
}
