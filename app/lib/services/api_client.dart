// lib/services/api_client.dart
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mime/mime.dart';
import 'package:http_parser/http_parser.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  late final Dio _dio;

  // Adjust this base URL to your actual backend server URL
  static const String baseUrl = 'http://192.168.100.75:5000/api/v1';

  // Singleton pattern
  factory ApiClient() => _instance;

  // Public method to ensure API client is initialized with token
  Future<void> initialize() async {
    await _loadTokenFromPrefs();
    if (kDebugMode) {
      print('🚀 API client initialized');
    }
  }

  ApiClient._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      validateStatus: (status) => true, // Handle all status codes ourselves
      connectTimeout: const Duration(seconds: 30), // Increase timeout
      receiveTimeout: const Duration(seconds: 30), // Increase timeout
    ));

    // Add logging interceptor in debug mode
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
      ));
    }

    // Add auth interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Get token from shared preferences for each request
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('token');

          if (token != null) {
            if (kDebugMode) {
              print('🔐 Adding token to request header');
            }
            options.headers['Authorization'] = 'Bearer $token';
          } else if (kDebugMode) {
            print('⚠️ No token available for request');
          }

          return handler.next(options);
        },
      ),
    );

    // Initialize token from SharedPreferences on creation
    _loadTokenFromPrefs();
  }

  Future<void> _loadTokenFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token != null) {
        setToken(token);
        if (kDebugMode) {
          print('🔑 Token loaded from preferences');
        }
      } else if (kDebugMode) {
        print('⚠️ No token found in preferences');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error loading token: $e');
      }
    }
  }

  void setToken(String token) {
    // Ensure headers are initialized
    _dio.options.headers ??= {};
    // Set with Bearer prefix if not already included
    if (!token.startsWith('Bearer ')) {
      token = 'Bearer $token';
    }
    _dio.options.headers!['Authorization'] = token;

    if (kDebugMode) {
      print('🔑 Token set in API client');
    }
  }

  void clearToken() {
    _dio.options.headers?.remove('Authorization');
    if (kDebugMode) {
      print('🔒 Token cleared from API client');
    }
  }

  // Generic request method
  Future<Map<String, dynamic>> request({
    required String method,
    required String path,
    Map<String, dynamic>? data,
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      Response response;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await _dio.get(path, queryParameters: queryParameters);
          break;
        case 'POST':
          response = await _dio.post(path,
              data: data, queryParameters: queryParameters);
          break;
        case 'PATCH':
          response = await _dio.patch(path,
              data: data, queryParameters: queryParameters);
          break;
        case 'DELETE':
          response = await _dio.delete(path,
              data: data, queryParameters: queryParameters);
          break;
        default:
          throw Exception('Unsupported method: $method');
      }

      // Handle success response (2xx status codes)
      if (response.statusCode! >= 200 && response.statusCode! < 300) {
        return _processSuccessResponse(response);
      } else {
        return _processErrorResponse(response);
      }
    } on DioException catch (e) {
      return _processDioException(e);
    } catch (e) {
      return {
        'success': false,
        'message': 'An unexpected error occurred: ${e.toString()}',
      };
    }
  }

  // Process successful API response
  Map<String, dynamic> _processSuccessResponse(Response response) {
    if (response.data is Map) {
      final Map<String, dynamic> responseData = response.data;
      return {
        'success': true,
        'data': responseData['data'] ?? responseData,
        'message': responseData['message'] ?? 'Success',
      };
    }

    return {
      'success': true,
      'data': response.data,
      'message': 'Success',
    };
  }

  // Process error response
  Map<String, dynamic> _processErrorResponse(Response response) {
    String errorMessage = 'An error occurred';

    if (kDebugMode) {
      print('API Error: ${response.statusCode} - ${response.data}');
    }

    // Check if response is HTML or text
    if (response.headers
            .value(Headers.contentTypeHeader)
            ?.contains('text/html') ==
        true) {
      errorMessage = 'Server returned unexpected response. Please try again.';
    } else if (response.data is Map) {
      // Extract error message from response data
      errorMessage = response.data['message'] ??
          response.data['error'] ??
          'Error ${response.statusCode}';
    } else if (response.data is String) {
      // Use response data as error message
      errorMessage = response.data.toString();
    } else {
      // For other error scenarios
      errorMessage = 'Server returned error code: ${response.statusCode}';
    }

    return {
      'success': false,
      'message': errorMessage,
    };
  }

  // Process Dio exceptions
  Map<String, dynamic> _processDioException(DioException error) {
    String errorMessage;

    if (kDebugMode) {
      print('Dio Error: ${error.type} - ${error.message}');
      print('Response: ${error.response?.data}');
    }

    if (error.response != null) {
      // Try to extract error message from response
      if (error.response!.data is Map) {
        errorMessage = error.response!.data['message'] ??
            error.response!.data['error'] ??
            _getErrorMessage(error);
      } else if (error.response!.data is String) {
        errorMessage = error.response!.data;
      } else {
        errorMessage = _getErrorMessage(error);
      }
    } else {
      errorMessage = _getErrorMessage(error);
    }

    return {
      'success': false,
      'message': errorMessage,
    };
  }

  // Get error message based on DioException type
  String _getErrorMessage(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timed out. Please check your internet connection.';
      case DioExceptionType.connectionError:
        return 'Unable to connect to server. Please check the server URL or try again later.';
      case DioExceptionType.badResponse:
        final response = error.response;
        // Handle HTML responses from server
        if (response != null &&
            response.headers
                    .value(Headers.contentTypeHeader)
                    ?.contains('text/html') ==
                true) {
          return 'Server error occurred. Please contact support.';
        }
        // Handle API error responses
        final statusCode = response?.statusCode;
        if (statusCode == 401)
          return 'Authentication failed. Please log in again.';
        if (statusCode == 403) return 'Permission denied.';
        if (statusCode == 404)
          return 'Server resource not found. Check server configuration.';
        if (statusCode == 400) {
          if (response?.data is Map && response?.data['message'] != null) {
            return response!.data['message'];
          }
          return 'Bad request. Please check your input.';
        }
        return 'Server error occurred (${statusCode ?? 'unknown'})';
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }

// Update the requestMultipart method in ApiClient class
  Future<Map<String, dynamic>> requestMultipart({
    required String method,
    required String path,
    Map<String, dynamic>? data,
    List<Map<String, dynamic>>? files,
  }) async {
    // Use the same base URL as the Dio client
    final url = Uri.parse('$baseUrl$path');

    try {
      // Create multipart request
      final request = http.MultipartRequest(method, url);

      // Get token from Dio headers (which should be updated by interceptor)
      final token = _dio.options.headers?['Authorization'];

      // Add auth header if token exists
      if (token != null) {
        request.headers['Authorization'] = token;
        if (kDebugMode) {
          print('🔐 Using token from API client for multipart request');
        }
      } else {
        // Fallback: Get token from preferences (should not be needed with interceptor)
        final prefs = await SharedPreferences.getInstance();
        final prefToken = prefs.getString('token');
        if (prefToken != null) {
          final tokenWithBearer =
              prefToken.startsWith('Bearer ') ? prefToken : 'Bearer $prefToken';
          request.headers['Authorization'] = tokenWithBearer;
          if (kDebugMode) {
            print('🔐 Using token from preferences for multipart request');
          }
        } else if (kDebugMode) {
          print('⚠️ No token available for multipart request');
        }
      }

      // Add content type header
      request.headers['Accept'] = 'application/json';

      // Log request in debug mode
      if (kDebugMode) {
        print('🌐 Making multipart request to: $url');
        print(
            '🔑 Token: ${request.headers.containsKey('Authorization') ? 'Present' : 'None'}');
        if (data != null) print('📦 Data: $data');
        if (files != null) print('📎 Files: ${files.length}');
      }

      // Add form fields
      if (data != null) {
        data.forEach((key, value) {
          request.fields[key] = value.toString();
        });
      }

      // Add files if any
      if (files != null && files.isNotEmpty) {
        for (var fileMap in files) {
          final fieldName = fileMap['field'] as String;
          final filePath = fileMap['path'] as String;
          final filename = fileMap['filename'] as String;

          try {
            // Get the MIME type of the file
            final mimeType = lookupMimeType(filePath) ??
                'image/jpeg'; // Default to jpeg if can't detect

            request.files.add(
              await http.MultipartFile.fromPath(
                fieldName,
                filePath,
                filename: filename,
                contentType:
                    MediaType.parse(mimeType), // Set the proper content type
              ),
            );
            if (kDebugMode) {
              print('✅ Added file: $filename with content type $mimeType');
            }
          } catch (e) {
            if (kDebugMode) {
              print('❌ Error adding file $filename: $e');
            }
            throw Exception('Error adding file $filename: $e');
          }
        }
      }
      // Send the request with a timeout
      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw TimeoutException('Connection timed out');
        },
      );

      final response = await http.Response.fromStream(streamedResponse);

      // Log response in debug mode
      if (kDebugMode) {
        print('📨 Response status: ${response.statusCode}');
        print(
            '📨 Response body: ${response.body.length > 1000 ? response.body.substring(0, 1000) + '...' : response.body}');
      }

      // Parse response
      try {
        final responseData = json.decode(response.body);
        return responseData;
      } catch (e) {
        return {
          'success': false,
          'message':
              'Failed to parse response: ${response.body.substring(0, response.body.length > 100 ? 100 : response.body.length)}',
        };
      }
    } on TimeoutException {
      if (kDebugMode) {
        print('⏱️ Request timed out');
      }
      return {
        'success': false,
        'message':
            'Request timed out. Please check your internet connection and try again.',
      };
    } catch (e) {
      if (kDebugMode) {
        print('❌ Request error: $e');
      }
      return {
        'success': false,
        'message': 'Request failed: $e',
      };
    }
  }
}

// Custom TimeoutException class
class TimeoutException implements Exception {
  final String message;
  TimeoutException(this.message);

  @override
  String toString() => message;
}
