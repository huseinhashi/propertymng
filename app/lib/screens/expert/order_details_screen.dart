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

  @override
  void initState() {
    super.initState();
    _fetchOrderDetails();
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

            // Additional payment request section
            if (_orderDetails!['status'] != 'completed' &&
                _orderDetails!['status'] != 'delivered')
              _buildAdditionalPaymentSection(),

            const SizedBox(height: 24),

            // Update status section
            if (_orderDetails!['status'] != 'delivered')
              _buildUpdateStatusSection(),
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

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _additionalPaymentFormKey,
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
              TextFormField(
                controller: amountController,
                keyboardType: TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: 'Amount (\$)',
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
                              final response =
                                  await _repairService.requestAdditionalPayment(
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
                                      style: GoogleFonts.poppins(),
                                    ),
                                    backgroundColor: Colors.green,
                                  ),
                                );

                                // Clear form
                                amountController.clear();
                                reasonController.clear();

                                // Refresh order details
                                _fetchOrderDetails();
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      response['message'] ??
                                          'Failed to request payment',
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
                      : Text(
                          'Submit Request',
                          style: GoogleFonts.poppins(),
                        ),
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
      ),
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

    if (currentStatus == 'completed') {
      availableStatusOptions.add({
        'value': 'delivered',
        'label': 'Mark as Delivered',
        'icon': Icons.local_shipping,
        'color': Colors.teal,
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
}
