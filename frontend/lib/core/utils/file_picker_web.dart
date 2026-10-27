import 'dart:html' as html;
import 'dart:typed_data';

import 'file_picker_types.dart';

Future<PickedFile?> pickFileImpl({required bool isImage}) async {
  final input = html.FileUploadInputElement();
  input.accept = isImage
      ? 'image/*'
      : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,image/*';
  input.click();
  await input.onChange.first;
  if (input.files == null || input.files!.isEmpty) return null;
  final file = input.files!.first;
  final reader = html.FileReader();
  reader.readAsArrayBuffer(file);
  await reader.onLoad.first;
  final bytes = (reader.result as ByteBuffer).asUint8List();
  if (bytes.isEmpty) return null;
  return PickedFile(name: file.name, bytes: bytes.toList());
}
