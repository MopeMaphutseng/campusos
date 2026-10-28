import 'package:flutter/widgets.dart';

import 'file_preview_stub.dart' if (dart.library.html) 'file_preview_web.dart'
    as impl;

const _officeMimeTypes = <String>{
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'application/rtf',
  'text/rtf',
};

bool isOfficeDocument(String mimeType) {
  return _officeMimeTypes.contains(mimeType.toLowerCase());
}

/// True for file types the browser can render inside an embedded frame.
bool canPreviewInApp(String mimeType) {
  final mime = mimeType.toLowerCase();
  return mime == 'application/pdf' ||
      mime == 'application/xml' ||
      mime == 'application/json' ||
      mime == 'application/sql' ||
      mime.startsWith('image/') ||
      mime.startsWith('text/') ||
      isOfficeDocument(mime);
}

/// Office documents are rendered through the Office Online viewer; everything
/// else is loaded directly.
String previewUrlFor(String url, String mimeType) {
  if (!isOfficeDocument(mimeType)) return url;
  final encoded = Uri.encodeComponent(url);
  return 'https://view.officeapps.live.com/op/embed.aspx?src=$encoded';
}

/// Renders [url] in an embedded browser frame (web) or a fallback message.
Widget buildFilePreview({
  required String url,
  required String mimeType,
  required String title,
}) {
  return impl.buildFilePreview(
    url: previewUrlFor(url, mimeType),
    mimeType: mimeType,
    title: title,
  );
}
