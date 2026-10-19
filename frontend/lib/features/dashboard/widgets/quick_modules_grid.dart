import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/features/academics/screens/academics_screen.dart';
import 'package:campusos/features/library/screens/library_screen.dart';
import 'package:campusos/features/mentorship/screens/mentorship_screen.dart';
import 'package:campusos/features/campus-life/screens/campus_map_screen.dart';
import 'package:campusos/features/health/screens/health_screen.dart';
import 'package:campusos/features/jobs/screens/jobs_screen.dart';
import 'package:campusos/features/research-hub/screens/research_hub_screen.dart';
import 'package:campusos/features/scholarships/screens/scholarships_screen.dart';
import 'package:campusos/features/ai-tutor/screens/ai_tutor_screen.dart';
import 'package:campusos/features/news/screens/news_screen.dart';
import 'package:campusos/features/sports/screens/sports_screen.dart';
import 'package:campusos/features/campus-life/screens/campus_life_screen.dart';
import 'package:campusos/features/planner/screens/study_planner_screen.dart';
import 'package:campusos/features/planner/screens/business_assistant_screen.dart';
import 'package:campusos/features/profile/screens/profile_screen.dart';

class QuickModulesGrid extends StatelessWidget {
  const QuickModulesGrid({super.key});

  @override
  Widget build(BuildContext context) {
    final modules = [
      _ModuleItem(LucideIcons.brain, 'AI Tutor', const Color(0xFF8B5CF6), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AiTutorScreen()))),
      _ModuleItem(LucideIcons.calendarDays, 'Timetable', AppColors.primaryAccent, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AcademicsScreen()))),
      _ModuleItem(LucideIcons.fileText, 'Materials', const Color(0xFF8B5CF6), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LibraryScreen()))),
      _ModuleItem(LucideIcons.users, 'Mentors', AppColors.tertiaryAccent, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MentorshipScreen()))),
      _ModuleItem(LucideIcons.mapPin, 'Campus Map', AppColors.secondaryAccent, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CampusMapScreen()))),
      _ModuleItem(LucideIcons.heart, 'Health', AppColors.error, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HealthScreen()))),
      _ModuleItem(LucideIcons.briefcase, 'Jobs', const Color(0xFF06B6D4), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const JobsScreen()))),
      _ModuleItem(LucideIcons.lightbulb, 'Research', const Color(0xFFF97316), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ResearchHubScreen()))),
      _ModuleItem(LucideIcons.award, 'Scholarships', AppColors.success, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScholarshipsScreen()))),
      _ModuleItem(LucideIcons.newspaper, 'News', const Color(0xFF14B8A6), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NewsScreen()))),
      _ModuleItem(LucideIcons.trophy, 'Sports', const Color(0xFFEAB308), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SportsScreen()))),
      _ModuleItem(LucideIcons.sparkles, 'Campus Life', AppColors.info, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CampusLifeScreen()))),
      _ModuleItem(LucideIcons.calendarCheck, 'Planner', const Color(0xFF7C3AED), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudyPlannerScreen()))),
      _ModuleItem(LucideIcons.briefcase, 'Business', const Color(0xFF0EA5E9), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BusinessAssistantScreen()))),
      _ModuleItem(LucideIcons.user, 'Profile', AppColors.primaryAccent, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()))),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: _AcademiaPanel(
        child: GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.85,
          ),
          itemCount: modules.length,
          itemBuilder: (context, index) {
            final module = modules[index];
            return _ModuleTile(
              icon: module.icon,
              label: module.label,
              color: module.color,
              onTap: module.onTap,
            );
          },
        ),
      ),
    );
  }
}

class _ModuleItem {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  _ModuleItem(this.icon, this.label, this.color, this.onTap);
}

class _AcademiaPanel extends StatefulWidget {
  final Widget child;

  const _AcademiaPanel({required this.child});

  @override
  State<_AcademiaPanel> createState() => _AcademiaPanelState();
}

class _AcademiaPanelState extends State<_AcademiaPanel>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  final List<_Symbol> _symbols = [
    _Symbol(LucideIcons.graduationCap, 1.0, 0.26, 26),
    _Symbol(LucideIcons.bookOpen, 0.9, 1.30, 18),
    _Symbol(LucideIcons.atom, 1.2, -0.52, 22),
    _Symbol(LucideIcons.flaskConical, 1.4, 0.0, 16),
    _Symbol(LucideIcons.pencil, 0.8, 1.57, 17),
    _Symbol(LucideIcons.scrollText, 1.1, 2.36, 18),
    _Symbol(LucideIcons.award, 1.0, -1.05, 19),
    _Symbol(LucideIcons.brain, 0.95, 0.79, 17),
    _Symbol(LucideIcons.globe, 1.2, -0.26, 18),
  ];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark ? const Color(0xFF101C33) : const Color(0xFF1B2F5C);

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final t = _controller.value;
        final gold = const Color(0xFFF2C879).withValues(alpha: 0.8);

        return Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1E3A8A).withValues(alpha: 0.28),
                blurRadius: 32,
                spreadRadius: -4,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    base,
                    const Color(0xFF243B6B),
                    const Color(0xFF16263F),
                  ],
                ),
              ),
              child: Stack(
                clipBehavior: Clip.hardEdge,
                children: [
                  Align(
                    alignment: const Alignment(0.0, -1.0),
                    child: Container(
                      width: 240,
                      height: 240,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            const Color(0xFFF2C879).withValues(alpha: 0.28),
                            const Color(0xFFF2C879).withValues(alpha: 0.0),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const Positioned.fill(
                    child: CustomPaint(painter: _NotebookLinesPainter()),
                  ),
                  Positioned.fill(
                    child: Center(child: _CenterEmblem(t: t)),
                  ),
                  ..._symbols.asMap().entries.map((e) {
                    final i = e.key;
                    final s = e.value;
                    final d = (t * 1.0) % 1.0;
                    final u = 0.5 + 0.55 * d * math.cos(s.angle);
                    final v = 0.5 + 0.55 * d * math.sin(s.angle);
                    final fade = 0.30 + 0.6 * d;
                    final rot = math.sin(2 * math.pi * (d * 5 + i * 0.37)) * 0.4;
                    return Align(
                      alignment: Alignment(u * 2 - 1, v * 2 - 1),
                      child: Transform.rotate(
                        angle: rot,
                        child: Opacity(
                          opacity: fade,
                          child: Icon(s.icon, color: gold, size: s.size),
                        ),
                      ),
                    );
                  }),
                  _Twinkles(t: t),
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.22),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
                    child: widget.child,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _Symbol {
  final IconData icon;
  final double speed;
  final double angle;
  final double size;

  const _Symbol(this.icon, this.speed, this.angle, this.size);
}

class _CenterEmblem extends StatelessWidget {
  final double t;

  const _CenterEmblem({required this.t});

  @override
  Widget build(BuildContext context) {
    final gold = const Color(0xFFF2C879);
    return Opacity(
      opacity: 0.85,
      child: Stack(
        alignment: Alignment.center,
        children: [
          for (final k in [0, 1])
            ClipOval(
              child: CustomPaint(
                size: const Size(150, 150),
                painter: _RingPainter(
                  t: t,
                  offset: k * 0.5,
                  color: gold,
                ),
              ),
            ),
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF1B2F5C),
              border: Border.all(color: gold.withValues(alpha: 0.7), width: 1.4),
              boxShadow: [
                BoxShadow(
                  color: gold.withValues(alpha: 0.5),
                  blurRadius: 22,
                  spreadRadius: 4,
                ),
              ],
            ),
            child: Icon(LucideIcons.graduationCap, color: gold, size: 28),
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double t;
  final double offset;
  final Color color;

  _RingPainter({required this.t, required this.offset, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final phase = (t * 0.9 + offset) % 1.0;
    final progress = (phase * 2) % 1.0;
    final expand = Curves.easeOut.transform(progress);
    final fade = 1.0 - progress;
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..color = color.withValues(alpha: (0.55 * fade).clamp(0.0, 1.0));
    canvas.drawCircle(
      size.center(Offset.zero),
      (8 + expand * 62) * (size.width / 150),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) =>
      t != oldDelegate.t || offset != oldDelegate.offset;
}

class _NotebookLinesPainter extends CustomPainter {
  const _NotebookLinesPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.045)
      ..strokeWidth = 1;
    const spacing = 26.0;
    for (var dy = spacing; dy < size.height; dy += spacing) {
      canvas.drawLine(Offset(0, dy), Offset(size.width, dy), paint);
    }
    final margin = Paint()
      ..color = Colors.white.withValues(alpha: 0.06);
    canvas.drawRect(Rect.fromLTRB(0, 0, 4, size.height), margin);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _Twinkles extends StatelessWidget {
  final double t;

  const _Twinkles({required this.t});

  @override
  Widget build(BuildContext context) {
    final rng = math.Random(7);
    final gold = const Color(0xFFF2C879);
    return Positioned.fill(
      child: CustomPaint(
        painter: _TwinklePainter(t: t, rng: rng, gold: gold),
      ),
    );
  }
}

class _TwinklePainter extends CustomPainter {
  final double t;
  final math.Random rng;
  final Color gold;

  _TwinklePainter({required this.t, required this.rng, required this.gold});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = gold.withValues(alpha: 0.55)
      ..strokeCap = StrokeCap.round;
    for (var i = 0; i < 26; i++) {
      final x = rng.nextDouble() * size.width;
      final y = rng.nextDouble() * size.height;
      final tw = 0.35 + 0.65 * math.sin(2 * math.pi * (t * 1.2 + i * 0.53));
      paint.color = gold.withValues(alpha: (0.15 + 0.4 * tw).clamp(0.0, 1.0));
      canvas.drawCircle(Offset(x, y), 1.1, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _TwinklePainter oldDelegate) => t != oldDelegate.t;
}

class _ModuleTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ModuleTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.35),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.18),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 11,
              color: Colors.white,
              shadows: [
                Shadow(color: Colors.black45, blurRadius: 6, offset: Offset(0, 1)),
              ],
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}