import 'package:flutter/material.dart';
import 'package:campusos/core/theme/app_colors.dart';

class UserAvatar extends StatelessWidget {
  final String? imageUrl;
  final String? initials;
  final double size;
  final bool isVerified;
  final bool showOnlineIndicator;

  const UserAvatar({
    super.key,
    this.imageUrl,
    this.initials,
    this.size = 44,
    this.isVerified = false,
    this.showOnlineIndicator = false,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: imageUrl == null ? AppColors.heroGradient : null,
            color: imageUrl == null ? null : AppColors.surfaceDark,
          ),
          child: ClipOval(
            child: imageUrl != null
                ? Image.network(
                    imageUrl!,
                    width: size,
                    height: size,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _buildInitials(),
                  )
                : _buildInitials(),
          ),
        ),
        if (isVerified)
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: size * 0.28,
              height: size * 0.28,
              decoration: BoxDecoration(
                color: AppColors.success,
                shape: BoxShape.circle,
                border: Border.all(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  width: 2,
                ),
              ),
              child: Icon(
                Icons.check,
                size: size * 0.16,
                color: Colors.white,
              ),
            ),
          ),
        if (showOnlineIndicator)
          Positioned(
            right: 0,
            top: 0,
            child: Container(
              width: size * 0.25,
              height: size * 0.25,
              decoration: BoxDecoration(
                color: AppColors.success,
                shape: BoxShape.circle,
                border: Border.all(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  width: 2,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildInitials() {
    final displayInitials = initials ?? '?';
    return Center(
      child: Text(
        displayInitials.length > 2 ? displayInitials.substring(0, 2) : displayInitials,
        style: TextStyle(
          color: Colors.white,
          fontSize: size * 0.38,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class ModuleIcon extends StatelessWidget {
  final IconData icon;
  final Color color;
  final double size;
  final double borderRadius;

  const ModuleIcon({
    super.key,
    required this.icon,
    this.color = AppColors.primaryAccent,
    this.size = 44,
    this.borderRadius = 12,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.15 : 0.1),
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: Icon(icon, color: color, size: size * 0.5),
    );
  }
}
