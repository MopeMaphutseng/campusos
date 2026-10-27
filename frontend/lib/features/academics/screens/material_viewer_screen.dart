import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:campusos/core/config/api_config.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/file_preview.dart';

class MaterialViewerScreen extends StatefulWidget {
  final String title;
  final String courseCode;
  final String category;
  final String fileUrl;
  final String mimeType;
  final int sizeBytes;

  const MaterialViewerScreen({
    super.key,
    required this.title,
    required this.courseCode,
    required this.category,
    required this.fileUrl,
    required this.mimeType,
    required this.sizeBytes,
  });

  @override
  State<MaterialViewerScreen> createState() => _MaterialViewerScreenState();
}

class _MaterialViewerScreenState extends State<MaterialViewerScreen> {
  late final String _absoluteUrl;
  late final Widget _preview;

  @override
  void initState() {
    super.initState();
    _absoluteUrl = '${ApiConfig.baseUrl}${widget.fileUrl}';
    _preview = canPreviewInApp(widget.mimeType)
        ? buildFilePreview(
            url: _absoluteUrl,
            mimeType: widget.mimeType,
            title: widget.title,
          )
        : _UnsupportedPreview(onOpen: _openExternally);
  }

  Future<void> _openExternally() async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      final opened = await launchUrl(
        Uri.parse(_absoluteUrl),
        mode: LaunchMode.externalApplication,
      );
      if (!opened) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Could not open this file.')),
        );
      }
    } catch (_) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Could not open this file.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            tooltip: 'Open in browser',
            icon: const Icon(LucideIcons.globe, size: 18),
            onPressed: _openExternally,
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              border: Border(
                bottom: BorderSide(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.06)
                      : Colors.grey.withValues(alpha: 0.12),
                ),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primaryAccent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    widget.courseCode,
                    style: const TextStyle(
                      color: AppColors.primaryAccent,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '${_label(widget.category)} · ${_formatSize(widget.sizeBytes)}',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: AppColors.textSecondary),
                  ),
                ),
              ],
            ),
          ),
          Expanded(child: _preview),
        ],
      ),
    );
  }
}

String _label(String value) {
  if (value.isEmpty) return 'Material';
  final words = value.replaceAll('_', ' ').trim();
  return words[0].toUpperCase() + words.substring(1);
}

String _formatSize(int bytes) {
  if (bytes <= 0) return '';
  if (bytes >= 1024 * 1024) {
    return '${(bytes / 1024 / 1024).toStringAsFixed(1)} MB';
  }
  if (bytes >= 1024) return '${(bytes / 1024).toStringAsFixed(0)} KB';
  return '$bytes B';
}

class _UnsupportedPreview extends StatelessWidget {
  final VoidCallback onOpen;

  const _UnsupportedPreview({required this.onOpen});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppColors.primaryAccent.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                LucideIcons.file,
                size: 30,
                color: AppColors.primaryAccent,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'This file type cannot be previewed in the app.',
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              'Open it in your browser to view or download it.',
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onOpen,
              icon: const Icon(LucideIcons.globe, size: 16),
              label: const Text('Open file'),
            ),
          ],
        ),
      ),
    );
  }
}
