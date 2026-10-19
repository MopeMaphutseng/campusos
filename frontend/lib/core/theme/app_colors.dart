import 'package:flutter/material.dart';

/// CampusOS design tokens.
///
/// A single source of truth for colour. `app_theme.dart` imports this file, so
/// every value below is used by both the light and dark themes. New tokens were
/// added on top of the original palette (existing names are unchanged) to
/// support the premium dark canvas, glassmorphism surfaces and glow accents.
class AppColors {
  AppColors._();

  // ---- Brand ---------------------------------------------------------------
  static const Color primary = Color(0xFF1B3A6B);
  static const Color primaryAccent = Color(0xFF3B82F6);
  static const Color secondaryAccent = Color(0xFFF59E0B);
  static const Color tertiaryAccent = Color(0xFF10B981);

  // Extended accent spectrum used by modules and AI surfaces.
  static const Color violet = Color(0xFF8B5CF6);
  static const Color indigo = Color(0xFF6366F1);
  static const Color cyan = Color(0xFF06B6D4);
  static const Color sky = Color(0xFF0EA5E9);
  static const Color rose = Color(0xFFF43F5E);
  static const Color gold = Color(0xFFF2C879);

  // ---- Surfaces ------------------------------------------------------------
  static const Color backgroundLight = Color(0xFFFAFAF9);
  static const Color surfaceLight = Color(0xFFFFFFFF);

  /// Deep premium canvas for the dark theme (near-black, blue-tinted).
  static const Color canvasDark = Color(0xFF070B14);
  static const Color backgroundDark = Color(0xFF0B1220);
  static const Color surfaceDark = Color(0xFF141C2E);

  /// Slightly brighter panel used for nested surfaces in dark mode.
  static const Color surfaceElevatedDark = Color(0xFF1B2740);

  // ---- Text ----------------------------------------------------------------
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFF94A3B8);

  // ---- Semantic ------------------------------------------------------------
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // ---- Gradients -----------------------------------------------------------
  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryAccent],
  );

  /// Blue → violet → cyan: the signature "aurora" used on hero headers.
  static const LinearGradient auroraGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2563EB), Color(0xFF7C3AED), Color(0xFF06B6D4)],
  );

  static const LinearGradient violetGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF7C3AED), Color(0xFF6366F1)],
  );

  static const LinearGradient oceanGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0EA5E9), Color(0xFF2563EB)],
  );

  static const LinearGradient warmGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF59E0B), Color(0xFFEF4444)],
  );

  static const LinearGradient successGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF10B981), Color(0xFF059669)],
  );

  static const LinearGradient surfaceGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [surfaceLight, backgroundLight],
  );

  /// A subtle top-to-bottom sheen applied to glass panels so they read as
  /// hand-lit rather than flat translucent rectangles.
  static LinearGradient glassSheen({bool isDark = false}) => LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: isDark
            ? [
                Colors.white.withValues(alpha: 0.10),
                Colors.white.withValues(alpha: 0.03),
              ]
            : [
                Colors.white.withValues(alpha: 0.85),
                Colors.white.withValues(alpha: 0.60),
              ],
      );

  // ---- Glass tokens --------------------------------------------------------
  static Color glassFill({bool isDark = true}) => isDark
      ? const Color(0xFF141C2E).withValues(alpha: 0.55)
      : Colors.white.withValues(alpha: 0.72);

  static Color glassBorder({bool isDark = true}) => isDark
      ? Colors.white.withValues(alpha: 0.10)
      : Colors.white.withValues(alpha: 0.85);

  // ---- Shadows -------------------------------------------------------------
  static Color shadowColor({bool isDark = false}) =>
      isDark ? Colors.black.withValues(alpha: 0.45) : Colors.black.withValues(alpha: 0.08);

  /// Soft coloured glow used under hero/glass elements in dark mode.
  static List<BoxShadow> glow(Color color, {double strength = 0.45, double radius = 28}) => [
        BoxShadow(
          color: color.withValues(alpha: strength),
          blurRadius: radius,
          spreadRadius: -4,
          offset: const Offset(0, 10),
        ),
      ];

  static List<BoxShadow> cardShadow({bool isDark = false}) => isDark
      ? [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 20,
            spreadRadius: -8,
            offset: const Offset(0, 10),
          ),
        ]
      : [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 18,
            spreadRadius: -8,
            offset: const Offset(0, 8),
          ),
        ];
}
