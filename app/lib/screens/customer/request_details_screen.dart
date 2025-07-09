import 'package:app/screens/customer/orders_screen.dart';
import 'package:app/services/api_client.dart';
import 'package:app/utils/AppColor.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/services/repair_service.dart';
import 'package:intl/intl.dart';
import 'package:app/screens/customer/customer_dashboard.dart';

class RequestDetailsScreen extends StatefulWidget {
  final int requestId;

  const RequestDetailsScreen({Key? key, required this.requestId})
      : super(key: key);

  @override
  State<RequestDetailsScreen> createState() => _RequestDetailsScreenState();
}

class _RequestDetailsScreenState extends State<RequestDetailsScreen> {
  final RepairService _repairService = RepairService();
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _requestDetails;
  List<dynamic> _bids = [];
  int? _selectedBidId;

  @override
  void initState() {
    super.initState();
    _fetchRequestDetails();
  }

  Future<void> _fetchRequestDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response =
          await _repairService.getRepairRequestById(widget.requestId);

      setState(() {
        _isLoading = false;
        if (response['success'] == true) {
          _requestDetails = response['data'];

          // Get bids if available
          if (response['data']['bids'] != null) {
            _bids = response['data']['bids'];

            // Check if there's already an accepted bid
            for (var bid in _bids) {
              if (bid['is_accepted'] == true) {
                _selectedBidId = bid['bid_id'];
                break;
              }
            }
          }
        } else {
          _error = response['message'] ?? 'Failed to load request details';
        }
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Error: $e';
      });
    }
  }

  Future<void> _acceptBid(int bidId) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _repairService.acceptBid(bidId);

      setState(() {
        _isLoading = false;
        if (response['success'] == true) {
          _selectedBidId = bidId;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Bid accepted successfully',
                  style: GoogleFonts.poppins()),
              backgroundColor: Colors.green,
            ),
          );
          // Instead of pushing OrdersScreen directly, pop to root and set tab
          if (!mounted) return;
          Navigator.popUntil(context, (route) => route.isFirst);
          // Use a short delay to ensure popUntil completes, then set tab
          Future.delayed(Duration(milliseconds: 100), () {
            // Use an InheritedWidget, Provider, or a global key to set the tab in CustomerDashboardScreen
            // For now, send a navigation argument
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => CustomerDashboardScreen(),
                settings: RouteSettings(
                    arguments: {'selectedTab': 2}), // 2 = Orders tab
              ),
            );
          });
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response['message'] ?? 'Failed to accept bid',
                  style: GoogleFonts.poppins()),
              backgroundColor: Colors.red,
            ),
          );
        }
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              Text('Error accepting bid: $e', style: GoogleFonts.poppins()),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showExpertProfile(Map<String, dynamic> expert) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Container(
          padding: const EdgeInsets.all(20),
          constraints: const BoxConstraints(maxWidth: 400),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: primaryColor.withOpacity(0.1),
                    child: Text(
                      (expert['full_name'] as String? ?? 'E')
                          .substring(0, 1)
                          .toUpperCase(),
                      style: GoogleFonts.poppins(
                        color: primaryColor,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          expert['full_name'] ?? 'Expert Name',
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: textPrimaryColor,
                          ),
                        ),
                        Text(
                          expert['email'] ?? 'expert@example.com',
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            color: textSecondaryColor,
                          ),
                        ),
                        if (expert['is_verified'] == true)
                          Row(
                            children: [
                              Icon(Icons.verified,
                                  color: Colors.green, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                'Verified Expert',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: Colors.green,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Bio section
              if (expert['bio'] != null && expert['bio'].toString().isNotEmpty)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Bio',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: textPrimaryColor,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      expert['bio'],
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: textSecondaryColor,
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),

              // Address section
              if (expert['address'] != null &&
                  expert['address'].toString().isNotEmpty)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Address',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: textPrimaryColor,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined,
                            color: primaryColor, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            expert['address'],
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              color: textSecondaryColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                  ],
                ),

              // Close button
              Center(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 40, vertical: 12),
                  ),
                  child: Text('Close', style: GoogleFonts.poppins()),
                ),
              ),
            ],
          ),
        ),
      ),
    );
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

  String _formatDateTime(String? dateString) {
    if (dateString == null) return 'N/A';
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('MMM dd, yyyy - hh:mm a').format(date);
    } catch (e) {
      return dateString;
    }
  }

  Widget _buildStatusBadge(String status) {
    Color color;

    switch (status.toLowerCase()) {
      case 'pending':
        color = Colors.orange;
        break;
      case 'bidding':
        color = Colors.blue;
        break;
      case 'closed':
        color = Colors.green;
        break;
      case 'rejected':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        status.toUpperCase(),
        style: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: Text(
          "Request Details",
          style: GoogleFonts.poppins(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: primaryColor,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline,
                          size: 48, color: Colors.red[300]),
                      const SizedBox(height: 16),
                      Text(
                        'Error loading request details',
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
                        onPressed: _fetchRequestDetails,
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
                )
              : _requestDetails == null
                  ? const Center(child: Text('No data available'))
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      physics: const BouncingScrollPhysics(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Request status and ID
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                "Request #${_requestDetails!['request_id']}",
                                style: GoogleFonts.poppins(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                  color: textPrimaryColor,
                                ),
                              ),
                              _buildStatusBadge(
                                  _requestDetails!['status'] ?? 'Pending'),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // Request Information
                          _buildSectionHeader("Request Information"),
                          const SizedBox(height: 16),

                          _buildDetailCard(
                              "Description",
                              _requestDetails!['description'] ??
                                  'No description provided',
                              primaryColor),

                          _buildDetailCard(
                              "Location",
                              _requestDetails!['location'] ??
                                  'No location provided',
                              primaryColor),

                          if (_requestDetails!['service_type'] != null)
                            _buildDetailCard(
                                "Service Type",
                                _requestDetails!['service_type']['name'] ??
                                    'Not assigned',
                                primaryColor),

                          _buildDetailCard(
                              "Created On",
                              _formatDateTime(_requestDetails!['createdAt']),
                              primaryColor),

                          const SizedBox(height: 24),

                          // Images section
                          if (_requestDetails!['service_images'] != null &&
                              (_requestDetails!['service_images'] as List)
                                  .isNotEmpty)
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildSectionHeader("Images"),
                                const SizedBox(height: 16),
                                SizedBox(
                                  height: 150,
                                  child: ListView.builder(
                                    scrollDirection: Axis.horizontal,
                                    itemCount:
                                        (_requestDetails!['service_images']
                                                as List)
                                            .length,
                                    itemBuilder: (context, index) {
                                      final imageUrl =
                                          _requestDetails!['service_images']
                                              [index]['url'];
                                      return Padding(
                                        padding:
                                            const EdgeInsets.only(right: 16.0),
                                        child: GestureDetector(
                                          onTap: () {
                                            // Show full image in dialog
                                            showDialog(
                                              context: context,
                                              builder: (context) => Dialog(
                                                insetPadding:
                                                    const EdgeInsets.all(10),
                                                child: Container(
                                                  constraints:
                                                      const BoxConstraints(
                                                    maxWidth: 500,
                                                    maxHeight: 500,
                                                  ),
                                                  child: Image.network(
                                                    "${ApiClient.baseUrl.replaceAll('/api/v1', '')}/uploads/$imageUrl",
                                                    fit: BoxFit.contain,
                                                    errorBuilder: (context,
                                                            error,
                                                            stackTrace) =>
                                                        Container(
                                                      width: 150,
                                                      height: 150,
                                                      color: Colors.grey[200],
                                                      child: const Center(
                                                        child: Icon(Icons.error,
                                                            color: Colors.red),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            );
                                          },
                                          child: ClipRRect(
                                            borderRadius:
                                                BorderRadius.circular(12),
                                            child: Image.network(
                                              "${ApiClient.baseUrl.replaceAll('/api/v1', '')}/uploads/$imageUrl",
                                              width: 150,
                                              height: 150,
                                              fit: BoxFit.cover,
                                              errorBuilder: (context, error,
                                                      stackTrace) =>
                                                  Container(
                                                width: 150,
                                                height: 150,
                                                color: Colors.grey[200],
                                                child: const Center(
                                                  child: Icon(Icons.error,
                                                      color: Colors.red),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                                const SizedBox(height: 24),
                              ],
                            ),

                          // Bids section
                          if (_bids.isNotEmpty)
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildSectionHeader("Expert Bids"),
                                const SizedBox(height: 16),
                                Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.05),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: Column(
                                    children: [
                                      // Table Header
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 16, vertical: 12),
                                        decoration: BoxDecoration(
                                          color: Colors.grey.shade50,
                                          borderRadius: const BorderRadius.only(
                                            topLeft: Radius.circular(12),
                                            topRight: Radius.circular(12),
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            Expanded(
                                              flex: 3,
                                              child: Text(
                                                "Expert",
                                                style: GoogleFonts.poppins(
                                                  fontWeight: FontWeight.w600,
                                                  color: textPrimaryColor,
                                                ),
                                              ),
                                            ),
                                            Expanded(
                                              flex: 2,
                                              child: Text(
                                                "Estimated Time",
                                                style: GoogleFonts.poppins(
                                                  fontWeight: FontWeight.w600,
                                                  color: textPrimaryColor,
                                                ),
                                              ),
                                            ),
                                            Expanded(
                                              flex: 2,
                                              child: Text(
                                                "Amount",
                                                style: GoogleFonts.poppins(
                                                  fontWeight: FontWeight.w600,
                                                  color: textPrimaryColor,
                                                ),
                                              ),
                                            ),
                                            Expanded(
                                              flex: 2,
                                              child: Text(
                                                "Action",
                                                style: GoogleFonts.poppins(
                                                  fontWeight: FontWeight.w600,
                                                  color: textPrimaryColor,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      // Table Rows
                                      ListView.builder(
                                        shrinkWrap: true,
                                        physics:
                                            const NeverScrollableScrollPhysics(),
                                        itemCount: _bids.length,
                                        itemBuilder: (context, index) {
                                          final bid = _bids[index];
                                          final isAccepted =
                                              bid['is_accepted'] ?? false;
                                          final isSelectable = _selectedBidId ==
                                                  null ||
                                              _selectedBidId == bid['bid_id'];
                                          final expert = bid['expert'] ?? {};

                                          return Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 16, vertical: 12),
                                            decoration: BoxDecoration(
                                              border: Border(
                                                bottom: BorderSide(
                                                  color: Colors.grey.shade200,
                                                  width: 1,
                                                ),
                                              ),
                                            ),
                                            child: Row(
                                              children: [
                                                // Expert Column
                                                Expanded(
                                                  flex: 3,
                                                  child: GestureDetector(
                                                    onTap: () =>
                                                        _showExpertProfile(
                                                            expert),
                                                    child: Row(
                                                      children: [
                                                        CircleAvatar(
                                                          backgroundColor:
                                                              primaryColor
                                                                  .withOpacity(
                                                                      0.1),
                                                          radius: 16,
                                                          child: Text(
                                                            (expert['full_name']
                                                                        as String? ??
                                                                    'E')
                                                                .substring(0, 1)
                                                                .toUpperCase(),
                                                            style: GoogleFonts
                                                                .poppins(
                                                              color:
                                                                  primaryColor,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w600,
                                                            ),
                                                          ),
                                                        ),
                                                        const SizedBox(
                                                            width: 8),
                                                        Expanded(
                                                          child: Column(
                                                            crossAxisAlignment:
                                                                CrossAxisAlignment
                                                                    .start,
                                                            children: [
                                                              Text(
                                                                expert['full_name'] ??
                                                                    'Expert',
                                                                style:
                                                                    GoogleFonts
                                                                        .poppins(
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .w500,
                                                                  color:
                                                                      textPrimaryColor,
                                                                  fontSize: 13,
                                                                ),
                                                                overflow:
                                                                    TextOverflow
                                                                        .ellipsis,
                                                                maxLines: 1,
                                                              ),
                                                              if (expert[
                                                                      'is_verified'] ==
                                                                  true)
                                                                Row(
                                                                  children: [
                                                                    Icon(
                                                                        Icons
                                                                            .verified,
                                                                        size:
                                                                            12,
                                                                        color: Colors
                                                                            .green),
                                                                    const SizedBox(
                                                                        width:
                                                                            4),
                                                                    Text(
                                                                      'Verified',
                                                                      style: GoogleFonts
                                                                          .poppins(
                                                                        fontSize:
                                                                            11,
                                                                        color: Colors
                                                                            .green,
                                                                      ),
                                                                    ),
                                                                  ],
                                                                ),
                                                            ],
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                                // Estimated Time Column
                                                Expanded(
                                                  flex: 2,
                                                  child: Text(
                                                    "${bid['duration']} ${bid['duration_unit']}",
                                                    style: GoogleFonts.poppins(
                                                      color: textSecondaryColor,
                                                      fontSize: 13,
                                                    ),
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    maxLines: 1,
                                                  ),
                                                ),
                                                // Amount Column
                                                Expanded(
                                                  flex: 2,
                                                  child: Text(
                                                    "\$${bid['cost']}",
                                                    style: GoogleFonts.poppins(
                                                      fontWeight:
                                                          FontWeight.w600,
                                                      color: accentColor,
                                                      fontSize: 13,
                                                    ),
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    maxLines: 1,
                                                  ),
                                                ),
                                                // Action Column
                                                Expanded(
                                                  flex: 2,
                                                  child: isAccepted
                                                      ? Row(
                                                          children: [
                                                            Icon(
                                                                Icons
                                                                    .check_circle,
                                                                size: 16,
                                                                color: Colors
                                                                    .green),
                                                            const SizedBox(
                                                                width: 4),
                                                            Text(
                                                              "Accepted",
                                                              style: GoogleFonts
                                                                  .poppins(
                                                                fontSize: 12,
                                                                color: Colors
                                                                    .green,
                                                              ),
                                                              overflow:
                                                                  TextOverflow
                                                                      .ellipsis,
                                                              maxLines: 1,
                                                            ),
                                                          ],
                                                        )
                                                      : SizedBox(
                                                          height: 32,
                                                          child: ElevatedButton(
                                                            onPressed: isSelectable &&
                                                                    _requestDetails![
                                                                            'status'] ==
                                                                        'bidding'
                                                                ? () => _acceptBid(
                                                                    bid['bid_id'])
                                                                : null,
                                                            style:
                                                                ElevatedButton
                                                                    .styleFrom(
                                                              backgroundColor:
                                                                  accentColor,
                                                              foregroundColor:
                                                                  Colors.white,
                                                              disabledBackgroundColor:
                                                                  Colors.grey
                                                                      .shade300,
                                                              disabledForegroundColor:
                                                                  Colors.grey
                                                                      .shade600,
                                                              padding:
                                                                  const EdgeInsets
                                                                      .symmetric(
                                                                      horizontal:
                                                                          12,
                                                                      vertical:
                                                                          0),
                                                              shape:
                                                                  RoundedRectangleBorder(
                                                                borderRadius:
                                                                    BorderRadius
                                                                        .circular(
                                                                            6),
                                                              ),
                                                            ),
                                                            child: Text(
                                                              "Accept",
                                                              style: GoogleFonts
                                                                  .poppins(
                                                                fontSize: 12,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w500,
                                                              ),
                                                            ),
                                                          ),
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
                              ],
                            )
                          else if (_requestDetails!['status'] == 'bidding')
                            Center(
                              child: Column(
                                children: [
                                  const SizedBox(height: 20),
                                  Icon(
                                    Icons.hourglass_empty,
                                    size: 64,
                                    color: Colors.grey[400],
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    "Waiting for Expert Bids",
                                    style: GoogleFonts.poppins(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                      color: textPrimaryColor,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    "Experts are reviewing your request. You'll be notified when bids are available.",
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.poppins(
                                      fontSize: 14,
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

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: GoogleFonts.poppins(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: textPrimaryColor,
      ),
    );
  }

  Widget _buildDetailCard(String label, String value, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.info_outline,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: textSecondaryColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
