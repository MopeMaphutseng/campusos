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

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  int _currentStep = 0;
  final _pageController = PageController();

  String? _selectedUniversity;
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneController = TextEditingController();
  String? _selectedFaculty;
  String? _selectedProgram;
  int? _selectedYear;

  @override
  void dispose() {
    _pageController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  bool _isLoading = false;
  String? _error;

  void _nextStep() {
    if (_currentStep < 3) {
      setState(() => _currentStep++);
      _pageController.animateToPage(
        _currentStep,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _handleRegister();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _pageController.animateToPage(
        _currentStep,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(LucideIcons.arrowLeft, size: 20),
                onPressed: _prevStep,
              )
            : IconButton(
                icon: const Icon(LucideIcons.x, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _stepTitle,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  _stepSubtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 20),
                _buildProgressIndicator(isDark),
              ],
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                _error!,
                style: const TextStyle(color: AppColors.error, fontSize: 12),
                textAlign: TextAlign.center,
              ),
            ),
          const SizedBox(height: 16),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildStep1(context, isDark),
                _buildStep2(context, isDark),
                _buildStep3(context, isDark),
                _buildStep4(context, isDark),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String get _stepTitle {
    switch (_currentStep) {
      case 0: return 'Select University';
      case 1: return 'Personal Info';
      case 2: return 'Academic Details';
      case 3: return 'Verify Email';
      default: return '';
    }
  }

  String get _stepSubtitle {
    switch (_currentStep) {
      case 0: return 'Find and select your institution';
      case 1: return 'Tell us about yourself';
      case 2: return 'Your faculty and program info';
      case 3: return 'Check your inbox to verify';
      default: return '';
    }
  }

  Widget _buildProgressIndicator(bool isDark) {
    return Row(
      children: List.generate(4, (index) {
        final isActive = index <= _currentStep;
        final isCurrent = index == _currentStep;
        return Expanded(
          child: Row(
            children: [
              Expanded(
                child: Container(
                  height: 4,
                  decoration: BoxDecoration(
                    color: isActive
                        ? AppColors.primaryAccent
                        : Colors.grey.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              if (index < 3) const SizedBox(width: 4),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildStep1(BuildContext context, bool isDark) {
    final universities = [
      'National University of Lesotho (NUL)',
      'Lesotho Institute of Management (LIM)',
      'Limkokwing University',
      'St. Augustine College',
      'All Nations University',
    ];

    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 24),
      children: [
        const SizedBox(height: 24),
        Center(
          child: GestureDetector(
            onTap: () => context.go('/login'),
            child: Text.rich(
              TextSpan(
                text: 'Already have an account? ',
                style: Theme.of(context).textTheme.bodySmall,
                children: [
                  TextSpan(
                    text: 'Sign In',
                    style: TextStyle(
                      color: AppColors.primaryAccent,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        const SizedBox(height: 8),
        TextField(
          decoration: const InputDecoration(
            hintText: 'Search universities...',
            prefixIcon: Icon(LucideIcons.search, size: 18),
          ),
        ),
        const SizedBox(height: 16),
        ...universities.map((uni) => CampusCard(
              padding: const EdgeInsets.all(14),
              onTap: () {
                setState(() => _selectedUniversity = uni);
                _nextStep();
              },
              isHighlighted: _selectedUniversity == uni,
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.primaryAccent.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(LucideIcons.building, color: AppColors.primaryAccent, size: 20),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(uni, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontSize: 13)),
                  ),
                  Icon(Icons.chevron_right, size: 20, color: AppColors.textSecondary),
                ],
              ),
            )),
      ],
    );
  }

  Widget _buildStep2(BuildContext context, bool isDark) {
    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 24),
      children: [
        const SizedBox(height: 8),
        Text('First Name', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 8),
        TextField(
          controller: _firstNameController,
          decoration: const InputDecoration(
            hintText: 'e.g. Thabo',
            prefixIcon: Icon(LucideIcons.user, size: 18),
          ),
        ),
        const SizedBox(height: 16),
        Text('Last Name', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 8),
        TextField(
          controller: _lastNameController,
          decoration: const InputDecoration(
            hintText: 'e.g. Molefe',
            prefixIcon: Icon(LucideIcons.user, size: 18),
          ),
        ),
        const SizedBox(height: 16),
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
        const SizedBox(height: 16),
        Text('Phone (optional)', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 8),
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            hintText: '+266 5XXX XXXX',
            prefixIcon: Icon(LucideIcons.phone, size: 18),
          ),
        ),
        const SizedBox(height: 16),
        Text('Password', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 8),
        TextField(
          controller: _passwordController,
          obscureText: true,
          decoration: const InputDecoration(
            hintText: 'At least 8 characters',
            prefixIcon: Icon(LucideIcons.lock, size: 18),
          ),
        ),
        const SizedBox(height: 16),
        Text('Confirm password', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 8),
        TextField(
          controller: _confirmPasswordController,
          obscureText: true,
          decoration: const InputDecoration(
            hintText: 'Re-enter your password',
            prefixIcon: Icon(LucideIcons.lock, size: 18),
          ),
        ),
        const SizedBox(height: 24),
        CampusButton(
          label: 'Continue',
          onPressed: _nextStep,
          icon: LucideIcons.arrowRight,
        ),
      ],
    );
  }

  Widget _buildStep3(BuildContext context, bool isDark) {
    final faculties = ['Science & Technology', 'Engineering', 'Business', 'Humanities', 'Health Sciences'];
    final programs = ['Computer Science', 'Software Engineering', 'Data Science', 'Mathematics', 'Physics'];
    final years = [1, 2, 3, 4, 5, 6];

    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 24),
      children: [
        const SizedBox(height: 8),
        Text('Faculty', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 8),
        _dropdown(
          hint: 'Select faculty',
          value: _selectedFaculty,
          items: faculties,
          onChanged: (v) => setState(() => _selectedFaculty = v),
          isDark: isDark,
        ),
        const SizedBox(height: 16),
        Text('Program', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 8),
        _dropdown(
          hint: 'Select program',
          value: _selectedProgram,
          items: programs,
          onChanged: (v) => setState(() => _selectedProgram = v),
          isDark: isDark,
        ),
        const SizedBox(height: 16),
        Text('Year of Study', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: years.map((year) {
            final isSelected = _selectedYear == year;
            return CampusChip(
              label: 'Year $year',
              isSelected: isSelected,
              onTap: () => setState(() => _selectedYear = year),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        CampusButton(
          label: 'Continue',
          onPressed: _nextStep,
          icon: LucideIcons.arrowRight,
        ),
      ],
    );
  }

  Widget _buildStep4(BuildContext context, bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.mailCheck, color: AppColors.success, size: 40),
            ),
            const SizedBox(height: 24),
            Text(
              'Check Your Email',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'We\'ve sent a verification link to',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              _emailController.text.isNotEmpty ? _emailController.text : 'your email address',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.primaryAccent,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            CampusButton(
              label: 'Continue to App',
              onPressed: _handleRegister,
              icon: LucideIcons.arrowRight,
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Resend Verification Email'),
                    content: const Text('A new verification link will be sent to your email address.'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Verification email sent')),
                          );
                        },
                        child: const Text('Resend'),
                      ),
                    ],
                  ),
                );
              },
              child: const Text('Resend verification email'),
            ),
            const SizedBox(height: 16),
            Text(
              'No email needed in development mode — tap Continue.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 12),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleRegister() async {
    if (_firstNameController.text.isEmpty || _lastNameController.text.isEmpty || _emailController.text.isEmpty) {
      setState(() => _error = 'Please fill in all required fields');
      return;
    }
    if (_passwordController.text.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters');
      return;
    }
    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      api.setUniversityId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      final response = await api.post('/api/v1/auth/register', data: {
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'universityId': 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'phoneNumber': _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
      });

      final data = response.data['data'];

      try {
        await SecureStorage.saveTokens(data['accessToken'], data['refreshToken']);
        await SecureStorage.saveUniversityId(data['user']['universityId']);
        await SecureStorage.saveUserId(data['user']['id']);
        await SecureStorage.saveLoginState();
      } catch (_) {}

      api.setTokens(accessToken: data['accessToken'], refreshToken: data['refreshToken']);
      api.setUniversityId(data['user']['universityId']);

      ref.read(authStateProvider.notifier).state = true;

      if (!mounted) return;
      if (data['emailVerificationRequired'] == true) {
        context.go('/verify-email');
      } else {
        context.go('/');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        setState(() => _error = 'Email already registered. Try logging in instead.');
      } else {
        setState(() => _error = 'Registration failed. ${e.response?.data?['message'] ?? 'Please try again.'}');
      }
    } catch (e) {
      setState(() => _error = 'Registration failed. Please try again.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _dropdown({
    required String hint,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.grey.shade200,
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          hint: Text(hint),
          items: items.map((item) => DropdownMenuItem(
            value: item,
            child: Text(item, style: Theme.of(context).textTheme.bodyMedium),
          )).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
