import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/utils/AppColor.dart';
import 'package:app/services/repair_service.dart';
import 'package:intl/intl.dart';
import 'package:app/screens/expert/order_details_screen.dart';

class OrdersTab extends StatefulWidget {
  const OrdersTab({Key? key}) : super(key: key);

  @override
  State<OrdersTab> createState() => _OrdersTabState();
}

class _OrdersTabState extends State<OrdersTab> {
  final RepairService _repairService = RepairService();
  bool _isLoading = true;
  String? _error;
  List<dynamic> _serviceOrders = [];

  @override
  void initState() {
    super.initState();
    _fetchServiceOrders();
  }

  Future<void> _fetchServiceOrders() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _repairService.getExpertServiceOrders();

      setState(() {
        _isLoading = false;
        if (response['success'] == true && response['data'] != null) {
          _serviceOrders = response['data'] as List<dynamic>;

          // Sort orders by date (newest first)
          _serviceOrders.sort((a, b) {
            final aDate = DateTime.parse(
                a['createdAt'] ?? DateTime.now().toIso8601String());
            final bDate = DateTime.parse(
                b['createdAt'] ?? DateTime.now().toIso8601String());
            return bDate.compareTo(aDate);
          });
        } else {
          _error = response['message'] ?? 'Failed to load service orders';
        }
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Error: $e';
      });
    }
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return 'N/A';
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('MMM dd, yyyy').format(date);
    } catch (e) {
      return dateString;
    }
  }

  String _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return '⏳';
      case 'in_progress':
        return '🔧';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '⚙️';
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'in_progress':
        return Colors.blue;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorView()
              : _buildOrdersList(),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 48, color: Colors.red[300]),
          const SizedBox(height: 16),
          Text(
            'Error loading orders',
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: textPrimaryColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _error!,
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: textSecondaryColor,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _fetchServiceOrders,
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text('Try Again', style: GoogleFonts.poppins()),
          ),
        ],
      ),
    );
  }

  Widget _buildOrdersList() {
    if (_serviceOrders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.assignment, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No Orders Yet',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your orders will appear here',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: textSecondaryColor,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchServiceOrders,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _serviceOrders.length,
        itemBuilder: (context, index) {
          final order = _serviceOrders[index];
          final requestDescription = order['bid']?['repair_request']
                  ?['description'] ??
              'Service Order';
          final customerName = order['bid']?['repair_request']?['customer']
                  ?['name'] ??
              'Customer';

          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: InkWell(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ExpertOrderDetailsScreen(
                      orderId: order['service_order_id'],
                    ),
                  ),
                ).then((_) => _fetchServiceOrders());
              },
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Order #${order['service_order_id']}',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: primaryColor,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getStatusColor(order['status'])
                                .withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: _getStatusColor(order['status'])
                                  .withOpacity(0.5),
                            ),
                          ),
                          child: Row(
                            children: [
                              Text(
                                _getStatusIcon(order['status']),
                                style: const TextStyle(fontSize: 14),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                order['status'].toString().toUpperCase(),
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: _getStatusColor(order['status']),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      requestDescription,
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        color: textPrimaryColor,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.person,
                          size: 16,
                          color: textSecondaryColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Customer: $customerName',
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            color: textSecondaryColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_today,
                          size: 16,
                          color: textSecondaryColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Created: ${_formatDate(order['createdAt'])}',
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            color: textSecondaryColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.location_on,
                          size: 16,
                          color: textSecondaryColor,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            order['bid']?['repair_request']?['location'] ??
                                'N/A',
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              color: textSecondaryColor,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.payments_outlined,
                              size: 18,
                              color: order['payment_status'] == 'fully_paid'
                                  ? Colors.green
                                  : order['payment_status'] == 'partially_paid'
                                      ? Colors.orange
                                      : Colors.red,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              order['payment_status'] == 'fully_paid'
                                  ? 'Paid'
                                  : order['payment_status'] == 'partially_paid'
                                      ? 'Partially Paid'
                                      : 'Unpaid',
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: order['payment_status'] == 'fully_paid'
                                    ? Colors.green
                                    : order['payment_status'] ==
                                            'partially_paid'
                                        ? Colors.orange
                                        : Colors.red,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          '\$${order['total_price'] ?? order['bid']?['cost'] ?? 0}',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: textPrimaryColor,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
