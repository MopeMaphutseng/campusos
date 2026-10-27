// ignore_for_file: avoid_web_libraries_in_flutter
import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/widgets.dart';

int _previewCounter = 0;

Widget buildFilePreview({
  required String url,
  required String mimeType,
  required String title,
}) {
  final viewType = 'campusos-file-preview-${_previewCounter++}';
  ui_web.platformViewRegistry.registerViewFactory(viewType, (int viewId) {
    final frame = html.IFrameElement()
      ..src = url
      ..style.border = 'none'
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.backgroundColor = '#ffffff';
    frame.setAttribute('title', title);
    frame.setAttribute('referrerpolicy', 'no-referrer');
    return frame;
  });

  return HtmlElementView(viewType: viewType);
}
