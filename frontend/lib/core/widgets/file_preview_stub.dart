import 'package:flutter/widgets.dart';

Widget buildFilePreview({
  required String url,
  required String mimeType,
  required String title,
}) {
  return const Center(
    child: Padding(
      padding: EdgeInsets.all(24),
      child: Text('In-app preview is available in the web build.'),
    ),
  );
}
