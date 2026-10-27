import 'file_picker_stub.dart'
    if (dart.library.html) 'file_picker_web.dart';
import 'file_picker_types.dart';

export 'file_picker_types.dart';

Future<PickedFile?> pickFileForUpload({required bool isImage}) =>
    pickFileImpl(isImage: isImage);
