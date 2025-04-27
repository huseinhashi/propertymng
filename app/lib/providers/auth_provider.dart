// lib/providers/auth_provider.dart
import 'package:app/services/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  bool _isLoading = false;
  String? _error;

  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _authService.isAuthenticated;
  Map<String, dynamic>? get userData => _authService.userData;
  String? get token => _authService.token;
  bool get isExpert => _authService.isExpert;
  bool get isCustomer => _authService.isCustomer;
  String? get userType => _authService.userType;

  AuthProvider() {
    _authService.authStateChanges.addListener(_onAuthStateChanged);
  }

  void _onAuthStateChanged() {
    notifyListeners();
  }

  Future<void> checkAuth() async {
    try {
      _setLoading(true);
      _clearError();
      await _authService.initialize();
    } catch (e) {
      _setError('Authentication check failed: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Register as Expert
  Future<bool> registerExpert(
    String fullName,
    String email,
    String password,
    List<int> serviceTypeIds,
    String address,
  ) async {
    return _performAuthOperation(() async {
      return await _authService.registerExpert(
        fullName,
        email,
        password,
        serviceTypeIds,
        address,
      );
    });
  }

  // Register as Customer
  Future<bool> registerCustomer(
    String name,
    String phone,
    String password,
    String address,
  ) async {
    return _performAuthOperation(() async {
      return await _authService.registerCustomer(
        name,
        phone,
        password,
        address,
      );
    });
  }

  // Login based on user type
  Future<bool> login(
      String identifier, String password, String userType) async {
    return _performAuthOperation(() async {
      if (userType == 'expert') {
        return await _authService.loginExpert(identifier, password);
      } else {
        return await _authService.loginCustomer(identifier, password);
      }
    });
  }

  Future<bool> logout() async {
    _clearError();
    return _performAuthOperation(() async {
      return await _authService.logout();
    });
  }

  Future<bool> updateProfile({
    String? name,
    String? phone,
    String? email,
    String? address,
    String? currentPassword,
    String? newPassword,
  }) async {
    return _performAuthOperation(() async {
      return await _authService.updateProfile(
        name: name,
        phone: phone,
        email: email,
        address: address,
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
    });
  }

  // Generic method to handle auth operations
  Future<bool> _performAuthOperation(
      Future<Map<String, dynamic>> Function() operation) async {
    try {
      _setLoading(true);
      _clearError();

      final response = await operation();

      if (!response['success']) {
        _setError(response['message']);
      }

      return response['success'];
    } catch (e) {
      _setError('Operation failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _authService.authStateChanges.removeListener(_onAuthStateChanged);
    super.dispose();
  }
}
