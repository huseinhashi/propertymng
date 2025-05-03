import 'package:app/services/api_client.dart';
import 'package:flutter/foundation.dart';

class RepairService {
  final ApiClient _apiClient = ApiClient();

  // Initialize the service
  Future<void> initialize() async {
    await _apiClient.initialize();
    if (kDebugMode) {
      print('🔧 RepairService initialized');
    }
  }

// Update the createRepairRequest method in RepairService class
  Future<Map<String, dynamic>> createRepairRequest({
    required String description,
    required String location,
    required int serviceTypeId,
    required List<String> imagePaths,
  }) async {
    try {
      if (kDebugMode) {
        print('📝 Creating repair request with:');
        print('📄 Description: $description');
        print('📍 Location: $location');
        print('🔧 Service Type ID: $serviceTypeId');
        print('🖼️ Images count: ${imagePaths.length}');
      }

      // Convert image paths to the format expected by requestMultipart
      final imageFiles = imagePaths.map((path) {
        final filename = path.split('/').last;
        return {
          'field': 'images',
          'path': path,
          'filename': filename,
        };
      }).toList();

      final response = await _apiClient.requestMultipart(
        method: 'POST',
        path: '/customer/repair-requests',
        data: {
          'description': description,
          'location': location,
          'service_type_id': serviceTypeId,
        },
        files: imageFiles,
      );

      if (kDebugMode) {
        print('📊 Repair request response: ${response['success']}');
      }

      return response;
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error creating repair request: $e');
      }
      return {
        'success': false,
        'message': 'Error creating repair request: $e',
      };
    }
  }

  // Get all repair requests for the authenticated customer
  Future<Map<String, dynamic>> getCustomerRepairRequests() async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/customer/repair-requests',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching repair requests: $e',
      };
    }
  }

  // Get a specific repair request by ID
  Future<Map<String, dynamic>> getRepairRequestById(int requestId) async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/customer/repair-requests/$requestId',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching repair request details: $e',
      };
    }
  }

  // Accept a bid for a repair request
  Future<Map<String, dynamic>> acceptBid(int bidId) async {
    try {
      final response = await _apiClient.request(
        method: 'PATCH',
        path: '/customer/bids/$bidId/accept',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error accepting bid: $e',
      };
    }
  }

  // Get available repair requests for the expert to bid on (matching their service types)
  Future<Map<String, dynamic>> getAvailableRequestsForExpert() async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/expert/bids/available-requests',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching available requests: $e',
      };
    }
  }

  // Get all bids made by the expert
  Future<Map<String, dynamic>> getExpertBids() async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/expert/bids',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching your bids: $e',
      };
    }
  }

  // Get a specific repair request by ID
  Future<Map<String, dynamic>> getExpertRepairRequestById(int requestId) async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/expert/repair-requests/$requestId',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching repair request details: $e',
      };
    }
  }

  // Submit a bid for a repair request
  Future<Map<String, dynamic>> submitBid({
    required int requestId,
    required double cost,
    required String deadline,
    String? description,
  }) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/expert/bids',
        data: {
          'request_id': requestId,
          'cost': cost,
          'deadline': deadline,
          'description': description ?? '',
        },
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error submitting bid: $e',
      };
    }
  }

  // Update an existing bid
  Future<Map<String, dynamic>> updateBid({
    required int bidId,
    double? cost,
    String? deadline,
    String? description,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (cost != null) data['cost'] = cost;
      if (deadline != null) data['deadline'] = deadline;
      if (description != null) data['description'] = description;

      final response = await _apiClient.request(
        method: 'PATCH',
        path: '/expert/bids/$bidId',
        data: data,
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error updating bid: $e',
      };
    }
  }

  // Delete a bid
  Future<Map<String, dynamic>> deleteBid(int bidId) async {
    try {
      final response = await _apiClient.request(
        method: 'DELETE',
        path: '/expert/bids/$bidId',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error deleting bid: $e',
      };
    }
  }

  // Get expert's bid for a specific repair request
  Future<Map<String, dynamic>> getExpertBidForRequest(int requestId) async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/expert/bids/request/$requestId',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching bid details: $e',
      };
    }
  }

  // Get all service orders for customer
  Future<Map<String, dynamic>> getCustomerServiceOrders() async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/customer/service-orders',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching service orders: $e',
      };
    }
  }

  // Get service order details by ID
  Future<Map<String, dynamic>> getServiceOrderById(int orderId) async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/customer/service-orders/$orderId',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching service order details: $e',
      };
    }
  }

  // Process payment for a service order
  Future<Map<String, dynamic>> processPayment(int orderId) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/customer/service-orders/$orderId/payment',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error processing payment: $e',
      };
    }
  }

  // Process a single payment by ID
  Future<Map<String, dynamic>> processSinglePayment(int paymentId) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/customer/payments/$paymentId/process',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error processing payment: $e',
      };
    }
  }

  // Get all service orders for expert
  Future<Map<String, dynamic>> getExpertServiceOrders() async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/expert/service-orders',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching expert service orders: $e',
      };
    }
  }

  // Update service order status (for experts)
  Future<Map<String, dynamic>> updateServiceOrderStatus({
    required int orderId,
    required String status,
    String? completionNotes,
  }) async {
    try {
      final data = {
        'status': status,
      };

      if (completionNotes != null) {
        data['completion_notes'] = completionNotes;
      }

      final response = await _apiClient.request(
        method: 'PATCH',
        path: '/expert/service-orders/$orderId/status',
        data: data,
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error updating service order status: $e',
      };
    }
  }

  // Request additional payment (for experts)
  Future<Map<String, dynamic>> requestAdditionalPayment({
    required int orderId,
    required double amount,
    required String reason,
  }) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/expert/service-orders/$orderId/additional-payment',
        data: {
          'amount': amount,
          'reason': reason,
        },
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error requesting additional payment: $e',
      };
    }
  }

  // Get expert's service order details by ID
  Future<Map<String, dynamic>> expertGetServiceOrderById(int orderId) async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/expert/service-orders/$orderId',
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching service order details: $e',
      };
    }
  }
}
