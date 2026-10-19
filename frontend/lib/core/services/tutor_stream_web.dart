import 'dart:async';
import 'dart:convert';
import 'dart:js_interop';
import 'package:web/web.dart' as web;

import 'tutor_stream_event.dart';

/// Streams the AI tutor reply on the web platform.
///
/// Dio's web adapter buffers the whole XHR response, so it cannot stream. We use
/// a raw [web.XMLHttpRequest] instead: with the default (text) response type the
/// browser exposes partial `responseText` as chunks arrive, which we parse into
/// Server-Sent Events on the fly. This yields true token-by-token streaming in
/// the browser without pulling in extra native packages.
Stream<AiStreamEvent> streamTutorReply({
  required String baseUrl,
  required String path,
  required Map<String, String> headers,
  required String jsonBody,
}) {
  final controller = StreamController<AiStreamEvent>();

  web.XMLHttpRequest? request;
  try {
    request = web.XMLHttpRequest();
    request.open('POST', '$baseUrl$path');
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Accept', 'text/event-stream');

    headers.forEach((key, value) {
      if (value.isNotEmpty) request!.setRequestHeader(key, value);
    });

    var offset = 0;
    var pending = '';

    void handleFrame(String raw) {
      final data = raw
          .split('\n')
          .where((line) => line.startsWith('data:'))
          .map((line) => line.substring(5).trimLeft())
          .join('\n');
      if (data.isEmpty) return;
      try {
        final map = jsonDecode(data) as Map<String, dynamic>;
        final event = AiStreamEvent.fromJson(map);
        if (!controller.isClosed) controller.add(event);
      } catch (_) {
        // Ignore malformed frame; never break the stream.
      }
    }

    void drain() {
      final text = request!.responseText;
      if (text.length <= offset) return;
      pending += text.substring(offset);
      offset = text.length;
      var idx = pending.indexOf('\n\n');
      while (idx >= 0) {
        final frame = pending.substring(0, idx);
        pending = pending.substring(idx + 2);
        handleFrame(frame);
        idx = pending.indexOf('\n\n');
      }
    }

    request.onprogress = ((web.Event _) => drain()).toJS;
    request.onload = ((web.Event _) {
      drain();
      if (!controller.isClosed) controller.close();
    }).toJS;
    request.onerror = ((web.Event _) {
      if (!controller.isClosed) {
        controller.addError(StateError('Network error while streaming reply'));
        controller.close();
      }
    }).toJS;

    request.send(jsonBody.toJS);
  } catch (e) {
    controller.addError(e);
    controller.close();
  }

  controller.onCancel = () {
    request?.abort();
  };

  return controller.stream;
}
