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

    test('rejects Office, archives and CAD binaries', () {
      expect(
        canPreviewInApp(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ),
        isFalse,
      );
      expect(canPreviewInApp('application/zip'), isFalse);
      expect(canPreviewInApp('application/octet-stream'), isFalse);
    });
  });
}
