import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:campusos/core/services/api_service.dart';

class CafeteriaMenuItem {
  final String id;
  final String shopId;
  final String shopName;
  final String date;
  final String mealType;
  final String itemName;
  final String description;
  final double price;
  final String currency;
  final String category;
  final List<String> dietaryFlags;
  final bool isAvailable;

  CafeteriaMenuItem({
    required this.id,
    required this.shopId,
    required this.shopName,
    required this.date,
    required this.mealType,
    required this.itemName,
    required this.description,
    required this.price,
    required this.currency,
    required this.category,
    required this.dietaryFlags,
    required this.isAvailable,
  });

  factory CafeteriaMenuItem.fromJson(Map<String, dynamic> json) {
    final rawPrice = json['price'];
    return CafeteriaMenuItem(
      id: (json['id'] ?? '').toString(),
      shopId: (json['shopId'] ?? '').toString(),
      shopName: (json['shopName'] ?? 'Cafeteria').toString(),
      date: (json['date'] ?? '').toString(),
      mealType: (json['mealType'] ?? 'lunch').toString(),
      itemName: (json['itemName'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      price: rawPrice is num
          ? rawPrice.toDouble()
          : double.tryParse(rawPrice?.toString() ?? '') ?? 0.0,
      currency: (json['currency'] ?? 'LSL').toString(),
      category: (json['category'] ?? 'Meals').toString(),
      dietaryFlags: List<String>.from(json['dietaryFlags'] ?? const []),
      isAvailable: json['isAvailable'] ?? true,
    );
  }
}

final cafeteriaMenuProvider =
    FutureProvider.family<List<CafeteriaMenuItem>, String?>((ref, mealType) async {
  final api = ref.read(apiServiceProvider);
  try {
    final raw = await api.getCafeteriaMenu(mealType: mealType);
    return raw
        .map((e) => CafeteriaMenuItem.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  } catch (_) {
    return <CafeteriaMenuItem>[];
  }
});

class ShuttleStop {
  final String name;
  final double lat;
  final double lng;
  final int order;
  final double? distanceKm;
  final int? etaMinutes;

  ShuttleStop({
    required this.name,
    required this.lat,
    required this.lng,
    required this.order,
    this.distanceKm,
    this.etaMinutes,
  });

  factory ShuttleStop.fromJson(Map<String, dynamic> json) {
    double? asDouble(dynamic v) =>
        v is num ? v.toDouble() : double.tryParse(v?.toString() ?? '');
    return ShuttleStop(
      name: (json['name'] ?? '').toString(),
      lat: asDouble(json['lat']) ?? 0,
      lng: asDouble(json['lng']) ?? 0,
      order: (json['order'] as num?)?.toInt() ?? 0,
      distanceKm: asDouble(json['distanceKm']),
      etaMinutes: (json['etaMinutes'] as num?)?.toInt(),
    );
  }
}

class TransportRoute {
  final String id;
  final String routeName;
  final String routeNumber;
  final String startLocation;
  final String endLocation;
  final List<ShuttleStop> stops;
  final String vehicleType;
  final int capacity;
  final double fare;
  final Map<String, dynamic> schedule;

  TransportRoute({
    required this.id,
    required this.routeName,
    required this.routeNumber,
    required this.startLocation,
    required this.endLocation,
    required this.stops,
    required this.vehicleType,
    required this.capacity,
    required this.fare,
    required this.schedule,
  });

  factory TransportRoute.fromJson(Map<String, dynamic> json) {
    final rawFare = json['fare'];
    return TransportRoute(
      id: (json['id'] ?? '').toString(),
      routeName: (json['routeName'] ?? '').toString(),
      routeNumber: (json['routeNumber'] ?? '').toString(),
      startLocation: (json['startLocation'] ?? '').toString(),
      endLocation: (json['endLocation'] ?? '').toString(),
      stops: List<Map<String, dynamic>>.from(json['stops'] ?? const [])
          .map(ShuttleStop.fromJson)
          .toList(),
      vehicleType: (json['vehicleType'] ?? '').toString(),
      capacity: (json['capacity'] as num?)?.toInt() ?? 0,
      fare: rawFare is num
          ? rawFare.toDouble()
          : double.tryParse(rawFare?.toString() ?? '') ?? 0.0,
      schedule: Map<String, dynamic>.from(json['schedule'] ?? const {}),
    );
  }
}

final transportRoutesProvider = FutureProvider<List<TransportRoute>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final raw = await api.getTransportRoutes();
    return raw
        .map((e) => TransportRoute.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  } catch (_) {
    return <TransportRoute>[];
  }
});

class ShuttleLive {
  final double? lat;
  final double? lng;
  final DateTime? lastUpdated;
  final List<ShuttleStop> stops;

  ShuttleLive({
    required this.lat,
    required this.lng,
    required this.lastUpdated,
    required this.stops,
  });

  factory ShuttleLive.fromJson(Map<String, dynamic> json) {
    final vehicle = Map<String, dynamic>.from(json['vehicle'] ?? const {});
    double? asDouble(dynamic v) =>
        v is num ? v.toDouble() : double.tryParse(v?.toString() ?? '');
    return ShuttleLive(
      lat: asDouble(vehicle['lat']),
      lng: asDouble(vehicle['lng']),
      lastUpdated: DateTime.tryParse(vehicle['lastUpdated']?.toString() ?? ''),
      stops: List<Map<String, dynamic>>.from(json['stops'] ?? const [])
          .map(ShuttleStop.fromJson)
          .toList(),
    );
  }
}

/// Live shuttle position for a route. Auto-refreshes every 10 seconds so the
/// tracker feels live while the screen is open.
final shuttleLiveProvider =
    FutureProvider.autoDispose.family<ShuttleLive?, String>((ref, routeId) async {
  final api = ref.read(apiServiceProvider);
  var disposed = false;
  final timer = Timer(const Duration(seconds: 10), () {
    if (!disposed) ref.invalidateSelf();
  });
  ref.onDispose(() {
    disposed = true;
    timer.cancel();
  });
  try {
    final json = await api.getTransportLive(routeId);
    if (json.isEmpty) return null;
    return ShuttleLive.fromJson(json);
  } catch (_) {
    return null;
  }
});
