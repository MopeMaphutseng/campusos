import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/services/api_service.dart';
import 'package:campusos/core/services/tutor_stream.dart';
import 'package:campusos/core/services/tutor_stream_event.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

class AiTutorScreen extends ConsumerStatefulWidget {
  const AiTutorScreen({super.key});

  @override
  ConsumerState<AiTutorScreen> createState() => _AiTutorScreenState();
}

class _AiTutorScreenState extends ConsumerState<AiTutorScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  bool _integrityMode = false;
  String? _selectedCourse = 'CS301 – Data Structures';
  bool _isTyping = false;
  bool _sending = false;
  String? _sessionId;

  final _messages = <_ChatMessage>[
    _ChatMessage(
      text: 'Hi! I\'m CampusGPT. Ask me anything about your course material and I\'ll answer using your library resources.',
      isUser: false,
      timestamp: 'Now',
    ),
  ];

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<String> _ensureSession() async {
    if (_sessionId != null) return _sessionId!;
    final api = ref.read(apiServiceProvider);
    final course = _selectedCourse;
    final response = await api.post(
      '/api/v1/ai-tutor/sessions',
      data: {
        'mode': 'study',
        'integrityMode': _integrityMode ? 'open' : 'normal',
        if (course != null) 'courseCode': course.split(' \u2013 ').first,
      },
      timeout: const Duration(seconds: 180),
    );
    _sessionId = response.data['data']['id'] as String;
    return _sessionId!;
  }

  String _errorText(DioException e) {
    final status = e.response?.statusCode;
    if (status == 401 || status == 403) {
      return 'Your session has expired. Please sign in again.';
    }
    final data = e.response?.data;
    if (data is Map && data['message'] != null) {
      return 'AI unavailable: ${data['message']}';
    }
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout) {
      return 'AI unavailable: cannot reach the server.';
    }
    if (e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return 'The AI took too long to respond. Please try again.';
    }
    return 'AI unavailable. Please try again.';
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;

    setState(() {
      _messages.add(_ChatMessage(text: text, isUser: true, timestamp: 'Now'));
      _controller.clear();
      _isTyping = true;
      _sending = true;
    });
    _scrollToEnd();

    String sessionId;
    try {
      sessionId = await _ensureSession();
    } on DioException catch (e) {
      _failWith(_errorText(e));
      return;
    }

    // Prefer true token-by-token streaming (web). On platforms without a
    // browser transport the stream is empty and we fall back to the blocking
    // request below, so this is strictly additive.
    var streamed = false;
    try {
      streamed = await _streamReply(sessionId, text);
    } catch (_) {
      streamed = false;
    }
    if (streamed) return;

    await _sendBlocking(sessionId, text);
  }

  _ChatMessage _addStreamingMessage() {
    final msg = _ChatMessage(
      text: '',
      isUser: false,
      timestamp: 'Now',
      isStreaming: true,
    );
    setState(() {
      _isTyping = false;
      _messages.add(msg);
    });
    _scrollToEnd();
    return msg;
  }

  /// Streams the reply, appending tokens to the last bubble as they arrive.
  /// Returns true if any content was delivered (so the caller skips the
  /// blocking request); false means nothing arrived and the caller should fall
  /// back.
  Future<bool> _streamReply(String sessionId, String content) async {
    final api = ref.read(apiServiceProvider);
    final headers = <String, String>{
      'Authorization': 'Bearer ${api.accessToken ?? ''}',
      'X-University-ID': api.universityId,
    };

    _ChatMessage? streaming;
    var gotToken = false;

    final stream = streamTutorReply(
      baseUrl: api.dio.options.baseUrl,
      path: '/api/v1/ai-tutor/sessions/$sessionId/messages/stream',
      headers: headers,
      jsonBody: jsonEncode({'content': content}),
    );

    try {
      await for (final AiStreamEvent event in stream) {
        if (event.isReady) {
          setState(() => _isTyping = false);
          continue;
        }
        if (event.isToken) {
          gotToken = true;
          streaming ??= _addStreamingMessage();
          setState(() {
            streaming!.text += event.content ?? '';
          });
          _scrollToEnd();
          continue;
        }
        if (event.isError) {
          if (!gotToken) {
            // Nothing shown yet: let the blocking path surface a proper error.
            throw StateError(event.error ?? 'stream failed');
          }
          setState(() {
            streaming?.isStreaming = false;
            streaming?.isError = true;
            if (event.error != null && event.error!.isNotEmpty) {
              streaming?.text = event.error!;
            }
          });
          break;
        }
        if (event.isDone) break;
      }
    } catch (_) {
      if (!gotToken) return false;
    }

    if (!gotToken) return false;

    setState(() {
      streaming?.isStreaming = false;
      if (streaming != null && streaming.text.trim().isEmpty) {
        streaming.text = 'The tutor returned an empty response.';
      }
      _isTyping = false;
      _sending = false;
    });
    _scrollToEnd();
    return true;
  }

  Future<void> _sendBlocking(String sessionId, String text) async {
    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.post(
        '/api/v1/ai-tutor/sessions/$sessionId/messages',
        data: {'content': text},
        timeout: const Duration(seconds: 180),
      );
      final data = response.data['data'] ?? {};
      final reply = (data['reply'] ?? '').toString();
      final provider = data['provider']?.toString();
      final notice = data['integrityNotice']?.toString();
      setState(() {
        _isTyping = false;
        _sending = false;
        _messages.add(_ChatMessage(
          text: reply.isEmpty ? 'The tutor returned an empty response.' : reply,
          isUser: false,
          timestamp: provider == null ? 'Now' : 'Now · $provider',
          notice: notice,
        ));
      });
    } on DioException catch (e) {
      _failWith(_errorText(e));
    }
    _scrollToEnd();
  }

  void _failWith(String message) {
    setState(() {
      _isTyping = false;
      _sending = false;
      _messages.add(_ChatMessage(
        text: message,
        isUser: false,
        timestamp: 'Now',
        isError: true,
      ));
    });
    _scrollToEnd();
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    gradient: AppColors.heroGradient,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(LucideIcons.sparkles, color: Colors.white, size: 14),
                ),
                const SizedBox(width: 8),
                Text('CampusGPT', style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          _buildCourseSelector(context, isDark),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              border: Border(
                bottom: BorderSide(
                  color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08),
                ),
              ),
            ),
            child: Row(
              children: [
                Icon(LucideIcons.shield, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 6),
                Text('Integrity Mode:', style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11)),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => setState(() => _integrityMode = !_integrityMode),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _integrityMode
                          ? AppColors.tertiaryAccent.withValues(alpha: 0.15)
                          : AppColors.warning.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      _integrityMode ? 'Explain Only' : 'Full Solve',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: _integrityMode ? AppColors.tertiaryAccent : AppColors.warning,
                      ),
                    ),
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.info.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.brain, size: 10, color: AppColors.info),
                      const SizedBox(width: 3),
                      Text('AI', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.info)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              physics: const BouncingScrollPhysics(),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length) return _typingIndicator(isDark);
                final msg = _messages[index];
                return _BubbleEntrance(
                  key: ObjectKey(msg),
                  child: _messageBubble(msg, isDark),
                );
              },
            ),
          ),
          _buildInputBar(context, isDark),
        ],
      ),
    );
  }

  Widget _buildCourseSelector(BuildContext context, bool isDark) {
    return PopupMenuButton<String>(
      onSelected: (v) => setState(() => _selectedCourse = v),
      itemBuilder: (context) => [
        const PopupMenuItem(value: 'CS301 – Data Structures', child: Text('CS301 – Data Structures')),
        const PopupMenuItem(value: 'CS305 – Software Eng.', child: Text('CS305 – Software Eng.')),
        const PopupMenuItem(value: 'MATH201 – Linear Algebra', child: Text('MATH201 – Linear Algebra')),
        const PopupMenuItem(value: 'CS310 – AI', child: Text('CS310 – AI')),
      ],
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.primaryAccent.withValues(alpha: isDark ? 0.15 : 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _selectedCourse?.split(' – ').first ?? 'Select Course',
              style: TextStyle(
                color: AppColors.primaryAccent,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 4),
            Icon(LucideIcons.chevronDown, size: 12, color: AppColors.primaryAccent),
          ],
        ),
      ),
    );
  }

  Widget _messageBubble(_ChatMessage msg, bool isDark) {
    return Align(
      alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          bottom: 12,
          left: msg.isUser ? 60 : 0,
          right: msg.isUser ? 0 : 60,
        ),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: msg.isUser
              ? AppColors.primaryAccent
              : (isDark ? AppColors.surfaceDark : AppColors.surfaceLight),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(msg.isUser ? 16 : 4),
            bottomRight: Radius.circular(msg.isUser ? 4 : 16),
          ),
          border: msg.isUser
              ? null
              : Border.all(
                  color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08),
                ),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadowColor(isDark: isDark),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              msg.text,
              style: TextStyle(
                color: msg.isUser
                    ? Colors.white
                    : msg.isError
                        ? AppColors.error
                        : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimary),
                fontSize: 14,
                height: 1.5,
              ),
            ),
            if (msg.notice != null && msg.notice!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(LucideIcons.shield, size: 12, color: AppColors.warning),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      msg.notice!,
                      style: TextStyle(fontSize: 11, color: AppColors.warning),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  msg.timestamp,
                  style: TextStyle(
                    fontSize: 10,
                    color: msg.isUser
                        ? Colors.white.withValues(alpha: 0.6)
                        : AppColors.textSecondary,
                  ),
                ),
                if (msg.isStreaming) ...[
                  const SizedBox(width: 8),
                  _streamingCaret(msg.isUser),
                ],
                if (!msg.isUser && !msg.isStreaming && !msg.isError && msg.text.trim().isNotEmpty) ...[
                  const Spacer(),
                  const SizedBox(width: 8),
                  _copyButton(msg.text),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _typingIndicator(bool isDark) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12, right: 60),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _dot(0),
            const SizedBox(width: 4),
            _dot(1),
            const SizedBox(width: 4),
            _dot(2),
          ],
        ),
      ),
    );
  }

  Widget _dot(int index) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 600 + index * 200),
      builder: (context, value, child) {
        return Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: AppColors.primaryAccent.withValues(alpha: value),
            shape: BoxShape.circle,
          ),
        );
      },
    );
  }

  Widget _streamingCaret(bool isUser) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.2, end: 1.0),
      duration: const Duration(milliseconds: 700),
      curve: Curves.easeInOut,
      builder: (context, value, child) {
        return Container(
          width: 6,
          height: 12,
          decoration: BoxDecoration(
            color: (isUser ? Colors.white : AppColors.primaryAccent)
                .withValues(alpha: value),
            borderRadius: BorderRadius.circular(2),
          ),
        );
      },
    );
  }

  Widget _copyButton(String text) {
    return InkWell(
      borderRadius: BorderRadius.circular(4),
      onTap: () async {
        await Clipboard.setData(ClipboardData(text: text));
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Copied to clipboard'), duration: Duration(seconds: 1)),
        );
      },
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: Icon(LucideIcons.copy, size: 13, color: AppColors.textSecondary),
      ),
    );
  }

  Widget _buildInputBar(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        border: Border(
          top: BorderSide(
            color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08),
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              onSubmitted: (_) => _sendMessage(),
              decoration: InputDecoration(
                hintText: 'Ask CampusGPT...',
                prefixIcon: const Icon(LucideIcons.messageCircle, size: 18),
                prefixIconConstraints: const BoxConstraints(minWidth: 40),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.grey.shade200,
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.grey.shade200,
                  ),
                ),
                filled: true,
                fillColor: isDark
                    ? AppColors.backgroundDark
                    : AppColors.backgroundLight,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Container(
            decoration: BoxDecoration(
              gradient: AppColors.heroGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              onPressed: _sendMessage,
              icon: const Icon(LucideIcons.send, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}

class _BubbleEntrance extends StatefulWidget {
  final Widget child;
  const _BubbleEntrance({super.key, required this.child});

  @override
  State<_BubbleEntrance> createState() => _BubbleEntranceState();
}

class _BubbleEntranceState extends State<_BubbleEntrance>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 220),
  )..forward();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final curved = CurvedAnimation(parent: _c, curve: Curves.easeOutCubic);
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween<Offset>(begin: const Offset(0, 0.12), end: Offset.zero)
            .animate(curved),
        child: widget.child,
      ),
    );
  }
}

class _ChatMessage {
  String text;
  final bool isUser;
  final String timestamp;
  final String? notice;
  bool isError;
  bool isStreaming;

  _ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.notice,
    this.isError = false,
    this.isStreaming = false,
  });
}
