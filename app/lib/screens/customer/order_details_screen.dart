import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/utils/AppColor.dart';
import 'package:app/services/repair_service.dart';
import 'package:app/screens/customer/request_details_screen.dart';
import 'package:intl/intl.dart';

class OrderDetailsScreen extends StatefulWidget {
  final int orderId;

  const OrderDetailsScreen({
    Key? key,
    required this.orderId,
  }) : super(key: key);

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {
  final RepairService _repairService = RepairService();
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _orderDetails;
  bool _processingPayment = false;
  Map<String, dynamic>? _refundStatus;
  List<Map<String, dynamic>> _refunds = [];
  bool _isLoadingRefunds = false;

  @override
  void initState() {
    super.initState();
    _fetchOrderDetails();
    _fetchRefunds();
  }

  Future<void> _fetchOrderDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _repairService.getServiceOrderById(widget.orderId);

      setState(() {
        _isLoading = false;
        if (response['success'] == true && response['data'] != null) {
          _orderDetails = response['data'];
        } else {
          _error = response['message'] ?? 'Failed to load order details';
        }
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Error: $e';
      });
    }
  }

  Future<void> _fetchRefunds() async {
    setState(() {
      _isLoadingRefunds = true;
    });
    final response =
        await _repairService.getRefundRequestsForOrder(widget.orderId);
    if (response['success'] == true && response['data'] != null) {
      setState(() {
        _refunds = List<Map<String, dynamic>>.from(response['data']);
        _refundStatus = _refunds.isNotEmpty ? _refunds.last : null;
        _isLoadingRefunds = false;
      });
    } else {
      setState(() {
        _isLoadingRefunds = false;
      });
    }
  }

  Future<void> _processPayment() async {
    setState(() {
      _processingPayment = true;
    });

    try {
      final response = await _repairService.processPayment(widget.orderId);

      if (response['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment processed successfully',
                style: GoogleFonts.poppins()),
            backgroundColor: Colors.green,
          ),
        );
        // Refresh data after payment
        await _fetchOrderDetails();
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
        await _fetchOrderDetails();
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Order Details',
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorView()
              : _orderDetails != null
                  ? _buildOrderDetails()
                  : const Center(child: Text('No data available')),
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
            'Error loading order details',
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
            onPressed: _fetchOrderDetails,
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

  Widget _buildOrderDetails() {
    final hasRepairRequest = _orderDetails!['bid'] != null &&
        _orderDetails!['bid']['repair_request'] != null;
    final repairRequest =
        hasRepairRequest ? _orderDetails!['bid']['repair_request'] : null;

    // Safely convert bid amount to double
    final bidAmount = _orderDetails!['bid'] != null
        ? _parseAmount(_orderDetails!['bid']['amount'])
        : 0.0;

    final hasPendingPayment = _orderDetails!['payments'] != null &&
        (_orderDetails!['payments'] as List)
            .any((payment) => payment['status'] == 'pending');

    // Calculate total paid and remaining amount
    double totalPaid = 0;
    double totalAmount = 0;

    if (_orderDetails!['payments'] != null) {
      final payments = _orderDetails!['payments'] as List;
      for (final payment in payments) {
        // Safely parse the amount value to double
        final amount = _parseAmount(payment['amount']);
        totalAmount += amount;
        if (payment['status'] == 'paid') {
          totalPaid += amount;
        }
      }
    }

    return RefreshIndicator(
      onRefresh: _fetchOrderDetails,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status and date section
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Service Order',
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: textPrimaryColor,
                          ),
                        ),
                        Text(
                          '#${_orderDetails!['service_order_id']}',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: primaryColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _getStatusColor(_orderDetails!['status'])
                                .withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: _getStatusColor(_orderDetails!['status'])
                                  .withOpacity(0.5),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Text(
                                _getStatusIcon(_orderDetails!['status']),
                                style: const TextStyle(fontSize: 16),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _orderDetails!['status']
                                    .toString()
                                    .toUpperCase(),
                                style: GoogleFonts.poppins(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color:
                                      _getStatusColor(_orderDetails!['status']),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Created: ${_formatDate(_orderDetails!['createdAt'])}',
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              color: textSecondaryColor,
                            ),
                            textAlign: TextAlign.right,
                          ),
                        ),
                      ],
                    ),
                    if (hasRepairRequest) ...[
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 12),
                      Text(
                        'Repair Request',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: textPrimaryColor,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        repairRequest['description'] ??
                            'No description available',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: textSecondaryColor,
                        ),
                      ),
                      if (repairRequest['request_id'] != null) ...[
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          icon: const Icon(Icons.visibility, size: 18),
                          label: Text(
                            'View Full Request Details',
                            style: GoogleFonts.poppins(fontSize: 13),
                          ),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => RequestDetailsScreen(
                                  requestId: repairRequest['request_id'],
                                ),
                              ),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: primaryColor,
                            side: BorderSide(
                                color: primaryColor.withOpacity(0.5)),
                          ),
                        ),
                      ],
                    ],
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // // Mark as Delivered and Refund buttons (if completed)
            // _buildRefundSection(),

            // Payment summary section
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Payment Summary',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: textPrimaryColor,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildSummaryRow('Original Bid Amount',
                        '\$${bidAmount.toStringAsFixed(2)}'),
                    _buildSummaryRow('Total Service Amount',
                        '\$${totalAmount.toStringAsFixed(2)}'),
                    _buildSummaryRow(
                        'Amount Paid', '\$${totalPaid.toStringAsFixed(2)}'),
                    if (totalAmount - totalPaid > 0)
                      _buildSummaryRow(
                        'Remaining Balance',
                        '\$${(totalAmount - totalPaid).toStringAsFixed(2)}',
                        valueColor: Colors.red,
                      ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Payments list
            if (_orderDetails!['payments'] != null &&
                (_orderDetails!['payments'] as List).isNotEmpty) ...[
              Text(
                'Payment History',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: textPrimaryColor,
                ),
              ),
              const SizedBox(height: 12),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: (_orderDetails!['payments'] as List).length,
                itemBuilder: (context, index) {
                  final payment = (_orderDetails!['payments'] as List)[index];
                  final isPending = payment['status'] == 'pending';
                  final paymentId = payment['payment_id'];

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    elevation: 1,
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
                          contentPadding: const EdgeInsets.all(12),
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
                            "${payment['type'].toString()[0].toUpperCase()}${payment['type'].toString().substring(1)} Payment",
                            style: GoogleFonts.poppins(
                              fontSize: 15,
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
                                "\$${_parseAmount(payment['amount']).toStringAsFixed(2)}",
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
                                  color:
                                      isPending ? Colors.orange : Colors.green,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (isPending)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: const BorderRadius.only(
                                bottomLeft: Radius.circular(12),
                                bottomRight: Radius.circular(12),
                              ),
                            ),
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
                                style: GoogleFonts.poppins(fontSize: 14),
                              ),
                              onPressed: _processingPayment
                                  ? null
                                  : () => _processSinglePayment(paymentId),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: accentColor,
                                foregroundColor: Colors.white,
                                padding:
                                    const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ],

            // Refunds section (moved here after payments)
            _buildRefundSection(),

            const SizedBox(height: 30),

            // Info message about pending payments
            if (hasPendingPayment)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.info_outline,
                          color: Colors.blue,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          "Payment Information",
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "This order has pending payments. Please select a specific payment from the list above and click 'Pay Now' to process it.",
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: textPrimaryColor,
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

  Widget _buildSummaryRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: textSecondaryColor,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color: valueColor ?? textPrimaryColor,
            ),
          ),
        ],
      ),
    );
  }

  // Helper method to safely parse amount values
  double _parseAmount(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) {
      try {
        return double.parse(value);
      } catch (e) {
        return 0.0;
      }
    }
    return 0.0;
  }

  Future<void> _showRefundDialog({Map<String, dynamic>? refund}) async {
    final TextEditingController reasonController =
        TextEditingController(text: refund?['reason'] ?? '');
    final amount = _orderDetails?['total_price']?.toString() ?? '';
    final isUpdate = refund != null;
    final formKey = GlobalKey<FormState>();
    final result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(isUpdate ? 'Update Refund Request' : 'Request Refund',
              style: GoogleFonts.poppins()),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  initialValue: amount,
                  enabled: false,
                  decoration: InputDecoration(labelText: 'Amount'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: reasonController,
                  decoration: InputDecoration(labelText: 'Reason'),
                  maxLines: 3,
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Reason required' : null,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text('Cancel', style: GoogleFonts.poppins()),
            ),
            ElevatedButton(
              onPressed: () async {
                if (formKey.currentState!.validate()) {
                  if (isUpdate) {
                    final resp = await _repairService.updateRefundRequest(
                        refundId: refund!['refund_id'],
                        reason: reasonController.text);
                    if (resp['success'] == true) {
                      Navigator.pop(context, true);
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(resp['message'] ?? 'Failed')));
                    }
                  } else {
                    final resp = await _repairService.createRefundRequest(
                        orderId: widget.orderId, reason: reasonController.text);
                    if (resp['success'] == true) {
                      Navigator.pop(context, true);
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(resp['message'] ?? 'Failed')));
                    }
                  }
                }
              },
              child: Text(isUpdate ? 'Update' : 'Submit',
                  style: GoogleFonts.poppins()),
            ),
          ],
        );
      },
    );
    if (result == true) {
      _fetchRefunds();
      _fetchOrderDetails();
    }
  }

  Widget _buildRefundSection() {
    if (_isLoadingRefunds) {
      return const Center(child: CircularProgressIndicator());
    }
    final hasRefund = _refunds.isNotEmpty;
    final latestRefund = hasRefund ? _refunds.last : null;
    final refundStatus = latestRefund != null ? latestRefund['status'] : null;
    final isRefundDisabled =
        refundStatus == 'requested' || refundStatus == 'approved';
    final isDeliveredDisabled = isRefundDisabled;
    Color _getRefundStatusColor(String? status) {
      switch (status) {
        case 'approved':
          return Colors.green;
        case 'requested':
          return Colors.orange;
        case 'rejected':
          return Colors.red;
        default:
          return Colors.grey;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        Text(
          'Refunds',
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: textPrimaryColor,
          ),
        ),
        const SizedBox(height: 12),
        if (_refunds.isEmpty)
          Card(
            elevation: 1,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'No refund requests yet.',
                style: GoogleFonts.poppins(
                    fontSize: 14, color: textSecondaryColor),
              ),
            ),
          ),
        if (_refunds.isNotEmpty)
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _refunds.length,
            itemBuilder: (context, idx) {
              final refund = _refunds[idx];
              final statusColor = _getRefundStatusColor(refund['status']);
              return Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side:
                      BorderSide(color: statusColor.withOpacity(0.3), width: 1),
                ),
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      refund['status'] == 'approved'
                          ? Icons.check_circle_outline
                          : refund['status'] == 'requested'
                              ? Icons.pending_actions
                              : Icons.cancel_outlined,
                      color: statusColor,
                    ),
                  ),
                  title: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Refund #${refund['refund_id']}',
                        style: GoogleFonts.poppins(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: textPrimaryColor,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border:
                              Border.all(color: statusColor.withOpacity(0.5)),
                        ),
                        child: Text(
                          refund['status'].toString().toUpperCase(),
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: statusColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 6),
                      Text('Amount: ${refund['amount']}',
                          style: GoogleFonts.poppins(fontSize: 14)),
                      if (refund['reason'] != null &&
                          refund['reason'].toString().isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text('Reason: ${refund['reason']}',
                              style: GoogleFonts.poppins(
                                  fontSize: 13, color: textSecondaryColor)),
                        ),
                      if (refund['decision_notes'] != null &&
                          refund['decision_notes'].toString().isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                              'Admin Notes: ${refund['decision_notes']}',
                              style: GoogleFonts.poppins(
                                  fontSize: 13, color: textSecondaryColor)),
                        ),
                      if (refund['decided_at'] != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                              'Decided at: ${_formatDate(refund['decided_at'])}',
                              style: GoogleFonts.poppins(
                                  fontSize: 12, color: textSecondaryColor)),
                        ),
                    ],
                  ),
                  trailing: refund['status'] == 'requested'
                      ? Row(mainAxisSize: MainAxisSize.min, children: [
                          IconButton(
                            icon: Icon(Icons.edit, color: Colors.blue),
                            onPressed: () => _showRefundDialog(refund: refund),
                            tooltip: 'Edit',
                          ),
                          IconButton(
                            icon: Icon(Icons.delete, color: Colors.red),
                            onPressed: () async {
                              final resp = await _repairService
                                  .deleteRefundRequest(refund['refund_id']);
                              if (resp['success'] == true) {
                                _fetchRefunds();
                                _fetchOrderDetails();
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                        content:
                                            Text(resp['message'] ?? 'Failed')));
                              }
                            },
                            tooltip: 'Delete',
                          ),
                        ])
                      : null,
                ),
              );
            },
          ),
        const SizedBox(height: 12),
        if (!isRefundDisabled && _orderDetails!['status'] == 'completed')
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => _showRefundDialog(),
              child: Text('Request Refund'),
            ),
          ),
        const SizedBox(height: 12),
        if (!isDeliveredDisabled && _orderDetails!['status'] == 'completed')
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                final response =
                    await _repairService.markOrderAsDelivered(widget.orderId);
                if (response['success'] == true) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Order marked as delivered')),
                  );
                  _fetchOrderDetails();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                        content: Text(response['message'] ??
                            'Failed to mark as delivered')),
                  );
                }
              },
              child: Text('Mark as Delivered'),
            ),
          ),
      ],
    );
  }
}
