import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';

enum ThemeModeOption { light, dark, system }

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  String _language = 'English';
  ThemeModeOption _themeMode = ThemeModeOption.system;
  bool _pushNotifications = true;
  bool _emailNotifications = true;
  bool _smsNotifications = false;
  bool _twoFactorAuth = false;

  final _profileFields = const [
    ('Full Name', 'Thabo Mosia'),
    ('Email', 't.mosia@nul.ls'),
    ('Student ID', 'NUL-2024-CS-0042'),
    ('Phone', '+266 5700 1234'),
    ('Faculty', 'Faculty of Science'),
    ('Department', 'Computer Science'),
    ('Program', 'B.Sc. Computer Science'),
    ('Year of Study', '3rd Year'),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              title: Text('Settings', style: Theme.of(context).textTheme.headlineSmall),
            ),
            SliverToBoxAdapter(child: _buildProfileHeader(context, isDark)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: SectionHeader(title: 'Profile Information'),
              ),
            ),
            SliverToBoxAdapter(child: _buildProfileSection(context, isDark)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: SectionHeader(title: 'Preferences'),
              ),
            ),
            SliverToBoxAdapter(child: _buildPreferencesSection(context, isDark)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: SectionHeader(title: 'Account'),
              ),
            ),
            SliverToBoxAdapter(child: _buildAccountSection(context, isDark)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: SectionHeader(title: 'Security'),
              ),
            ),
            SliverToBoxAdapter(child: _buildSecuritySection(context, isDark)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: SectionHeader(title: 'About'),
              ),
            ),
            SliverToBoxAdapter(child: _buildAboutSection(context, isDark)),
            SliverToBoxAdapter(child: _buildSignOutButton(context)),
            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader(BuildContext context, bool isDark) {
    return CampusCard(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Row(
        children: [
          const UserAvatar(initials: 'TM', size: 64),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Thabo Mosia',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 2),
                Text(
                  't.mosia@nul.ls',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 4),
                StatusBadge.success('Verified Student'),
              ],
            ),
          ),
          CampusIconButton(
            icon: LucideIcons.pencil,
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Demo: Edit profile form'),
                duration: Duration(seconds: 1),
              ),
            ),
            tooltip: 'Edit Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildProfileSection(BuildContext context, bool isDark) {
    return CampusCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Column(
        children: _profileFields.map((field) {
          return ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primaryAccent.withValues(alpha: isDark ? 0.15 : 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                _profileIcon(field.$1),
                size: 18,
                color: AppColors.primaryAccent,
              ),
            ),
            title: Text(field.$2, style: Theme.of(context).textTheme.bodyMedium),
            subtitle: Text(field.$1, style: Theme.of(context).textTheme.bodySmall),
            trailing: const Icon(LucideIcons.chevronRight, size: 18),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPreferencesSection(BuildContext context, bool isDark) {
    return CampusCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Column(
        children: [
          ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.secondaryAccent.withValues(alpha: isDark ? 0.15 : 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(LucideIcons.languages, size: 18, color: AppColors.secondaryAccent),
            ),
            title: Text('Language', style: Theme.of(context).textTheme.bodyMedium),
            subtitle: Text(_language, style: Theme.of(context).textTheme.bodySmall),
            trailing: const Icon(LucideIcons.chevronRight, size: 18),
            onTap: () => _showLanguagePicker(context),
          ),
          const Divider(height: 1, indent: 60),
          ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primaryAccent.withValues(alpha: isDark ? 0.15 : 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(LucideIcons.palette, size: 18, color: AppColors.primaryAccent),
            ),
            title: Text('Theme', style: Theme.of(context).textTheme.bodyMedium),
            subtitle: Text(_themeLabel, style: Theme.of(context).textTheme.bodySmall),
            trailing: const Icon(LucideIcons.chevronRight, size: 18),
            onTap: () => _showThemePicker(context),
          ),
          const Divider(height: 1, indent: 60),
          _notificationToggle(
            context,
            icon: LucideIcons.bell,
            iconColor: AppColors.tertiaryAccent,
            title: 'Push Notifications',
            value: _pushNotifications,
            onChanged: (v) => setState(() => _pushNotifications = v),
            isDark: isDark,
          ),
          _notificationToggle(
            context,
            icon: LucideIcons.mail,
            iconColor: AppColors.info,
            title: 'Email Notifications',
            value: _emailNotifications,
            onChanged: (v) => setState(() => _emailNotifications = v),
            isDark: isDark,
          ),
          _notificationToggle(
            context,
            icon: LucideIcons.smartphone,
            iconColor: AppColors.secondaryAccent,
            title: 'SMS Notifications',
            value: _smsNotifications,
            onChanged: (v) => setState(() => _smsNotifications = v),
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildAccountSection(BuildContext context, bool isDark) {
    return CampusCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Column(
        children: [
          ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: isDark ? 0.15 : 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(LucideIcons.lock, size: 18, color: AppColors.warning),
            ),
            title: Text('Change Password', style: Theme.of(context).textTheme.bodyMedium),
            subtitle: Text('Last changed 3 months ago', style: Theme.of(context).textTheme.bodySmall),
            trailing: const Icon(LucideIcons.chevronRight, size: 18),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
          ),
          const Divider(height: 1, indent: 60),
          ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.tertiaryAccent.withValues(alpha: isDark ? 0.15 : 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(LucideIcons.link, size: 18, color: AppColors.tertiaryAccent),
            ),
            title: Text('Linked Accounts', style: Theme.of(context).textTheme.bodyMedium),
            subtitle: Text('Google, Microsoft SSO', style: Theme.of(context).textTheme.bodySmall),
            trailing: const Icon(LucideIcons.chevronRight, size: 18),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
          ),
          const Divider(height: 1, indent: 60),
          ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: isDark ? 0.15 : 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(LucideIcons.shieldCheck, size: 18, color: AppColors.success),
            ),
            title: Text('Verification Status', style: Theme.of(context).textTheme.bodyMedium),
            subtitle: Row(
              children: [
                StatusBadge.success('Verified'),
                const SizedBox(width: 6),
                Text('ID & Student', style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
            trailing: const Icon(LucideIcons.chevronRight, size: 18),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
          ),
        ],
      ),
    );
  }

  Widget _buildSecuritySection(BuildContext context, bool isDark) {
    return CampusCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Column(
        children: [
          _notificationToggle(
            context,
            icon: LucideIcons.shield,
            iconColor: AppColors.primaryAccent,
            title: 'Two-Factor Authentication',
            subtitle: 'Add an extra layer of security',
            value: _twoFactorAuth,
            onChanged: (v) => setState(() => _twoFactorAuth = v),
            isDark: isDark,
          ),
          const Divider(height: 1, indent: 60),
          ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.info.withValues(alpha: isDark ? 0.15 : 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(LucideIcons.monitorSmartphone, size: 18, color: AppColors.info),
            ),
            title: Text('Active Sessions', style: Theme.of(context).textTheme.bodyMedium),
            subtitle: Text('2 devices currently active', style: Theme.of(context).textTheme.bodySmall),
            trailing: const Icon(LucideIcons.chevronRight, size: 18),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
          ),
        ],
      ),
    );
  }

  Widget _buildAboutSection(BuildContext context, bool isDark) {
    return CampusCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Column(
        children: [
          ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primaryAccent.withValues(alpha: isDark ? 0.15 : 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(LucideIcons.info, size: 18, color: AppColors.primaryAccent),
            ),
            title: Text('App Version', style: Theme.of(context).textTheme.bodyMedium),
            subtitle: Text('v2.5.0 (Build 2026.07)', style: Theme.of(context).textTheme.bodySmall),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
          ),
          const Divider(height: 1, indent: 60),
          ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.textSecondary.withValues(alpha: isDark ? 0.15 : 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(LucideIcons.fileText, size: 18, color: AppColors.textSecondary),
            ),
            title: Text('Terms of Service', style: Theme.of(context).textTheme.bodyMedium),
            trailing: const Icon(LucideIcons.chevronRight, size: 18),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
          ),
          const Divider(height: 1, indent: 60),
          ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.textSecondary.withValues(alpha: isDark ? 0.15 : 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(LucideIcons.eye, size: 18, color: AppColors.textSecondary),
            ),
            title: Text('Privacy Policy', style: Theme.of(context).textTheme.bodyMedium),
            trailing: const Icon(LucideIcons.chevronRight, size: 18),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
          ),
          const Divider(height: 1, indent: 60),
          ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.tertiaryAccent.withValues(alpha: isDark ? 0.15 : 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(LucideIcons.headphones, size: 18, color: AppColors.tertiaryAccent),
            ),
            title: Text('Contact Support', style: Theme.of(context).textTheme.bodyMedium),
            subtitle: Text('support@campusos.edu', style: Theme.of(context).textTheme.bodySmall),
            trailing: const Icon(LucideIcons.chevronRight, size: 18),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
          ),
        ],
      ),
    );
  }

  Widget _buildSignOutButton(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
      child: SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          onPressed: () => _showSignOutDialog(context),
          icon: const Icon(LucideIcons.logOut, size: 18),
          label: const Text('Sign Out'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.error,
            side: const BorderSide(color: AppColors.error),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
        ),
      ),
    );
  }

  Widget _notificationToggle(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    String? subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
    required bool isDark,
  }) {
    return ListTile(
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: isDark ? 0.15 : 0.08),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 18, color: iconColor),
      ),
      title: Text(title, style: Theme.of(context).textTheme.bodyMedium),
      subtitle: subtitle != null
          ? Text(subtitle, style: Theme.of(context).textTheme.bodySmall)
          : null,
      trailing: Switch.adaptive(
        value: value,
        onChanged: onChanged,
        activeColor: AppColors.primaryAccent,
      ),
    );
  }

  String get _themeLabel {
    switch (_themeMode) {
      case ThemeModeOption.light:
        return 'Light';
      case ThemeModeOption.dark:
        return 'Dark';
      case ThemeModeOption.system:
        return 'System Default';
    }
  }

  void _showLanguagePicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Select Language', style: Theme.of(context).textTheme.titleMedium),
            ),
            _bottomSheetOption('English', _language == 'English', () {
              setState(() => _language = 'English');
              Navigator.pop(context);
            }),
            _bottomSheetOption('Sesotho', _language == 'Sesotho', () {
              setState(() => _language = 'Sesotho');
              Navigator.pop(context);
            }),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showThemePicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Select Theme', style: Theme.of(context).textTheme.titleMedium),
            ),
            _bottomSheetOption('Light', _themeMode == ThemeModeOption.light, () {
              setState(() => _themeMode = ThemeModeOption.light);
              Navigator.pop(context);
            }),
            _bottomSheetOption('Dark', _themeMode == ThemeModeOption.dark, () {
              setState(() => _themeMode = ThemeModeOption.dark);
              Navigator.pop(context);
            }),
            _bottomSheetOption('System Default', _themeMode == ThemeModeOption.system, () {
              setState(() => _themeMode = ThemeModeOption.system);
              Navigator.pop(context);
            }),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _bottomSheetOption(String title, bool isSelected, VoidCallback onTap) {
    return ListTile(
      title: Text(title),
      trailing: isSelected ? const Icon(LucideIcons.check, color: AppColors.primaryAccent) : null,
      onTap: onTap,
    );
  }

  void _showSignOutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out of your account?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  IconData _profileIcon(String field) {
    switch (field) {
      case 'Full Name':
        return LucideIcons.user;
      case 'Email':
        return LucideIcons.mail;
      case 'Student ID':
        return LucideIcons.badge;
      case 'Phone':
        return LucideIcons.phone;
      case 'Faculty':
        return LucideIcons.building;
      case 'Department':
        return LucideIcons.flaskConical;
      case 'Program':
        return LucideIcons.graduationCap;
      case 'Year of Study':
        return LucideIcons.calendar;
      default:
        return LucideIcons.circle;
    }
  }
}
