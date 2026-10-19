import 'dart:math' as math;
import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';

import 'package:campusos/core/theme/app_colors.dart';

/// A softly animated "aurora" backdrop: large blurred colour blobs that drift
/// independently. Sits behind content (usually the dashboard). Uses radial
/// gradients rather than [BackdropFilter] so it stays cheap on Flutter web.
class AuroraBackground extends StatefulWidget {
  final Widget child;
  final bool animate;

  const AuroraBackground({
    super.key,
    required this.child,
    this.animate = true,
  });

  @override
  State<AuroraBackground> createState() => _AuroraBackgroundState();
}

class _AuroraBackgroundState extends State<AuroraBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 18),
  );

  @override
  void initState() {
    super.initState();
    if (widget.animate) _c.repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (!isDark) {
      // Light mode keeps a subtle tint so it never looks flat, but no heavy
      // dark blobs.
      return DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF7F9FF), Color(0xFFFAFAF9)],
          ),
        ),
        child: widget.child,
      );
    }

    return Stack(
      children: [
        Positioned.fill(
          child: AnimatedBuilder(
            animation: _c,
            builder: (context, _) => CustomPaint(
              painter: _AuroraPainter(t: _c.value),
            ),
          ),
        ),
        Positioned.fill(child: widget.child),
      ],
    );
  }
}

class _AuroraPainter extends CustomPainter {
  final double t;
  _AuroraPainter({required this.t});

  @override
  void paint(Canvas canvas, Size size) {
    // Deep base.
    final base = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [AppColors.canvasDark, AppColors.navyBaseDark, AppColors.canvasDark],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, base);

    void blob(Color color, double phase, double rxf, double ryf, double radius) {
      final a = 2 * math.pi * (t + phase);
      final cx = size.width * (rxf + 0.14 * math.cos(a));
      final cy = size.height * (ryf + 0.10 * math.sin(a));
      final r = size.width * radius;
      final paint = Paint()
        ..shader = RadialGradient(
          colors: [color.withValues(alpha: 0.55), color.withValues(alpha: 0.0)],
        ).createShader(Rect.fromCircle(center: Offset(cx, cy), radius: r));
      canvas.drawCircle(Offset(cx, cy), r, paint);
    }

    blob(AppColors.primaryDeep, 0.0, 0.12, 0.06, 0.85);
    blob(AppColors.violet, 0.35, 0.92, 0.22, 0.70);
    blob(AppColors.cyan, 0.70, 0.30, 0.55, 0.60);
  }

  @override
  bool shouldRepaint(covariant _AuroraPainter old) => old.t != t;
}

/// True glassmorphism surface: blurred backdrop + translucent fill + hairline
/// border + top-left sheen. Falls back to an opaque-ish surface on light mode.
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double radius;
  final double blur;
  final double? height;
  final double? width;
  final Gradient? gradient;
  final VoidCallback? onTap;
  final Color? borderColor;
  final bool highlight;
  final List<BoxShadow>? boxShadow;

  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.radius = 22,
    this.blur = 16,
    this.height,
    this.width,
    this.gradient,
    this.onTap,
    this.borderColor,
    this.highlight = false,
    this.boxShadow,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final content = Container(
      height: height,
      width: width,
      padding: padding,
      decoration: BoxDecoration(
        gradient: gradient ?? AppColors.glassSheen(isDark: isDark),
        color: gradient == null ? AppColors.glassFill(isDark: isDark) : null,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: highlight
              ? AppColors.primaryAccent.withValues(alpha: 0.55)
              : (borderColor ?? AppColors.glassBorder(isDark: isDark)),
          width: highlight ? 1.5 : 1,
        ),
        boxShadow: boxShadow ?? AppColors.cardShadow(isDark: isDark),
      ),
      child: child,
    );

    final blurred = ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: content,
      ),
    );

    final tappable = onTap == null
        ? blurred
        : Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(radius),
              onTap: onTap,
              child: blurred,
            ),
          );

    return margin == null ? tappable : Padding(padding: margin!, child: tappable);
  }
}

/// Small frosted chip/tile with a coloured icon — used in grids and nav.
class GlassIconTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final double size;
  final double radius;
  final bool glow;

  const GlassIconTile({
    super.key,
    required this.icon,
    required this.color,
    this.size = 52,
    this.radius = 16,
    this.glow = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            color.withValues(alpha: isDark ? 0.32 : 0.18),
            color.withValues(alpha: isDark ? 0.14 : 0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: color.withValues(alpha: isDark ? 0.5 : 0.35)),
        boxShadow: glow
            ? AppColors.glow(color, strength: isDark ? 0.35 : 0.2, radius: 18)
            : null,
      ),
      child: Icon(icon, color: isDark ? _lighten(color) : color, size: size * 0.45),
    );
  }

  Color _lighten(Color c) {
    final hsl = HSLColor.fromColor(c);
    return hsl.withLightness((hsl.lightness + 0.22).clamp(0.0, 1.0)).toColor();
  }
}
