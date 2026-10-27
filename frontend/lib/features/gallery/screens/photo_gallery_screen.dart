import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:video_player/video_player.dart';
import 'package:campusos/core/theme/app_colors.dart';

class GalleryPhoto {
  final String asset;
  final String caption;
  final bool isVideo;

  const GalleryPhoto({required this.asset, required this.caption, this.isVideo = false});

  String get url => isVideo ? 'http://localhost:8082$asset' : asset;
}

const List<GalleryPhoto> kCampusMedia = [
  GalleryPhoto(asset: '/media/electronics_1.jpeg', caption: 'Electronics 1'),
  GalleryPhoto(asset: '/media/electronics_2.jpeg', caption: 'Electronics 2'),
  GalleryPhoto(asset: '/media/electronics_3.jpeg', caption: 'Electronics 3'),
  GalleryPhoto(asset: '/media/electronics_4.jpeg', caption: 'Electronics 4'),
  GalleryPhoto(asset: '/media/electronics_5.jpeg', caption: 'Electronics 5'),
  GalleryPhoto(asset: '/media/electronics_6.jpeg', caption: 'Electronics 6'),
  GalleryPhoto(asset: '/media/electronics_7.jpeg', caption: 'Electronics 7'),
  GalleryPhoto(asset: '/media/electronics_8.jpeg', caption: 'Electronics 8'),
  GalleryPhoto(asset: '/media/electronics_9.jpeg', caption: 'Electronics 9'),
  GalleryPhoto(asset: '/media/electronics_10.mp4', caption: 'Electronics Video 1', isVideo: true),
  GalleryPhoto(asset: '/media/electronics_11.mp4', caption: 'Electronics Video 2', isVideo: true),
  GalleryPhoto(asset: '/media/electronics_12.mp4', caption: 'Electronics Video 3', isVideo: true),
];

class MediaThumbPreview extends StatelessWidget {
  final GalleryPhoto photo;
  final BoxFit fit;

  const MediaThumbPreview({super.key, required this.photo, this.fit = BoxFit.cover});

  @override
  Widget build(BuildContext context) {
    if (!photo.isVideo) {
      return Image.network(
        photo.asset,
        fit: fit,
        errorBuilder: (_, __, ___) => Container(
          color: Colors.grey.shade200,
          child: const Icon(Icons.broken_image, color: Colors.grey, size: 40),
        ),
      );
    }
    return VideoThumb(photo: photo, fit: fit);
  }
}

class VideoThumb extends StatefulWidget {
  final GalleryPhoto photo;
  final BoxFit fit;

  const VideoThumb({super.key, required this.photo, this.fit = BoxFit.cover});

  @override
  State<VideoThumb> createState() => _VideoThumbState();
}

class _VideoThumbState extends State<VideoThumb> {
  late VideoPlayerController _controller;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.photo.url));
    _controller.initialize().then((_) {
      if (mounted) setState(() => _ready = true);
    }).catchError((e) {
      if (mounted) setState(() => _ready = false);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      child: _ready
          ? FittedBox(
              fit: widget.fit,
              clipBehavior: Clip.hardEdge,
              child: SizedBox(
                width: _controller.value.size.width,
                height: _controller.value.size.height,
                child: VideoPlayer(_controller),
              ),
            )
          : const Center(
              child: SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white54),
              ),
            ),
    );
  }
}

class PhotoGalleryScreen extends StatelessWidget {
  const PhotoGalleryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        body: NestedScrollView(
          headerSliverBuilder: (context, innerBoxScrolled) => [
            SliverAppBar(
              expandedHeight: 120,
              floating: true,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                titlePadding: const EdgeInsets.only(left: 20, bottom: 48),
                centerTitle: false,
                title: Text(
                  'Gallery',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: AppColors.heroGradient,
                  ),
                ),
              ),
              bottom: const TabBar(
                indicatorColor: Colors.white,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white60,
                tabs: [
                  Tab(text: 'Photos'),
                  Tab(text: 'Stories'),
                ],
              ),
            ),
          ],
          body: const TabBarView(
            children: [
              _PhotosTab(photos: kCampusMedia),
              _StoriesTab(photos: kCampusMedia),
            ],
          ),
        ),
      ),
    );
  }
}

class _PhotosTab extends StatelessWidget {
  final List<GalleryPhoto> photos;

  const _PhotosTab({required this.photos});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          sliver: SliverToBoxAdapter(
            child: _FeaturedCard(photo: photos.first),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 80),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.72,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) => _PhotoTile(
                photo: photos[index],
                onTap: () => _openViewer(context, index),
              ),
              childCount: photos.length,
            ),
          ),
        ),
      ],
    );
  }

  void _openViewer(BuildContext context, int initialIndex) {
    Navigator.push(
      context,
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 300),
        reverseTransitionDuration: const Duration(milliseconds: 250),
        pageBuilder: (_, __, ___) => FullscreenPhotoViewer(
          photos: photos,
          initialIndex: initialIndex,
        ),
        transitionsBuilder: (_, animation, __, child) =>
            FadeTransition(opacity: animation, child: child),
      ),
    );
  }
}

class _FeaturedCard extends StatelessWidget {
  final GalleryPhoto photo;

  const _FeaturedCard({required this.photo});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => const FullscreenPhotoViewer(photos: kCampusMedia, initialIndex: 0),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          fit: StackFit.expand,
          children: [
            SizedBox(
              height: 220,
              width: double.infinity,
              child: MediaThumbPreview(photo: photo, fit: BoxFit.cover),
            ),
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Colors.black.withValues(alpha: 0.55)],
                  ),
                ),
              ),
            ),
            Positioned(
              top: 14,
              right: 14,
              child: _CountBadge(count: kCampusMedia.length),
            ),
            Positioned(
              left: 18,
              bottom: 16,
              right: 18,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    photo.caption,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Tap to view the full collection',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CountBadge extends StatelessWidget {
  final int count;

  const _CountBadge({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(LucideIcons.image, color: Colors.white, size: 13),
          const SizedBox(width: 5),
          Text(
            '$count',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _PhotoTile extends StatelessWidget {
  final GalleryPhoto photo;
  final VoidCallback onTap;

  const _PhotoTile({required this.photo, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isVideo = photo.isVideo;
    return GestureDetector(
      onTap: onTap,
      child: Hero(
        tag: photo.asset,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Stack(
            fit: StackFit.expand,
            children: [
              MediaThumbPreview(photo: photo),
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: const [0.55, 1.0],
                      colors: [Colors.transparent, Colors.black.withValues(alpha: 0.45)],
                    ),
                  ),
                ),
              ),
              if (isVideo)
                const Center(
                  child: Icon(Icons.play_circle_fill_rounded, color: Colors.white70, size: 40),
                ),
              Positioned(
                left: 10,
                bottom: 10,
                right: 10,
                child: Text(
                  photo.caption,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StoriesTab extends StatelessWidget {
  final List<GalleryPhoto> photos;

  const _StoriesTab({required this.photos});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      itemCount: photos.length,
      separatorBuilder: (_, __) => const SizedBox(height: 14),
      itemBuilder: (context, index) {
        final photo = photos[index];
        return GestureDetector(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => FullscreenPhotoViewer(photos: photos, initialIndex: index),
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: SizedBox(
              height: 240,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  MediaThumbPreview(photo: photo),
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.centerLeft,
                          end: Alignment.bottomRight,
                          stops: const [0.3, 1.0],
                          colors: [Colors.transparent, Colors.black.withValues(alpha: 0.55)],
                        ),
                      ),
                    ),
                  ),
                  if (photo.isVideo)
                    const Center(
                      child: Icon(Icons.play_circle_fill_rounded, color: Colors.white70, size: 52),
                    ),
                  Positioned(
                    left: 16,
                    bottom: 14,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primaryAccent.withValues(alpha: 0.9),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '#${index + 1}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          photo.caption,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
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

class FullscreenPhotoViewer extends StatefulWidget {
  final List<GalleryPhoto> photos;
  final int initialIndex;

  const FullscreenPhotoViewer({
    super.key,
    required this.photos,
    required this.initialIndex,
  });

  @override
  State<FullscreenPhotoViewer> createState() => _FullscreenPhotoViewerState();
}

class _FullscreenPhotoViewerState extends State<FullscreenPhotoViewer> {
  late final PageController _pageController;
  late int _index;
  final TransformationController _transformController = TransformationController();

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    _transformController.dispose();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    super.dispose();
  }

  void _resetZoom() {
    if (_transformController.value != Matrix4.identity()) {
      _transformController.value = Matrix4.identity();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            PageView.builder(
              controller: _pageController,
              itemCount: widget.photos.length,
              onPageChanged: (i) {
                setState(() => _index = i);
                _resetZoom();
              },
              itemBuilder: (context, i) {
                final photo = widget.photos[i];
                if (photo.isVideo) {
                  return Center(child: VideoPlayerScreen(photo: photo));
                }
                return Center(
                  child: InteractiveViewer(
                    transformationController: _transformController,
                    maxScale: 4,
                    minScale: 1,
                    panEnabled: true,
                    child: Hero(
                      tag: photo.asset,
                      child: Image.network(
                        photo.asset,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) =>
                            const Icon(Icons.broken_image, color: Colors.grey, size: 64),
                      ),
                    ),
                  ),
                );
              },
            ),
            SafeArea(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                          onPressed: () => Navigator.pop(context),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '${_index + 1} / ${widget.photos.length}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  if (widget.photos[_index].caption.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 26),
                      child: Text(
                        widget.photos[_index].caption,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.92),
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class VideoPlayerScreen extends StatefulWidget {
  final GalleryPhoto photo;

  const VideoPlayerScreen({super.key, required this.photo});

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  late VideoPlayerController _controller;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.photo.url));
    _controller.initialize().then((_) {
      if (mounted) {
        setState(() => _initialized = true);
        _controller.setLooping(false);
      }
    });
    _controller.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }
    final aspect = _controller.value.aspectRatio;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: AspectRatio(
        aspectRatio: aspect,
        child: Stack(
          alignment: Alignment.bottomCenter,
          children: [
            VideoPlayer(_controller),
            VideoProgressIndicator(
              _controller,
              allowScrubbing: true,
              colors: const VideoProgressColors(
                playedColor: Colors.white,
                bufferedColor: Colors.white38,
                backgroundColor: Colors.white12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
