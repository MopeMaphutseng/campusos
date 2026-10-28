import 'package:flutter_test/flutter_test.dart';

import 'package:campusos/core/widgets/file_preview.dart';

void main() {
  group('canPreviewInApp', () {
    test('allows PDFs, images, text and code', () {
      expect(canPreviewInApp('application/pdf'), isTrue);
      expect(canPreviewInApp('image/png'), isTrue);
      expect(canPreviewInApp('image/jpeg'), isTrue);
      expect(canPreviewInApp('text/plain'), isTrue);
      expect(canPreviewInApp('text/x-c'), isTrue);
      expect(canPreviewInApp('application/xml'), isTrue);
    });

    test('allows Office documents through the online viewer', () {
      expect(
        canPreviewInApp(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ),
        isTrue,
      );
      expect(canPreviewInApp('application/vnd.ms-powerpoint'), isTrue);
      expect(
        canPreviewInApp(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ),
        isTrue,
      );
    });

    test('rejects archives and CAD binaries', () {
      expect(canPreviewInApp('application/zip'), isFalse);
      expect(canPreviewInApp('application/octet-stream'), isFalse);
    });
  });

  group('previewUrlFor', () {
    test('leaves browser-previewable files untouched', () {
      const url = 'https://api.example.com/uploads/paper.pdf';
      expect(previewUrlFor(url, 'application/pdf'), url);
    });

    test('wraps Office documents in the Office Online viewer', () {
      const url = 'https://api.example.com/uploads/a b.docx';
      final result = previewUrlFor(
        url,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      expect(
        result,
        'https://view.officeapps.live.com/op/embed.aspx?src=${Uri.encodeComponent(url)}',
      );
    });
  });
}
