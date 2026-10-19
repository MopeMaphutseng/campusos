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

  /// Deeper brand blue that stays readable as text on light surfaces.
  static const Color primaryDeep = Color(0xFF1E40AF);

  // Extended accent spectrum used by modules and AI surfaces.
  static const Color violet = Color(0xFF8B5CF6);
  static const Color indigo = Color(0xFF6366F1);
  static const Color cyan = Color(0xFF06B6D4);
  static const Color sky = Color(0xFF0EA5E9);
  static const Color rose = Color(0xFFF43F5E);
  static const Color gold = Color(0xFFF2C879);

  // Additional accents used by modules (previously hardcoded with no token).
  static const Color orange = Color(0xFFF97316);
  static const Color teal = Color(0xFF14B8A6);
  static const Color yellow = Color(0xFFEAB308);
  static const Color redDeep = Color(0xFFDC2626);

  // ---- Readable "on light surface" text variants ---------------------------
  // The vivid accents above are great as fills/icons but fail WCAG when used as
  // *text* on light surfaces. These darker variants pass AA (>= 4.5:1) on white
  // and should be used for text, badges and chips on light backgrounds.
  static const Color primaryText = Color(0xFF1E40AF); // blue on white ~7.4:1
  static const Color amberText = Color(0xFFB45309); // amber on white ~5.9:1
  static const Color emeraldText = Color(0xFF047857); // emerald on white ~5.3:1
  static const Color redText = Color(0xFFB91C1C); // red on white ~6.4:1
  static const Color violetText = Color(0xFF6D28D9); // violet on white ~6.9:1
  static const Color cyanText = Color(0xFF0E7490); // cyan on white ~4.6:1
  static const Color orangeText = Color(0xFFC2410C); // orange on white ~5.4:1
  static const Color tealText = Color(0xFF0F766E); // teal on white ~4.9:1
  static const Color indigoText = Color(0xFF4338CA); // indigo on white ~6.7:1
  static const Color skyText = Color(0xFF0369A1); // sky on white ~5.9:1
  static const Color roseText = Color(0xFFBE123C); // rose on white ~6.4:1

  // ---- Surfaces ------------------------------------------------------------
  static const Color backgroundLight = Color(0xFFFAFAF9);
  static const Color surfaceLight = Color(0xFFFFFFFF);

  /// Deep premium canvas for the dark theme (near-black, blue-tinted).
  static const Color canvasDark = Color(0xFF070B14);
  static const Color backgroundDark = Color(0xFF0B1220);
  static const Color surfaceDark = Color(0xFF141C2E);

  /// Slightly brighter panel used for nested surfaces in dark mode.
  static const Color surfaceElevatedDark = Color(0xFF1B2740);

  /// Deep navy shades used by the "Academia" hero panel on the dashboard.
  static const Color navyBaseDark = Color(0xFF101C33);
  static const Color navyBaseLight = Color(0xFF1B2F5C);
  static const Color navyMid = Color(0xFF243B6B);
  static const Color navyDeep = Color(0xFF16263F);

  // ---- Text ----------------------------------------------------------------
  static const Color textPrimary = Color(0xFF111827);
  /// Muted body/secondary text. Darkened from the original #6B7280 so that
  /// `bodySmall`/`labelSmall` (assigned this colour by the theme) clear WCAG AA
  /// on white: #475569 on #FFFFFF ~= 7.4:1, on #FAFAF9 ~= 7.1:1.
  static const Color textSecondary = Color(0xFF475569);
  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  /// Muted body/secondary text on the dark canvas. Lightened from the original
  /// #94A3B8 so it clears AA on the dark glass surfaces: #B6C2D4 on #141C2E
  /// ~= 8.6:1, on #070B14 ~= 11.4:1.
  static const Color textSecondaryDark = Color(0xFFB6C2D4);

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

  // ---- Loading / skeletons -------------------------------------------------
  /// Placeholder colour for skeleton loaders. Adapts to the theme so that the
  /// shimmer is visible on BOTH the light background and the dark canvas
  /// (the old hardcoded `Colors.grey.shade300` was invisible in dark mode).
  static Color skeletonBase({bool isDark = false}) => isDark
      ? Colors.white.withValues(alpha: 0.07)
      : const Color(0xFFE2E8F0);

  static Color skeletonHighlight({bool isDark = false}) => isDark
      ? Colors.white.withValues(alpha: 0.13)
      : const Color(0xFFF1F5F9);

  /// Subtle hairline used for input borders / dividers. Adapts to the theme so
  /// it stays visible on both light fields and dark glass.
  static Color hairline({bool isDark = false}) => isDark
      ? Colors.white.withValues(alpha: 0.14)
      : const Color(0xFFCBD5E1);

  // ---- Contrast helper -----------------------------------------------------
  /// Returns the most readable foreground (near-white or near-black) for the
  /// supplied [background], based on its relative luminance. Use this whenever
  /// text sits on a dynamic/accent colour so it can never end up low-contrast.
  static Color readableOn(Color background) =>
      background.computeLuminance() > 0.5 ? textPrimary : textPrimaryDark;

  /// A readable *text* version of an accent colour for the current brightness:
  /// the darker `*Text` variants on light surfaces, the vivid accent on dark.
  static Color accentText(Color accent, {bool isDark = false}) {
    if (isDark) return accent;
    if (accent == warning || accent == secondaryAccent) return amberText;
    if (accent == success || accent == tertiaryAccent) return emeraldText;
    if (accent == error) return redText;
    if (accent == info || accent == primaryAccent) return primaryText;
    if (accent == violet) return violetText;
    if (accent == cyan) return cyanText;
    if (accent == orange) return orangeText;
    if (accent == teal) return tealText;
    if (accent == indigo) return indigoText;
    if (accent == sky) return skyText;
    if (accent == rose) return roseText;
    if (accent == gold) return amberText;
    return accent;
  }
}
