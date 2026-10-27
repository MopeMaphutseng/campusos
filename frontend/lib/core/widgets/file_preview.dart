import 'package:flutter/widgets.dart';

import 'file_preview_stub.dart' if (dart.library.html) 'file_preview_web.dart'
    as impl;

/// True for file types the browser can render inside an embedded frame.
bool canPreviewInApp(String mimeType) {
  final mime = mimeType.toLowerCase();
  return mime == 'application/pdf' ||
      mime == 'application/xml' ||
      mime == 'application/json' ||
      mime == 'application/sql' ||
      mime.startsWith('image/') ||
      mime.startsWith('text/');
}

/// Renders [url] in an embedded browser frame (web) or a fallback message.
Widget buildFilePreview({
  required String url,
  required String mimeType,
  required String title,
}) {
  return impl.buildFilePreview(url: url, mimeType: mimeType, title: title);
}
