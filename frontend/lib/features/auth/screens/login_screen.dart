import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/core/services/api_service.dart';
import 'package:campusos/core/routes/app_router.dart';
import 'package:campusos/core/utils/storage.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _universityController = TextEditingController();
  bool _obscurePassword = true;
  String? _selectedUniversity;
  bool _isLoading = false;
  String? _error;
  bool _rememberMe = false;

  @override
  void initState() {
    super.initState();
    _loadSavedCredentials();
  }

  Future<void> _loadSavedCredentials() async {
    final rememberMe = await SecureStorage.getRememberMe();
    if (!rememberMe) return;
    final email = await SecureStorage.getRememberedEmail();
    final password = await SecureStorage.getRememberedPassword();
    final university = await SecureStorage.getRememberedUniversity();
    if (mounted) {
      setState(() {
        _rememberMe = true;
        if (email != null) _emailController.text = email;
        if (password != null) _passwordController.text = password;
        if (university != null) {
          _selectedUniversity = university;
          _universityController.text = university;
        }
      });
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _universityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 60),
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    gradient: AppColors.heroGradient,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.school_rounded, color: Colors.white, size: 32),
                ),
              ),
              const SizedBox(height: 24),
              Center(
                child: Text(
                  'CampusOS',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  'Your Campus, Connected',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ),
              const SizedBox(height: 40),
              Text('University', style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 8),
              TextField(
                controller: _universityController,
                decoration: InputDecoration(
                  hintText: 'Search your university...',
                  prefixIcon: const Icon(LucideIcons.building, size: 18),
                  prefixIconConstraints: const BoxConstraints(minWidth: 44),
                  suffixIcon: const Icon(LucideIcons.chevronDown, size: 18),
                ),
                onTap: () => _showUniversityPicker(context),
                readOnly: true,
              ),
              const SizedBox(height: 20),
              Text('Email', style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 8),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  hintText: 'you@university.edu.ls',
                  prefixIcon: Icon(LucideIcons.mail, size: 18),
                ),
              ),
              const SizedBox(height: 20),
              Text('Password', style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 8),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  hintText: 'Enter your password',
                  prefixIcon: const Icon(LucideIcons.lock, size: 18),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
                      size: 18,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  SizedBox(
                    height: 24,
                    width: 24,
                    child: Checkbox(
                      value: _rememberMe,
                      onChanged: (v) => setState(() => _rememberMe = v ?? false),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => setState(() => _rememberMe = !_rememberMe),
                    child: Text('Remember me', style: Theme.of(context).textTheme.bodySmall),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () {
                      final emailCtrl = TextEditingController();
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        builder: (ctx) => Padding(
                          padding: EdgeInsets.only(
                            bottom: MediaQuery.of(ctx).viewInsets.bottom,
                            left: 20, right: 20, top: 12,
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Center(
                                child: Container(width: 40, height: 4,
                                  decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2))),
                              ),
                              const SizedBox(height: 16),
                              Text('Reset Password', style: Theme.of(ctx).textTheme.titleMedium),
                              const SizedBox(height: 16),
                              TextField(
                                controller: emailCtrl,
                                decoration: const InputDecoration(
                                  hintText: 'Enter your email address',
                                  prefixIcon: Icon(LucideIcons.mail, size: 18),
                                ),
                                keyboardType: TextInputType.emailAddress,
                              ),
                              const SizedBox(height: 16),
                              SizedBox(
                                width: double.infinity,
                                child: CampusButton(
                                  label: 'Send Reset Link',
                                  onPressed: () {
                                    Navigator.pop(ctx);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Password reset link sent to your email')),
                                    );
                                  },
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],
                          ),
                        ),
                      );
                    },
                    child: const Text('Forgot password?'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              CampusButton(
                label: 'Sign In',
                isLoading: _isLoading,
                onPressed: _handleLogin,
                icon: LucideIcons.logIn,
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
              ],
              const SizedBox(height: 24),
              Row(
                children: [
                  const Expanded(child: Divider()),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'or',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  const Expanded(child: Divider()),
                ],
              ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    builder: (ctx) => Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Center(
                          child: Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12, bottom: 8),
                            decoration: BoxDecoration(color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark), borderRadius: BorderRadius.circular(2))),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Text('Sign in with SSO', style: Theme.of(ctx).textTheme.titleMedium),
                        ),
                        ListTile(
                          leading: const Icon(LucideIcons.globe, color: AppColors.primaryAccent),
                          title: const Text('Google'),
                          trailing: const Icon(LucideIcons.chevronRight, size: 18),
                          onTap: () {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Google SSO login initiated')),
                            );
                          },
                        ),
                        ListTile(
                          leading: const Icon(LucideIcons.monitor, color: AppColors.tertiaryAccent),
                          title: const Text('Microsoft'),
                          trailing: const Icon(LucideIcons.chevronRight, size: 18),
                          onTap: () {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Microsoft SSO login initiated')),
                            );
                          },
                        ),
                        ListTile(
                          leading: const Icon(LucideIcons.code, color: AppColors.textPrimary),
                          title: const Text('GitHub'),
                          trailing: const Icon(LucideIcons.chevronRight, size: 18),
                          onTap: () {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('GitHub SSO login initiated')),
                            );
                          },
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  );
                },
                icon: const Icon(LucideIcons.shield, size: 18),
                label: const Text('Continue with University SSO'),
              ),
              const SizedBox(height: 40),
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Don't have an account? ",
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    GestureDetector(
                      onTap: () => context.go('/register'),
                      child: Text(
                        'Register',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.primaryAccent,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Center(
                child: Text(
                  'By continuing, you agree to our Terms & Privacy Policy',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleLogin() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      setState(() => _error = 'Please fill in all fields');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final universityId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      api.setUniversityId(universityId);
      final response = await api.post('/api/v1/auth/login',
          options: Options(headers: {'X-University-ID': universityId}),
          data: {
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
        'universityId': 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      });

      final data = response.data['data'];
      await SecureStorage.saveTokens(data['accessToken'], data['refreshToken']);
      await SecureStorage.saveUniversityId(data['user']['universityId']);
      await SecureStorage.saveUserId(data['user']['id']);
      final role = (data['user']['role'] ?? 'student').toString();
      final fullName = '${data['user']['firstName'] ?? ''} ${data['user']['lastName'] ?? ''}'.trim();
      await SecureStorage.saveRole(role);
      await SecureStorage.saveUserIdentity(
        name: fullName.isEmpty ? null : fullName,
        email: (data['user']['email'] ?? _emailController.text.trim()).toString(),
      );
      await SecureStorage.saveLoginState();
      await SecureStorage.saveRememberedCredentials(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        universityName: _selectedUniversity,
        rememberMe: _rememberMe,
      );

      api.setTokens(accessToken: data['accessToken'], refreshToken: data['refreshToken']);
      api.setUniversityId(data['user']['universityId']);

      ref.read(userRoleProvider.notifier).state = role;
      ref.read(authStateProvider.notifier).state = true;

      if (!mounted) return;
      if (data['emailVerificationRequired'] == true) {
        context.go('/verify-email');
      } else if (role == 'admin' || role == 'super_admin') {
        context.go('/admin');
      } else {
        context.go('/');
      }
    } catch (e) {
      setState(() => _error = 'Invalid credentials. Please try again.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showUniversityPicker(BuildContext context) {
    final universities = [
      'National University of Lesotho (NUL)',
      'Lesotho Institute of Management (LIM)',
      'Limkokwing University',
      'St. Augustine College',
      'All Nations University',
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        minChildSize: 0.3,
        maxChildSize: 0.7,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.skeletonBase(isDark: Theme.of(context).brightness == Brightness.dark),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Select University', style: Theme.of(context).textTheme.titleMedium),
            ),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                itemCount: universities.length,
                itemBuilder: (context, index) {
                  return ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.primaryAccent.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(LucideIcons.building, color: AppColors.primaryAccent, size: 20),
                    ),
                    title: Text(universities[index]),
                    trailing: _selectedUniversity == universities[index]
                        ? const Icon(LucideIcons.check, color: AppColors.primaryAccent, size: 20)
                        : null,
                    onTap: () {
                      setState(() => _selectedUniversity = universities[index]);
                      _universityController.text = universities[index];
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
