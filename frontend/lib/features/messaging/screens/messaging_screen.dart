import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:campusos/core/theme/app_colors.dart';
import 'package:campusos/core/widgets/widgets.dart';
import 'package:campusos/features/messaging/providers/messaging_provider.dart';

class MessagingScreen extends ConsumerStatefulWidget {
  const MessagingScreen({super.key});

  @override
  ConsumerState<MessagingScreen> createState() => _MessagingScreenState();
}

class _MessagingScreenState extends ConsumerState<MessagingScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final conversationsAsync = ref.watch(conversationsProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Text('Messages', style: Theme.of(context).textTheme.headlineSmall),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextField(
                onChanged: (v) => setState(() => _searchQuery = v),
                decoration: InputDecoration(
                  hintText: 'Search conversations...',
                  prefixIcon: const Icon(LucideIcons.search, size: 18),
                  prefixIconConstraints: const BoxConstraints(minWidth: 40),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(LucideIcons.x, size: 16),
                          onPressed: () => setState(() => _searchQuery = ''),
                        )
                      : null,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: conversationsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, st) => EmptyState(
                  icon: LucideIcons.alertCircle,
                  title: 'Something went wrong',
                  message: 'Pull to refresh and try again',
                  actionLabel: 'Retry',
                  onAction: () => ref.invalidate(conversationsProvider),
                ),
                data: (conversations) {
                  final filtered = _searchQuery.isEmpty
                      ? conversations
                      : conversations
                          .where((c) => c.name.toLowerCase().contains(_searchQuery.toLowerCase()))
                          .toList();
                  if (filtered.isEmpty) {
                    return EmptyState(
                      icon: LucideIcons.messageCircle,
                      title: 'No conversations',
                      message: _searchQuery.isNotEmpty
                          ? 'No matches for "$_searchQuery"'
                          : 'Start a new conversation!',
                    );
                  }
                  return ListView.builder(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.only(bottom: 100),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final convo = filtered[index];
                      return _ConversationTile(
                        conversation: convo,
                        isDark: isDark,
                        onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1))),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: CampusIconButton(
        icon: LucideIcons.pencil,
        onPressed: () {
          final recipientCtrl = TextEditingController();
          final messageCtrl = TextEditingController();
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
                      decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
                  ),
                  const SizedBox(height: 16),
                  Text('New Message', style: Theme.of(ctx).textTheme.titleMedium),
                  const SizedBox(height: 16),
                  TextField(
                    controller: recipientCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Recipient',
                      prefixIcon: Icon(LucideIcons.user, size: 18),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: messageCtrl,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      hintText: 'Type your message...',
                      alignLabelWithHint: true,
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: CampusButton(
                      label: 'Send',
                      icon: LucideIcons.send,
                      onPressed: () {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Message sent')),
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
        tooltip: 'New Message',
        size: 52,
        color: Colors.white,
        backgroundColor: AppColors.primaryAccent,
      ),
    );
  }
}

String _timeAgo(DateTime date) {
  final diff = DateTime.now().difference(date);
  if (diff.inDays > 6) return '${(diff.inDays / 7).floor()}w ago';
  if (diff.inDays > 0) return '${diff.inDays}d ago';
  if (diff.inHours > 0) return '${diff.inHours}h ago';
  if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
  return 'Just now';
}

class _ConversationTile extends StatelessWidget {
  final Conversation conversation;
  final bool isDark;
  final VoidCallback onTap;

  const _ConversationTile({
    required this.conversation,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final initials = conversation.name
        .split(' ')
        .where((w) => w.isNotEmpty)
        .map((w) => w[0])
        .take(2)
        .join()
        .toUpperCase();
    final isGroup = conversation.type == 'group';
    final timestamp = _timeAgo(conversation.lastMessageAt);

    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: UserAvatar(
        initials: initials,
        size: 52,
        isVerified: false,
        showOnlineIndicator: false,
      ),
      title: Text(
        conversation.name,
        style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        conversation.lastMessagePreview,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textSecondary,
            ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            timestamp,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                  fontSize: 11,
                ),
          ),
        ],
      ),
    );
  }
}
