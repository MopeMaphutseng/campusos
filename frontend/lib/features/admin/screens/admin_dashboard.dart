import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/services/api_service.dart';
import 'package:campusos/core/utils/storage.dart';
import 'package:campusos/core/utils/file_picker_helper.dart';
import 'package:campusos/core/routes/app_router.dart';

class _ContentType {
  final String key;
  final String label;
  final IconData icon;
  const _ContentType(this.key, this.label, this.icon);
}

const _contentTypes = <_ContentType>[
  _ContentType('library', 'Library & Past Papers', LucideIcons.bookOpen),
  _ContentType('scholarship', 'Scholarships', LucideIcons.graduationCap),
  _ContentType('job', 'Jobs & Internships', LucideIcons.briefcase),
  _ContentType('research', 'Research', LucideIcons.flaskConical),
  _ContentType('location', 'Campus Map', LucideIcons.mapPin),
  _ContentType('news', 'News', LucideIcons.newspaper),
  _ContentType('seminar', 'Events & Seminars', LucideIcons.calendarDays),
  _ContentType('mentor', 'Mentors', LucideIcons.users),
];

enum _FieldKind { text, multiline, number, boolean, date, image, document }

class _Field {
  final String key;
  final String label;
  final _FieldKind kind;
  final bool required;
  final String? hint;
  final dynamic initial;
  const _Field(this.key, this.label, this.kind,
      {this.required = false, this.hint, this.initial});
}

List<_Field> _fieldsFor(String type) {
  switch (type) {
    case 'library':
      return const [
        _Field('title', 'Title', _FieldKind.text, required: true),
        _Field('description', 'Description', _FieldKind.multiline),
        _Field('faculty', 'Faculty', _FieldKind.text,
            required: true, initial: 'Science & Technology'),
        _Field('courseCode', 'Course code (e.g. CS101)', _FieldKind.text),
        _Field('topic', 'Topic', _FieldKind.text),
        _Field('type', 'Item type', _FieldKind.text, initial: 'document',
            hint: 'textbook / notes / video / document / link'),
        _Field('fileUrl', 'Document upload', _FieldKind.document),
        _Field('externalUrl', 'External link', _FieldKind.text),
      ];
    case 'scholarship':
      return const [
        _Field('title', 'Title', _FieldKind.text, required: true),
        _Field('description', 'Description', _FieldKind.multiline, required: true),
        _Field('amount', 'Amount', _FieldKind.number, initial: '0'),
        _Field('currency', 'Currency', _FieldKind.text, initial: 'USD'),
        _Field('type', 'Type', _FieldKind.text, initial: 'merit'),
        _Field('status', 'Status', _FieldKind.text, initial: 'open',
            hint: 'draft / open / closed / awarded'),
        _Field('deadline', 'Deadline', _FieldKind.date),
        _Field('availableSlots', 'Available slots', _FieldKind.number, initial: '1'),
        _Field('applicationUrl', 'Application URL', _FieldKind.text),
        _Field('providerName', 'Provider name', _FieldKind.text),
      ];
    case 'job':
      return const [
        _Field('title', 'Title', _FieldKind.text, required: true),
        _Field('description', 'Description', _FieldKind.multiline, required: true),
        _Field('company', 'Company', _FieldKind.text),
        _Field('companyLogoUrl', 'Company logo', _FieldKind.image),
        _Field('location', 'Location', _FieldKind.text),
        _Field('type', 'Type', _FieldKind.text, initial: 'full_time',
            hint: 'internship / part_time / full_time / contract'),
        _Field('status', 'Status', _FieldKind.text, initial: 'active',
            hint: 'draft / active / closed'),
        _Field('deadline', 'Deadline', _FieldKind.date),
        _Field('salaryMin', 'Salary min', _FieldKind.number),
        _Field('salaryMax', 'Salary max', _FieldKind.number),
        _Field('isRemote', 'Remote', _FieldKind.boolean),
        _Field('skills', 'Skills (comma separated)', _FieldKind.text),
      ];
    case 'research':
      return const [
        _Field('title', 'Title', _FieldKind.text, required: true),
        _Field('description', 'Description', _FieldKind.multiline, required: true),
        _Field('department', 'Department', _FieldKind.text),
        _Field('field', 'Field', _FieldKind.text),
        _Field('type', 'Type', _FieldKind.text, initial: 'ra_position',
            hint: 'ra_position / thesis_supervisor / collaboration / funding'),
        _Field('status', 'Status', _FieldKind.text, initial: 'open'),
        _Field('deadline', 'Deadline', _FieldKind.date),
        _Field('positionsAvailable', 'Positions available', _FieldKind.number, initial: '1'),
        _Field('requiredSkills', 'Required skills (comma separated)', _FieldKind.text),
      ];
    case 'location':
      return const [
        _Field('name', 'Name', _FieldKind.text, required: true),
        _Field('description', 'Description', _FieldKind.multiline),
        _Field('type', 'Type', _FieldKind.text, initial: 'academic',
            hint: 'academic / residential / dining / sports / library / admin'),
        _Field('latitude', 'Latitude', _FieldKind.number, required: true, initial: '-29.4503'),
        _Field('longitude', 'Longitude', _FieldKind.number, required: true, initial: '27.4745'),
        _Field('building', 'Building', _FieldKind.text),
        _Field('floor', 'Floor', _FieldKind.text),
        _Field('room', 'Room', _FieldKind.text),
        _Field('imageUrl', 'Photo', _FieldKind.image),
      ];
    case 'news':
      return const [
        _Field('title', 'Headline', _FieldKind.text, required: true),
        _Field('content', 'Content', _FieldKind.multiline, required: true),
        _Field('summary', 'Summary', _FieldKind.multiline),
        _Field('category', 'Category', _FieldKind.text, initial: 'campus',
            hint: 'campus / academic / sports / events / achievements'),
        _Field('imageUrl', 'Cover image', _FieldKind.image),
        _Field('isPublished', 'Published', _FieldKind.boolean, initial: true),
      ];
    case 'seminar':
      return const [
        _Field('title', 'Title', _FieldKind.text, required: true),
        _Field('description', 'Description', _FieldKind.multiline),
        _Field('type', 'Type', _FieldKind.text, initial: 'seminar',
            hint: 'seminar / workshop / competition / conference / hackathon'),
        _Field('status', 'Status', _FieldKind.text, initial: 'open'),
        _Field('location', 'Venue', _FieldKind.text),
        _Field('startDate', 'Start date', _FieldKind.date),
        _Field('endDate', 'End date', _FieldKind.date),
        _Field('organizerName', 'Organizer', _FieldKind.text),
        _Field('maxParticipants', 'Max participants', _FieldKind.number),
        _Field('isFeatured', 'Featured', _FieldKind.boolean),
        _Field('imageUrl', 'Banner image', _FieldKind.image),
      ];
    case 'mentor':
      return const [
        _Field('firstName', 'First name', _FieldKind.text, required: true),
        _Field('lastName', 'Last name', _FieldKind.text),
        _Field('email', 'Email', _FieldKind.text, required: true),
        _Field('bio', 'Bio', _FieldKind.multiline),
        _Field('expertise', 'Expertise (comma separated)', _FieldKind.text),
        _Field('maxMentees', 'Max mentees', _FieldKind.number, initial: '10'),
      ];
    default:
      return const [];
  }
}

class AdminDashboard extends ConsumerStatefulWidget {
  const AdminDashboard({super.key});

  @override
  ConsumerState<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends ConsumerState<AdminDashboard> {
  bool _checkingRole = true;
  bool _isAdmin = false;
  int _selected = 0;

  List<dynamic> _items = const [];
  bool _loading = false;
  String? _error;

  String get _type => _contentTypes[_selected].key;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final admin = await SecureStorage.isAdmin();
    if (!mounted) return;
    setState(() {
      _isAdmin = admin;
      _checkingRole = false;
    });
    if (admin) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await ref.read(apiServiceProvider).adminListContent(_type);
      if (!mounted) return;
      setState(() {
        _items = items;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not load content. $e';
        _loading = false;
      });
    }
  }

  void _selectType(int i) {
    setState(() => _selected = i);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (_checkingRole) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (!_isAdmin) return _buildAccessDenied(context);

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('CampusOS Admin'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _loading ? null : _load,
            icon: const Icon(LucideIcons.refreshCw),
          ),
          IconButton(
            tooltip: 'Log out',
            onPressed: () async {
              await SecureStorage.clearAll();
              ref.read(userRoleProvider.notifier).state = null;
              ref.read(authStateProvider.notifier).state = false;
              if (mounted) context.go('/login');
            },
            icon: const Icon(LucideIcons.logOut),
          ),
        ],
      ),
      floatingActionButton: _isAdmin
          ? FloatingActionButton.extended(
              onPressed: () => _openCreateForm(),
              icon: const Icon(LucideIcons.plus),
              label: const Text('Upload'),
            )
          : null,
      body: Column(
        children: [
          _buildTypeSelector(isDark),
          Expanded(child: _buildContentArea(isDark)),
        ],
      ),
    );
  }

  Widget _buildAccessDenied(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(LucideIcons.shieldAlert, size: 56, color: AppColors.error),
                const SizedBox(height: 16),
                Text('Administrator access required',
                    style: Theme.of(context).textTheme.titleLarge,
                    textAlign: TextAlign.center),
                const SizedBox(height: 8),
                const Text(
                  'Sign in with an administrator account to manage CampusOS content.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () async {
                    await SecureStorage.clearAll();
                    ref.read(userRoleProvider.notifier).state = null;
                    ref.read(authStateProvider.notifier).state = false;
                    if (context.mounted) context.go('/login');
                  },
                  child: const Text('Go to sign in'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTypeSelector(bool isDark) {
    return SizedBox(
      height: 56,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        itemCount: _contentTypes.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final t = _contentTypes[i];
          final selected = i == _selected;
          return ChoiceChip(
            selected: selected,
            onSelected: (_) => _selectType(i),
            avatar: Icon(t.icon, size: 16,
                color: selected ? Colors.white : AppColors.textSecondary),
            label: Text(t.label),
            labelStyle: TextStyle(
              color: selected ? Colors.white : AppColors.textSecondary,
              fontSize: 12,
            ),
            selectedColor: AppColors.primaryAccent,
            backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
          );
        },
      ),
    );
  }

  Widget _buildContentArea(bool isDark) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: _load, child: const Text('Retry')),
          ],
        ),
      );
    }
    if (_items.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.inbox, size: 48, color: AppColors.textSecondary),
            const SizedBox(height: 12),
            Text('No ${_contentTypes[_selected].label} yet'),
            const SizedBox(height: 4),
            const Text('Use the Upload button to add the first one.',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          ],
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 96),
      itemCount: _items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) => _buildItemCard(_items[i], isDark),
    );
  }

  String _titleOf(Map<String, dynamic> m) =>
      (m['title'] ?? m['name'] ?? m['userName'] ?? 'Untitled').toString();

  String _subtitleOf(Map<String, dynamic> m) {
    final parts = <String>[];
    for (final k in ['courseCode', 'company', 'department', 'category', 'type',
        'status', 'location']) {
      final v = m[k];
      if (v != null && v.toString().isNotEmpty) parts.add(v.toString());
    }
    if (m['deadline'] != null) parts.add('due ${m['deadline'].toString().split('T').first}');
    return parts.take(4).join('  •  ');
  }

  Widget _buildItemCard(dynamic raw, bool isDark) {
    final m = Map<String, dynamic>.from(raw as Map);
    final targets = (m['targetCourseCodes'] as List?)?.cast<String>() ?? const [];
    return Card(
      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.withValues(alpha: 0.15)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_titleOf(m),
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                  const SizedBox(height: 2),
                  Text(_subtitleOf(m),
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: targets.isEmpty
                        ? [
                            Chip(
                              label: const Text('All students', style: TextStyle(fontSize: 10)),
                              padding: EdgeInsets.zero,
                              visualDensity: VisualDensity.compact,
                              backgroundColor: AppColors.success.withValues(alpha: 0.15),
                            ),
                          ]
                        : targets
                            .map((c) => Chip(
                                  label: Text(c, style: const TextStyle(fontSize: 10)),
                                  padding: EdgeInsets.zero,
                                  visualDensity: VisualDensity.compact,
                                  backgroundColor: AppColors.primaryAccent.withValues(alpha: 0.15),
                                ))
                            .toList(),
                  ),
                ],
              ),
            ),
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  tooltip: 'Edit',
                  icon: const Icon(LucideIcons.pencil, size: 18, color: AppColors.primaryAccent),
                  onPressed: () =>
                      _openEditForm(m).then((changed) { if (changed == true) _load(); }),
                ),
                IconButton(
                  tooltip: 'Delete',
                  icon: const Icon(LucideIcons.trash2, size: 18, color: AppColors.error),
                  onPressed: () => _confirmDelete(m['id'].toString()),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDelete(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete this item?'),
        content: const Text('Students will no longer see it. This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(apiServiceProvider).adminDeleteContent(_type, id);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $e')));
      }
    }
  }

  Future<void> _openCreateForm() async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).brightness == Brightness.dark
          ? AppColors.surfaceDark
          : AppColors.surfaceLight,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _ContentForm(type: _type, typeLabel: _contentTypes[_selected].label),
    );
    if (created == true) _load();
  }

  Future<bool?> _openEditForm(Map<String, dynamic> item) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).brightness == Brightness.dark
          ? AppColors.surfaceDark
          : AppColors.surfaceLight,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _ContentForm(
        type: _type,
        typeLabel: _contentTypes[_selected].label,
        existing: item,
      ),
    );
  }
}

class _ContentForm extends ConsumerStatefulWidget {
  final String type;
  final String typeLabel;
  final Map<String, dynamic>? existing;
  const _ContentForm({required this.type, required this.typeLabel, this.existing});

  bool get isEditing => existing != null;

  @override
  ConsumerState<_ContentForm> createState() => _ContentFormState();
}

class _ContentFormState extends ConsumerState<_ContentForm> {
  late final List<_Field> _fields = _fieldsFor(widget.type);
  final _controllers = <String, TextEditingController>{};
  final _bools = <String, bool>{};
  final _files = <String, Map<String, dynamic>>{};
  final _targets = TextEditingController();
  bool _submitting = false;
  String? _error;

  String? _existingText(String key) {
    final v = widget.existing?[key];
    if (v == null) return null;
    if (v is List) return v.join(', ');
    return v.toString();
  }

  @override
  void initState() {
    super.initState();
    final ex = widget.existing;
    for (final f in _fields) {
      if (f.kind == _FieldKind.text ||
          f.kind == _FieldKind.multiline ||
          f.kind == _FieldKind.number ||
          f.kind == _FieldKind.date) {
        _controllers[f.key] =
            TextEditingController(text: _existingText(f.key) ?? f.initial?.toString() ?? '');
      }
      if (f.kind == _FieldKind.boolean) {
        _bools[f.key] = ex != null ? (ex[f.key] == true) : (f.initial == true);
      }
      if (f.kind == _FieldKind.image || f.kind == _FieldKind.document) {
        final url = ex?[f.key];
        if (url != null && url.toString().isNotEmpty) {
          _files[f.key] = {
            'url': url.toString(),
            'name': url.toString().split('/').last,
          };
        }
      }
    }
    if (ex != null) {
      final targets = (ex['targetCourseCodes'] as List?)?.cast<dynamic>() ?? const [];
      _targets.text = targets.map((e) => e.toString()).join(', ');
    }
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    _targets.dispose();
    super.dispose();
  }

  Future<void> _pickFile(_Field f) async {
    PickedFile? picked;
    try {
      picked = await pickFileForUpload(isImage: f.kind == _FieldKind.image);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('File pick not available: $e')));
      }
      return;
    }
    if (picked == null || picked.bytes.isEmpty) return;
    final file = picked;
    try {
      final url = await ref
          .read(apiServiceProvider)
          .adminUpload(file.name, file.bytes);
      if (!mounted) return;
      setState(() => _files[f.key] = {'url': url, 'name': file.name});
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Upload failed: $e')));
      }
    }
  }

  Future<void> _pickDate(_Field f) async {
    final current = _controllers[f.key]!.text;
    DateTime initial = DateTime.now();
    if (current.isNotEmpty) {
      initial = DateTime.tryParse(current) ?? initial;
    }
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      _controllers[f.key]!.text = picked.toIso8601String();
    }
  }

  List<String> _csv(String v) =>
      v.split(',').map((s) => s.trim()).filterNotEmpty().toList();

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final body = <String, dynamic>{};
      for (final f in _fields) {
        if (f.kind == _FieldKind.boolean) {
          body[f.key] = _bools[f.key];
        } else if (f.kind == _FieldKind.image || f.kind == _FieldKind.document) {
          final file = _files[f.key];
          if (file != null) body[f.key] = file['url'];
        } else {
          final text = _controllers[f.key]!.text.trim();
          if (text.isEmpty) continue;
          if (f.kind == _FieldKind.number) {
            final n = num.tryParse(text);
            if (n == null) throw 'Field "${f.label}" must be a number';
            body[f.key] = n;
          } else if (f.key == 'expertise' ||
              f.key == 'skills' ||
              f.key == 'requiredSkills') {
            body[f.key] = _csv(text);
          } else {
            body[f.key] = text;
          }
          if (f.required && (body[f.key] == null)) {
            throw 'Field "${f.label}" is required';
          }
        }
        if (f.required && body[f.key] == null) {
          throw 'Field "${f.label}" is required';
        }
      }
      body['targetCourseCodes'] = _csv(_targets.text);

      final api = ref.read(apiServiceProvider);
      if (widget.isEditing) {
        await api.adminUpdateContent(widget.type, widget.existing!['id'].toString(), body);
      } else {
        await api.adminCreateContent(widget.type, body);
      }
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _submitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.9,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                        widget.isEditing
                            ? 'Edit in ${widget.typeLabel}'
                            : 'Upload to ${widget.typeLabel}',
                        style: Theme.of(context).textTheme.titleLarge),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context, false),
                    icon: const Icon(LucideIcons.x),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (final f in _fields) _buildField(f),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _targets,
                      decoration: const InputDecoration(
                        labelText: 'Target course codes (optional)',
                        helperText:
                            'e.g. CS101, CS205 — leave empty to show to ALL students',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(LucideIcons.target),
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!,
                          style: const TextStyle(color: AppColors.error, fontSize: 13)),
                    ],
                    const SizedBox(height: 20),
                    SizedBox(
                      height: 48,
                      child: FilledButton(
                        onPressed: _submitting ? null : _submit,
                        child: _submitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white))
                            : Text(widget.isEditing ? 'Save changes' : 'Publish'),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(_Field f) {
    if (f.kind == _FieldKind.boolean) {
      return SwitchListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(f.label),
        value: _bools[f.key] ?? false,
        onChanged: (v) => setState(() => _bools[f.key] = v),
      );
    }
    if (f.kind == _FieldKind.image || f.kind == _FieldKind.document) {
      final file = _files[f.key];
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: OutlinedButton.icon(
          onPressed: () => _pickFile(f),
          icon: Icon(f.kind == _FieldKind.image
              ? LucideIcons.imagePlus
              : LucideIcons.fileUp),
          label: Text(file == null
              ? '${f.label}${f.required ? ' *' : ''}'
              : 'Attached: ${file['name']}'),
        ),
      );
    }
    if (f.kind == _FieldKind.date) {
      final c = _controllers[f.key]!;
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextField(
          controller: c,
          readOnly: true,
          onTap: () => _pickDate(f),
          decoration: InputDecoration(
            labelText: '${f.label}${f.required ? ' *' : ''}',
            hintText: 'Tap to choose a date',
            border: const OutlineInputBorder(),
            prefixIcon: const Icon(LucideIcons.calendar),
            suffixIcon: IconButton(
              icon: const Icon(LucideIcons.x, size: 16),
              onPressed: () => c.clear(),
            ),
          ),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: _controllers[f.key],
        keyboardType: f.kind == _FieldKind.number
            ? const TextInputType.numberWithOptions(decimal: true)
            : TextInputType.text,
        maxLines: f.kind == _FieldKind.multiline ? 4 : 1,
        decoration: InputDecoration(
          labelText: '${f.label}${f.required ? ' *' : ''}',
          hintText: f.hint,
          border: const OutlineInputBorder(),
        ),
      ),
    );
  }
}

extension _FilterNotEmpty on Iterable<String> {
  Iterable<String> filterNotEmpty() => where((s) => s.isNotEmpty);
}
