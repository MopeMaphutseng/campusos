import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppLocalizations {
  final Map<String, String> _translations;
  final String locale;

  AppLocalizations(this._translations, this.locale);

  String translate(String key) {
    return _translations[key] ?? key;
  }

  String operator [](String key) => translate(key);

  static Future<AppLocalizations> load(String locale) async {
    final jsonString = await rootBundle.loadString('assets/translations/$locale.json');
    final Map<String, String> translations = Map<String, String>.from(json.decode(jsonString));
    return AppLocalizations(translations, locale);
  }
}

final localizationsProvider = FutureProvider<AppLocalizations>((ref) async {
  return AppLocalizations.load('en');
});

final currentLocaleProvider = StateProvider<String>((ref) => 'en');
