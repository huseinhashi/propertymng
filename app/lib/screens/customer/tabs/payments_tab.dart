import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/utils/AppColor.dart';
import 'package:app/services/repair_service.dart';
import 'package:intl/intl.dart';
import 'package:app/screens/customer/order_details_screen.dart';

class PaymentsTab extends StatefulWidget {
  const PaymentsTab({Key? key}) : super(key: key);

  @override
  State<PaymentsTab> createState() => _PaymentsTabState();
}

class _PaymentsTabState extends State<PaymentsTab> {
  final RepairService _repairService = RepairService();
  bool _isLoading = true;
  String? _error;
  List<dynamic> _serviceOrders = [];
  List<dynamic> _payments = [];
  bool _processingPayment = false;

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
      final response = await _repairService.getCustomerServiceOrders();

      setState(() {
        _isLoading = false;
        if (response['success'] == true && response['data'] != null) {
          _serviceOrders = response['data'] as List<dynamic>;

          // Extract all payments from service orders
          _payments = [];
          for (var order in _serviceOrders) {
            if (order['payments'] != null) {
              final orderPayments = order['payments'] as List<dynamic>;
              for (var payment in orderPayments) {
                // Add service order details to the payment for reference
                payment['service_order'] = {
                  'service_order_id': order['service_order_id'],
                  'status': order['status'],
                  'bid': order['bid'],
                };
                _payments.add(payment);
              }
            }
          }

          // Sort payments by date (newest first)
          _payments.sort((a, b) {
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

  Future<void> _processPayment(int serviceOrderId) async {
    setState(() {
      _processingPayment = true;
    });

    try {
      final response = await _repairService.processPayment(serviceOrderId);

      if (response['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment processed successfully',
                style: GoogleFonts.poppins()),
            backgroundColor: Colors.green,
          ),
        );
        // Refresh data after payment
        await _fetchServiceOrders();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response['message'] ?? 'Payment failed',
                style: GoogleFonts.poppins()),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e', style: GoogleFonts.poppins()),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _processingPayment = false;
      });
    }
  }

  // Process a single payment by ID
  Future<void> _processSinglePayment(int paymentId) async {
    setState(() {
      _processingPayment = true;
    });

    try {
      final response = await _repairService.processSinglePayment(paymentId);

      if (response['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment processed successfully',
                style: GoogleFonts.poppins()),
            backgroundColor: Colors.green,
          ),
        );
        // Refresh data after payment
        await _fetchServiceOrders();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response['message'] ?? 'Payment failed',
                style: GoogleFonts.poppins()),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e', style: GoogleFonts.poppins()),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _processingPayment = false;
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Error loading payments',
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

    if (_payments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.payment, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No Payments Yet',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your payment history will appear here',
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
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Payment History",
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
            const SizedBox(height: 16),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _payments.length,
              itemBuilder: (context, index) {
                final payment = _payments[index];
                final isPending = payment['status'] == 'pending';
                final serviceOrderId =
                    payment['service_order']['service_order_id'];
                final requestDescription = payment['service_order']['bid']
                        ?['repair_request']?['description'] ??
                    'Service Order';

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: isPending
                        ? BorderSide(
                            color: Colors.orange.withOpacity(0.5), width: 1)
                        : BorderSide.none,
                  ),
                  child: Column(
                    children: [
                      ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: isPending
                                ? Colors.orange.withOpacity(0.1)
                                : Colors.green.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            isPending
                                ? Icons.pending_actions
                                : Icons.check_circle_outline,
                            color: isPending ? Colors.orange : Colors.green,
                          ),
                        ),
                        title: Text(
                          "${payment['type'].toString().capitalize()} Payment",
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: textPrimaryColor,
                          ),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              payment['reason'] as String? ??
                                  "Payment for service",
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                color: textSecondaryColor,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "For: $requestDescription",
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: primaryColor,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatDate(payment['createdAt']),
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                color: textSecondaryColor,
                              ),
                            ),
                          ],
                        ),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              "\$${payment['amount']}",
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: textPrimaryColor,
                              ),
                            ),
                            Text(
                              payment['status'].toString().toUpperCase(),
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: isPending ? Colors.orange : Colors.green,
                              ),
                            ),
                          ],
                        ),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => OrderDetailsScreen(
                                orderId: serviceOrderId,
                              ),
                            ),
                          ).then((_) => _fetchServiceOrders());
                        },
                      ),
                      if (isPending)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: const BorderRadius.only(
                              bottomLeft: Radius.circular(12),
                              bottomRight: Radius.circular(12),
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: TextButton.icon(
                                  icon: const Icon(Icons.visibility, size: 18),
                                  label: Text(
                                    "View Order",
                                    style: GoogleFonts.poppins(fontSize: 13),
                                  ),
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            OrderDetailsScreen(
                                          orderId: serviceOrderId,
                                        ),
                                      ),
                                    ).then((_) => _fetchServiceOrders());
                                  },
                                  style: TextButton.styleFrom(
                                    foregroundColor: primaryColor,
                                  ),
                                ),
                              ),
                              Expanded(
                                child: ElevatedButton.icon(
                                  icon: _processingPayment
                                      ? const SizedBox(
                                          width: 18,
                                          height: 18,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Icon(Icons.payment, size: 18),
                                  label: Text(
                                    "Pay Now",
                                    style: GoogleFonts.poppins(fontSize: 13),
                                  ),
                                  onPressed: _processingPayment
                                      ? null
                                      : () => _processSinglePayment(
                                          payment['payment_id']),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: accentColor,
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 10),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

extension StringExtension on String {
  String capitalize() {
    return "${this[0].toUpperCase()}${substring(1)}";
  }
}
