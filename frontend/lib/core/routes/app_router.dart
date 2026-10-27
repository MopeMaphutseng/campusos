import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:campusos/core/widgets/main_shell.dart';
import 'package:campusos/features/auth/screens/login_screen.dart';
import 'package:campusos/features/auth/screens/register_screen.dart';
import 'package:campusos/features/auth/screens/verify_email_screen.dart';
import 'package:campusos/features/dashboard/screens/dashboard_screen.dart';
import 'package:campusos/features/academics/screens/academics_screen.dart';
import 'package:campusos/features/library/screens/library_screen.dart';
import 'package:campusos/features/marketplace/screens/marketplace_screen.dart';
import 'package:campusos/features/messaging/screens/messaging_screen.dart';
import 'package:campusos/features/campus-life/screens/campus_map_screen.dart';
import 'package:campusos/features/mentorship/screens/mentorship_screen.dart';
import 'package:campusos/features/scholarships/screens/scholarships_screen.dart';
import 'package:campusos/features/jobs/screens/jobs_screen.dart';
import 'package:campusos/features/innovation-hub/screens/innovation_hub_screen.dart';
import 'package:campusos/features/research-hub/screens/research_hub_screen.dart';
import 'package:campusos/features/health/screens/health_screen.dart';
import 'package:campusos/features/admin/screens/admin_dashboard.dart';
import 'package:campusos/features/ai-tutor/screens/ai_tutor_screen.dart';
import 'package:campusos/features/sports/screens/sports_screen.dart';
import 'package:campusos/features/news/screens/news_screen.dart';
import 'package:campusos/features/notifications/screens/notifications_screen.dart';
import 'package:campusos/features/campus-life/screens/campus_life_screen.dart';
import 'package:campusos/features/settings/screens/settings_screen.dart';
import 'package:campusos/features/payments/screens/payments_screen.dart';
import 'package:campusos/features/credentials/screens/credentials_screen.dart';
import 'package:campusos/features/planner/screens/study_planner_screen.dart';
import 'package:campusos/features/planner/screens/business_assistant_screen.dart';
import 'package:campusos/features/profile/screens/profile_screen.dart';

final authStateProvider = StateProvider<bool>((ref) => false);

/// Current user role ('student', 'admin', 'super_admin', ...). Restored on
/// startup and set at login so routing can send admins to the admin console.
final userRoleProvider = StateProvider<String?>((ref) => null);

bool _isAdminRole(String? role) => role == 'admin' || role == 'super_admin';

final routerProvider = Provider<GoRouter>((ref) {
  final isAuthenticated = ref.watch(authStateProvider);
  final role = ref.watch(userRoleProvider);
  final admin = _isAdminRole(role);

  return GoRouter(
    initialLocation: !isAuthenticated ? '/login' : (admin ? '/admin' : '/'),
    redirect: (context, state) {
      final loggedIn = ref.read(authStateProvider);
      final isAdmin = _isAdminRole(ref.read(userRoleProvider));
      final loc = state.matchedLocation;
      final onAuth = loc == '/login' || loc == '/register';

      if (!loggedIn) return onAuth ? null : '/login';
      if (onAuth) return isAdmin ? '/admin' : '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/verify-email',
        builder: (context, state) => const VerifyEmailScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => MainShell(
          navigationShell: navigationShell,
        ),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                builder: (context, state) => const DashboardScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/academics',
                builder: (context, state) => const AcademicsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/library',
                builder: (context, state) => const LibraryScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/marketplace',
                builder: (context, state) => const MarketplaceScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/messages',
                builder: (context, state) => const MessagingScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(path: '/campus-map', builder: (_, __) => const CampusMapScreen()),
      GoRoute(path: '/campus-life', builder: (_, __) => const CampusLifeScreen()),
      GoRoute(path: '/mentors', builder: (_, __) => const MentorshipScreen()),
      GoRoute(path: '/scholarships', builder: (_, __) => const ScholarshipsScreen()),
      GoRoute(path: '/jobs', builder: (_, __) => const JobsScreen()),
      GoRoute(path: '/innovation-hub', builder: (_, __) => const InnovationHubScreen()),
      GoRoute(path: '/research-hub', builder: (_, __) => const ResearchHubScreen()),
      GoRoute(path: '/health', builder: (_, __) => const HealthScreen()),
      GoRoute(path: '/admin', builder: (_, __) => const AdminDashboard()),
      GoRoute(path: '/ai-tutor', builder: (_, __) => const AiTutorScreen()),
      GoRoute(path: '/sports', builder: (_, __) => const SportsScreen()),
      GoRoute(path: '/news', builder: (_, __) => const NewsScreen()),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
      GoRoute(path: '/payments', builder: (_, __) => const PaymentsScreen()),
      GoRoute(path: '/credentials', builder: (_, __) => const CredentialsScreen()),
      GoRoute(path: '/study-planner', builder: (_, __) => const StudyPlannerScreen()),
      GoRoute(path: '/business-assistant', builder: (_, __) => const BusinessAssistantScreen()),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
    ],
  );
});
