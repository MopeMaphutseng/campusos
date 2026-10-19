import 'package:flutter/material.dart';
import 'package:campusos/core/theme/app_colors.dart';

class CampusButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isExpanded;
  final IconData? icon;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final ButtonStyle? style;

  const CampusButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isExpanded = true,
    this.icon,
    this.backgroundColor,
    this.foregroundColor,
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    final button = icon != null
        ? ElevatedButton.icon(
            onPressed: isLoading ? null : onPressed,
            icon: isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Icon(icon, size: 18),
            label: Text(label),
            style: (style ?? ElevatedButton.styleFrom()).copyWith(
              backgroundColor: backgroundColor != null
                  ? WidgetStateProperty.all(backgroundColor)
                  : null,
              foregroundColor: foregroundColor != null
                  ? WidgetStateProperty.all(foregroundColor)
                  : null,
            ),
          )
        : ElevatedButton(
            onPressed: isLoading ? null : onPressed,
            child: isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Text(label),
          );

    return isExpanded
        ? SizedBox(width: double.infinity, child: button)
        : button;
  }
}

class CampusIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final Color? color;
  final Color? backgroundColor;
  final double size;
  final String? tooltip;

  const CampusIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.color,
    this.backgroundColor,
    this.size = 40,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Tooltip(
      message: tooltip ?? '',
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: backgroundColor ??
              (isDark ? AppColors.surfaceDark : AppColors.surfaceLight),
          borderRadius: BorderRadius.circular(size / 3),
          border: Border.all(
            color: isDark
                ? Colors.white.withValues(alpha: 0.08)
                : Colors.grey.withValues(alpha: 0.1),
          ),
        ),
        child: IconButton(
          onPressed: onPressed,
          icon: Icon(icon, size: size * 0.5, color: color),
          padding: EdgeInsets.zero,
        ),
      ),
    );
  }
}

class CampusChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback? onTap;
  final Color? selectedColor;
  final IconData? icon;

  const CampusChip({
    super.key,
    required this.label,
    this.isSelected = false,
    this.onTap,
    this.selectedColor,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final color = selectedColor ?? AppColors.primaryAccent;

    return FilterChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: isSelected ? color : null),
            const SizedBox(width: 4),
          ],
          Text(label),
        ],
      ),
      selected: isSelected,
      onSelected: onTap != null ? (_) => onTap!() : null,
      selectedColor: color.withValues(alpha: 0.15),
      checkmarkColor: color,
      side: isSelected
          ? BorderSide(color: color.withValues(alpha: 0.3))
          : null,
    );
  }
}

class StatusBadge extends StatelessWidget {
  final String text;
  final Color color;
  final bool isSmall;

  const StatusBadge({
    super.key,
    required this.text,
    required this.color,
    this.isSmall = false,
  });

  factory StatusBadge.success(String text) => StatusBadge(text: text, color: AppColors.success);
  factory StatusBadge.warning(String text) => StatusBadge(text: text, color: AppColors.warning);
  factory StatusBadge.error(String text) => StatusBadge(text: text, color: AppColors.error);
  factory StatusBadge.info(String text) => StatusBadge(text: text, color: AppColors.info);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isSmall ? 6 : 10,
        vertical: isSmall ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.18 : 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: AppColors.accentText(color, isDark: isDark),
          fontSize: isSmall ? 10 : 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
