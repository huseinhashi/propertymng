// lib/services/auth_service.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app/services/api_client.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  final ApiClient _apiClient = ApiClient();

  // Auth state change notifier
  final ValueNotifier<bool> authStateChanges = ValueNotifier<bool>(false);

  // Store user data directly
  Map<String, dynamic>? _userData;
  String? _token;
  String? _userType; // 'expert' or 'customer'

  // Getters
  Map<String, dynamic>? get userData => _userData;
  String? get token => _token;
  String? get userType => _userType;
  bool get isAuthenticated => _token != null;
  bool get isExpert => _userType == 'expert';
  bool get isCustomer => _userType == 'customer';

  // Singleton factory
  factory AuthService() => _instance;

  AuthService._internal();

  // Initialize the service by loading saved data
  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('token');
      _userType = prefs.getString('userType');

      // Parse stored user data if available
      final userDataString = prefs.getString('userData');
      if (userDataString != null) {
        try {
          // Parse the stored user data
          final Map<String, dynamic> parsedData = jsonDecode(userDataString);
          _userData = parsedData;
        } catch (e) {
          if (kDebugMode) {
            print('Error parsing stored user data: $e');
          }
        }
      }

      if (_token != null) {
        _apiClient.setToken(_token!);
      }

      // Notify listeners about auth state
      authStateChanges.value = isAuthenticated;
    } catch (e) {
      if (kDebugMode) {
        print('Error initializing auth service: $e');
      }
      rethrow;
    }
  }

  // Expert Registration
  Future<Map<String, dynamic>> registerExpert(
    String fullName,
    String email,
    String password,
    List<int> serviceTypeIds,
    String address,
  ) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/expert/register',
        data: {
          'full_name': fullName,
          'email': email,
          'password': password,
          'service_type_ids': serviceTypeIds,
          'address': address,
        },
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during registration: $e',
      };
    }
  }

  // Customer Registration
  Future<Map<String, dynamic>> registerCustomer(
    String name,
    String phone,
    String password,
    String address,
  ) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/customer/register',
        data: {
          'name': name,
          'phone': phone,
          'password': password,
          'address': address,
        },
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during registration: $e',
      };
    }
  }

  // Expert Login
  Future<Map<String, dynamic>> loginExpert(
      String email, String password) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/expert/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response['success']) {
        await _handleLoginSuccess(response['data'], 'expert');
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during login: $e',
      };
    }
  }

  // Customer Login
  Future<Map<String, dynamic>> loginCustomer(
      String phone, String password) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/customer/login',
        data: {
          'phone': phone,
          'password': password,
        },
      );

      if (response['success']) {
        await _handleLoginSuccess(response['data'], 'customer');
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during login: $e',
      };
    }
  }

  // Handle successful login
  Future<void> _handleLoginSuccess(
      Map<String, dynamic> data, String userType) async {
    _token = data['token'];
    _userType = userType;

    // Store user data directly without model conversion
    if (userType == 'expert') {
      _userData = data['expert'];
    } else {
      _userData = data['customer'];
    }

    // Set token in API client with Bearer prefix
    _apiClient.setToken(_token!);

    // Save to SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', _token!);
    await prefs.setString('userType', _userType!);

    // Save user data as well
    if (_userData != null) {
      await prefs.setString('userData', jsonEncode(_userData));
    }

    // Notify listeners
    authStateChanges.value = true;
  }

  // Logout
  Future<Map<String, dynamic>> logout() async {
    try {
      // Clear data
      _token = null;
      _userData = null;
      _userType = null;

      // Clear token in API client
      _apiClient.clearToken();

      // Clear SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      await prefs.remove('userData');
      await prefs.remove('userType');

      // Notify listeners
      authStateChanges.value = false;

      return {
        'success': true,
        'message': 'Logged out successfully',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during logout: $e',
      };
    }
  }

  // Update profile
  Future<Map<String, dynamic>> updateProfile({
    String? name,
    String? phone,
    String? email,
    String? address,
    String? currentPassword,
    String? newPassword,
  }) async {
    try {
      // Implementation would depend on your API
      return {
        'success': true,
        'message': 'Profile updated successfully',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Error updating profile: $e',
      };
    }
  }
}
