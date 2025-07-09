import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/utils/AppColor.dart';
import 'package:app/services/repair_service.dart';
import 'package:intl/intl.dart';
import 'package:app/screens/expert/request_detail_screen.dart';

class ExpertOrderDetailsScreen extends StatefulWidget {
  final int orderId;

  const ExpertOrderDetailsScreen({
    Key? key,
    required this.orderId,
  }) : super(key: key);

  @override
  State<ExpertOrderDetailsScreen> createState() =>
      _ExpertOrderDetailsScreenState();
}

class _ExpertOrderDetailsScreenState extends State<ExpertOrderDetailsScreen> {
  final RepairService _repairService = RepairService();
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _orderDetails;
  bool _isUpdatingStatus = false;
  bool _isRequestingPayment = false;
  // Refunds state
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
      final response =
          await _repairService.expertGetServiceOrderById(widget.orderId);

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
        await _repairService.getExpertRefundRequestsForOrder(widget.orderId);
    if (response['success'] == true && response['data'] != null) {
      setState(() {
        _refunds = List<Map<String, dynamic>>.from(response['data']);
        _isLoadingRefunds = false;
      });
    } else {
      setState(() {
        _isLoadingRefunds = false;
      });
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

    final customer = hasRepairRequest ? repairRequest['customer'] : null;

    // Safely convert bid amount to double
    final bidAmount = _orderDetails!['bid'] != null
        ? _parseAmount(_orderDetails!['bid']['amount'])
        : 0.0;

    // Format dates
    final createdDate = _formatDate(_orderDetails!['createdAt']);
    final completedDate = _orderDetails!['completed_at'] != null
        ? _formatDate(_orderDetails!['completed_at'])
        : null;
    final isRefunded = _orderDetails!['status'] == 'refunded';

    return RefreshIndicator(
      onRefresh: _fetchOrderDetails,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status and order ID section
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
                            'Created: $createdDate',
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              color: textSecondaryColor,
                            ),
                            textAlign: TextAlign.right,
                          ),
                        ),
                      ],
                    ),
                    if (completedDate != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Completed: $completedDate',
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          color: Colors.green,
                        ),
                      ),
                    ],
                    if (_orderDetails!['completion_notes'] != null &&
                        _orderDetails!['completion_notes']
                            .toString()
                            .isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(
                        'Completion Notes:',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: textSecondaryColor,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _orderDetails!['completion_notes'],
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: textPrimaryColor,
                        ),
                      ),
                    ],
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
                                builder: (context) => RequestDetailScreen(
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

            // Customer info section (with masked phone)
            if (customer != null)
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
                        'Customer Information',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: textPrimaryColor,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildCustomerInfoRow(
                        Icons.person,
                        'Name',
                        customer['name'] ?? 'N/A',
                      ),
                      const SizedBox(height: 8),
                      _buildCustomerInfoRow(
                        Icons.location_on,
                        'Location',
                        repairRequest['location'] ?? 'N/A',
                      ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 20),

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
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: textPrimaryColor,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildSummaryRow('Original Bid Amount',
                        '\$${bidAmount.toStringAsFixed(2)}'),
                    _buildSummaryRow('Base Price',
                        '\$${_parseAmount(_orderDetails!['base_price']).toStringAsFixed(2)}'),
                    if (_orderDetails!['extra_price'] != null &&
                        _parseAmount(_orderDetails!['extra_price']) > 0)
                      _buildSummaryRow('Additional Charges',
                          '\$${_parseAmount(_orderDetails!['extra_price']).toStringAsFixed(2)}',
                          valueColor: Colors.orange),
                    const Divider(),
                    _buildSummaryRow('Total Amount',
                        '\$${_parseAmount(_orderDetails!['total_price']).toStringAsFixed(2)}',
                        isBold: true),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getPaymentStatusColor(
                                _orderDetails!['payment_status'])
                            .withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _getPaymentStatusColor(
                                  _orderDetails!['payment_status'])
                              .withOpacity(0.5),
                          width: 1,
                        ),
                      ),
                      child: Text(
                        _getPaymentStatusText(_orderDetails!['payment_status']),
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: _getPaymentStatusColor(
                              _orderDetails!['payment_status']),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Additional payment request section (hide if refunded)
            if (_orderDetails!['status'] != 'completed' &&
                _orderDetails!['status'] != 'delivered' &&
                !isRefunded)
              _buildAdditionalPaymentSection(),

            const SizedBox(height: 24),

            // Update status section
            if (_orderDetails!['status'] != 'delivered')
              _buildUpdateStatusSection(),

            // Refunds section
            _buildRefundSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(
          icon,
          size: 18,
          color: textSecondaryColor,
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: textSecondaryColor,
              ),
            ),
            Text(
              value,
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: textPrimaryColor,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSummaryRow(String label, String value,
      {Color? valueColor, bool isBold = false}) {
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
              fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
              color: valueColor ?? textPrimaryColor,
            ),
          ),
        ],
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
      case 'delivered':
        return Colors.teal;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
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
      case 'delivered':
        return '🚚';
      case 'cancelled':
        return '❌';
      default:
        return '⚙️';
    }
  }

  Color _getPaymentStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'fully_paid':
        return Colors.green;
      case 'partially_paid':
        return Colors.orange;
      case 'unpaid':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getPaymentStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'fully_paid':
        return 'FULLY PAID';
      case 'partially_paid':
        return 'PARTIALLY PAID';
      case 'unpaid':
        return 'UNPAID';
      default:
        return status.toUpperCase();
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

  // Will be implemented in the next step
  Widget _buildAdditionalPaymentSection() {
    final TextEditingController amountController = TextEditingController();
    final TextEditingController reasonController = TextEditingController();
    final _additionalPaymentFormKey = GlobalKey<FormState>();

    // Get extra payments from _orderDetails
    final List<dynamic> payments = _orderDetails?['payments'] ?? [];
    final List<dynamic> extraPayments =
        payments.where((p) => p['type'] == 'extra').toList();

    return Card(
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
              'Request Additional Payment',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
            const SizedBox(height: 12),
            // List of existing extra payments
            if (extraPayments.isNotEmpty)
              ...extraPayments.map((payment) {
                final isPending = payment['status'] == 'pending';
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    'Amount: ${_parseAmount(payment['amount']).toStringAsFixed(2)}',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  subtitle: Text(
                    'Reason: ${payment['reason'] ?? ''}\nStatus: ${payment['status']}',
                    style: GoogleFonts.poppins(fontSize: 13),
                  ),
                  trailing: isPending
                      ? Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(Icons.edit, color: Colors.blue),
                              tooltip: 'Edit',
                              onPressed: () async {
                                final result =
                                    await _showEditAdditionalPaymentDialog(
                                        payment);
                                if (result != null) {
                                  setState(() {
                                    _isRequestingPayment = true;
                                  });
                                  try {
                                    final response = await _repairService
                                        .updateAdditionalPayment(
                                      orderId: widget.orderId,
                                      paymentId: payment['payment_id'],
                                      amount: double.parse(result['amount']),
                                      reason: result['reason'],
                                    );
                                    if (response['success'] == true) {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                            content: Text(
                                                'Additional payment updated',
                                                style: GoogleFonts.poppins()),
                                            backgroundColor: Colors.green),
                                      );
                                      _fetchOrderDetails();
                                    } else {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                            content: Text(
                                                response['message'] ??
                                                    'Failed to update payment',
                                                style: GoogleFonts.poppins()),
                                            backgroundColor: Colors.red),
                                      );
                                    }
                                  } catch (e) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                          content: Text('Error: $e',
                                              style: GoogleFonts.poppins()),
                                          backgroundColor: Colors.red),
                                    );
                                  } finally {
                                    setState(() {
                                      _isRequestingPayment = false;
                                    });
                                  }
                                }
                              },
                            ),
                            IconButton(
                              icon: Icon(Icons.delete, color: Colors.red),
                              tooltip: 'Delete',
                              onPressed: () async {
                                final shouldDelete =
                                    await _showDeleteAdditionalPaymentDialog(
                                        payment);
                                if (shouldDelete == true) {
                                  setState(() {
                                    _isRequestingPayment = true;
                                  });
                                  try {
                                    final response = await _repairService
                                        .deleteAdditionalPayment(
                                      orderId: widget.orderId,
                                      paymentId: payment['payment_id'],
                                    );
                                    if (response['success'] == true) {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                            content: Text(
                                                'Additional payment deleted',
                                                style: GoogleFonts.poppins()),
                                            backgroundColor: Colors.green),
                                      );
                                      _fetchOrderDetails();
                                    } else {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                            content: Text(
                                                response['message'] ??
                                                    'Failed to delete payment',
                                                style: GoogleFonts.poppins()),
                                            backgroundColor: Colors.red),
                                      );
                                    }
                                  } catch (e) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                          content: Text('Error: $e',
                                              style: GoogleFonts.poppins()),
                                          backgroundColor: Colors.red),
                                    );
                                  } finally {
                                    setState(() {
                                      _isRequestingPayment = false;
                                    });
                                  }
                                }
                              },
                            ),
                          ],
                        )
                      : null,
                );
              }),
            if (extraPayments.isNotEmpty) const Divider(),
            // Form to add new additional payment
            Form(
              key: _additionalPaymentFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextFormField(
                    controller: amountController,
                    keyboardType:
                        TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: 'Amount',
                      labelStyle: GoogleFonts.poppins(
                        color: textSecondaryColor,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      prefixIcon: const Icon(Icons.attach_money),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter an amount';
                      }
                      try {
                        final amount = double.parse(value);
                        if (amount <= 0) {
                          return 'Amount must be greater than zero';
                        }
                      } catch (e) {
                        return 'Please enter a valid number';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: reasonController,
                    decoration: InputDecoration(
                      labelText: 'Reason for additional payment',
                      labelStyle: GoogleFonts.poppins(
                        color: textSecondaryColor,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      prefixIcon: const Icon(Icons.description),
                    ),
                    maxLines: 3,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please provide a reason';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isRequestingPayment
                          ? null
                          : () async {
                              if (_additionalPaymentFormKey.currentState!
                                  .validate()) {
                                setState(() {
                                  _isRequestingPayment = true;
                                });
                                try {
                                  final response = await _repairService
                                      .requestAdditionalPayment(
                                    orderId: widget.orderId,
                                    amount: double.parse(amountController.text),
                                    reason: reasonController.text,
                                  );
                                  if (!mounted) return;
                                  if (response['success'] == true) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                            'Additional payment request sent',
                                            style: GoogleFonts.poppins()),
                                        backgroundColor: Colors.green,
                                      ),
                                    );
                                    amountController.clear();
                                    reasonController.clear();
                                    _fetchOrderDetails();
                                  } else {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                            response['message'] ??
                                                'Failed to request payment',
                                            style: GoogleFonts.poppins()),
                                        backgroundColor: Colors.red,
                                      ),
                                    );
                                  }
                                } catch (e) {
                                  if (!mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Error: $e',
                                          style: GoogleFonts.poppins()),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                } finally {
                                  if (mounted) {
                                    setState(() {
                                      _isRequestingPayment = false;
                                    });
                                  }
                                }
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: accentColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isRequestingPayment
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text('Submit Request',
                              style: GoogleFonts.poppins()),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Note: Additional payment requests will need to be paid by the customer before the order can be completed.',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: textSecondaryColor,
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

  Future<Map<String, dynamic>?> _showEditAdditionalPaymentDialog(
      Map<String, dynamic> payment) {
    final TextEditingController editAmountController =
        TextEditingController(text: payment['amount'].toString());
    final TextEditingController editReasonController =
        TextEditingController(text: payment['reason'] ?? '');
    final _editFormKey = GlobalKey<FormState>();

    return showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Edit Additional Payment', style: GoogleFonts.poppins()),
          content: Form(
            key: _editFormKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: editAmountController,
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(labelText: 'Amount'),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter an amount';
                    }
                    try {
                      final amount = double.parse(value);
                      if (amount <= 0) {
                        return 'Amount must be greater than zero';
                      }
                    } catch (e) {
                      return 'Please enter a valid number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: editReasonController,
                  decoration: InputDecoration(labelText: 'Reason'),
                  maxLines: 2,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please provide a reason';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, null),
              child: Text('Cancel', style: GoogleFonts.poppins()),
            ),
            ElevatedButton(
              onPressed: () {
                if (_editFormKey.currentState!.validate()) {
                  Navigator.pop(context, {
                    'amount': editAmountController.text,
                    'reason': editReasonController.text,
                  });
                }
              },
              child: Text('Save', style: GoogleFonts.poppins()),
            ),
          ],
        );
      },
    );
  }

  Future<bool?> _showDeleteAdditionalPaymentDialog(
      Map<String, dynamic> payment) {
    return showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title:
              Text('Delete Additional Payment', style: GoogleFonts.poppins()),
          content: Text(
              'Are you sure you want to delete this additional payment?',
              style: GoogleFonts.poppins()),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text('Cancel', style: GoogleFonts.poppins()),
            ),
            ElevatedButton(
              onPressed: () =>
                  Navigator.pop(context, true), // Return true to parent
              child: Text('Delete', style: GoogleFonts.poppins()),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            ),
          ],
        );
      },
    );
  }

  // Will be implemented in the next step
  Widget _buildUpdateStatusSection() {
    final currentStatus = _orderDetails!['status'].toString().toLowerCase();
    final TextEditingController notesController = TextEditingController();
    String selectedStatus = '';

    // Set available status transitions based on current status
    final List<Map<String, dynamic>> availableStatusOptions = [];

    if (currentStatus == 'pending') {
      availableStatusOptions.add({
        'value': 'in_progress',
        'label': 'Mark as In Progress',
        'icon': Icons.build,
        'color': Colors.blue,
      });
    }

    if (currentStatus == 'in_progress' || currentStatus == 'pending') {
      // Check if order is fully paid before allowing completion
      final isFullyPaid = _orderDetails!['payment_status'] == 'fully_paid';

      availableStatusOptions.add({
        'value': 'completed',
        'label': 'Mark as Completed',
        'icon': Icons.check_circle,
        'color': Colors.green,
        'disabled': !isFullyPaid,
        'disabledMessage': 'Cannot mark as completed until fully paid'
      });
    }

    // If no valid transitions or already in final state
    if (availableStatusOptions.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Row(
          children: [
            Icon(
              Icons.info_outline,
              color: textSecondaryColor,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'No status updates available for this order.',
                style: GoogleFonts.poppins(
                  color: textSecondaryColor,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: StatefulBuilder(
          builder: (context, setStateLocal) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Update Order Status',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 16),

                // Status selection buttons
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: availableStatusOptions.map((option) {
                    final bool isDisabled = option['disabled'] == true;

                    return Tooltip(
                      message: isDisabled ? option['disabledMessage'] : '',
                      child: OutlinedButton.icon(
                        icon: Icon(
                          option['icon'],
                          color: isDisabled ? Colors.grey : option['color'],
                        ),
                        label: Text(option['label']),
                        style: OutlinedButton.styleFrom(
                          foregroundColor:
                              isDisabled ? Colors.grey : option['color'],
                          side: BorderSide(
                            color: isDisabled
                                ? Colors.grey.shade300
                                : option['color'].withOpacity(0.5),
                          ),
                          backgroundColor: selectedStatus == option['value']
                              ? option['color'].withOpacity(0.1)
                              : null,
                        ),
                        onPressed: isDisabled
                            ? null
                            : () {
                                setStateLocal(() {
                                  selectedStatus = option['value'];
                                });
                              },
                      ),
                    );
                  }).toList(),
                ),

                if (selectedStatus.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 16),

                  // Notes field for completed status
                  if (selectedStatus == 'completed') ...[
                    Text(
                      'Completion Notes (Optional)',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: textSecondaryColor,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: notesController,
                      decoration: InputDecoration(
                        hintText: 'Add notes about completion...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isUpdatingStatus
                          ? null
                          : () async {
                              setState(() {
                                _isUpdatingStatus = true;
                              });

                              try {
                                final response = await _repairService
                                    .updateServiceOrderStatus(
                                  orderId: widget.orderId,
                                  status: selectedStatus,
                                  completionNotes: selectedStatus == 'completed'
                                      ? notesController.text
                                      : null,
                                );

                                if (!mounted) return;

                                if (response['success'] == true) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'Status updated successfully',
                                        style: GoogleFonts.poppins(),
                                      ),
                                      backgroundColor: Colors.green,
                                    ),
                                  );

                                  // Refresh order details
                                  _fetchOrderDetails();
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        response['message'] ??
                                            'Failed to update status',
                                        style: GoogleFonts.poppins(),
                                      ),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                }
                              } catch (e) {
                                if (!mounted) return;

                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Error: $e',
                                      style: GoogleFonts.poppins(),
                                    ),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              } finally {
                                if (mounted) {
                                  setState(() {
                                    _isUpdatingStatus = false;
                                  });
                                }
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isUpdatingStatus
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              'Update Status',
                              style: GoogleFonts.poppins(),
                            ),
                    ),
                  ),
                ],
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildRefundSection() {
    if (_isLoadingRefunds) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_refunds.isEmpty) {
      return Card(
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'No refund requests yet.',
            style: GoogleFonts.poppins(fontSize: 14, color: textSecondaryColor),
          ),
        ),
      );
    }
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
                side: BorderSide(color: statusColor.withOpacity(0.3), width: 1),
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
                        border: Border.all(color: statusColor.withOpacity(0.5)),
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
                        child: Text('Admin Notes: ${refund['decision_notes']}',
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
              ),
            );
          },
        ),
      ],
    );
  }
}
