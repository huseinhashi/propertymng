// Modern History Tab
import 'package:app/screens/customer/request_details_screen.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/utils/AppColor.dart';
import 'package:app/services/repair_service.dart';
import 'package:intl/intl.dart';

class HistoryTab extends StatefulWidget {
  const HistoryTab({Key? key}) : super(key: key);

  @override
  State<HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends State<HistoryTab> {
  final RepairService _repairService = RepairService();
  bool _isLoading = false;
  String? _error;
  List<dynamic> _repairRequests = [];

  @override
  void initState() {
    super.initState();
    _fetchRepairRequests();
  }

  Future<void> _fetchRepairRequests() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _repairService.getCustomerRepairRequests();

      setState(() {
        _isLoading = false;
        if (response['success'] == true) {
          _repairRequests = response['data'] ?? [];
        } else {
          _error = response['message'] ?? 'Failed to load repair requests';
        }
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Error: $e';
      });
    }
  }

  String _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFA500'; // Orange
      case 'bidding':
        return '#3498DB'; // Blue
      case 'closed':
        return '#27AE60'; // Green
      case 'rejected':
        return '#E74C3C'; // Red
      default:
        return '#95A5A6'; // Gray
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _fetchRepairRequests,
      color: primaryColor,
      child: _isLoading
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
                        'Error loading repair requests',
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
                        onPressed: _fetchRepairRequests,
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
              : _repairRequests.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.history,
                              size: 64, color: Colors.grey[400]),
                          const SizedBox(height: 16),
                          Text(
                            'No Repair Requests Yet',
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: textPrimaryColor,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Create a new request to get started',
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              color: textSecondaryColor,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.pushNamed(context, '/repair_request')
                                  .then((_) => _fetchRepairRequests());
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: accentColor,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            child: Text('Create Request',
                                style: GoogleFonts.poppins()),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _repairRequests.length,
                      itemBuilder: (context, index) {
                        final request = _repairRequests[index];
                        final createdAt = request['createdAt'] != null
                            ? DateFormat('MMM dd, yyyy')
                                .format(DateTime.parse(request['createdAt']))
                            : 'Unknown date';

                        final status = request['status'] ?? 'pending';
                        final statusColor = _getStatusColor(status);

                        return GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => RequestDetailsScreen(
                                  requestId: request['request_id'],
                                ),
                              ),
                            ).then((_) => _fetchRepairRequests());
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.05),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: primaryColor.withOpacity(0.05),
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(16),
                                      topRight: Radius.circular(16),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.home_repair_service,
                                        color: primaryColor,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          "Request #${request['request_id']}",
                                          style: GoogleFonts.poppins(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
                                            color: primaryColor,
                                          ),
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 4,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Color(int.parse(
                                                      statusColor.substring(
                                                          1, 7),
                                                      radix: 16) +
                                                  0xFF000000)
                                              .withOpacity(0.1),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          status.toUpperCase(),
                                          style: GoogleFonts.poppins(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                            color: Color(int.parse(
                                                    statusColor.substring(1, 7),
                                                    radix: 16) +
                                                0xFF000000),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        request['description'] ??
                                            'No description',
                                        style: GoogleFonts.poppins(
                                          fontSize: 14,
                                          color: textPrimaryColor,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      // const SizedBox(height: 16),
                                      // Row(
                                      //   children: [
                                      //     Icon(
                                      //       Icons.location_on_outlined,
                                      //       size: 16,
                                      //       color: textSecondaryColor,
                                      //     ),
                                      //     const SizedBox(width: 4),
                                      //     Expanded(
                                      //       child: Text(
                                      //         request['location'] ??
                                      //             'No location',
                                      //         style: GoogleFonts.poppins(
                                      //           fontSize: 12,
                                      //           color: textSecondaryColor,
                                      //         ),
                                      //         maxLines: 1,
                                      //         overflow: TextOverflow.ellipsis,
                                      //       ),
                                      //     ),
                                      //   ],
                                      // ),
                                      // const SizedBox(height: 8),
                                      // Row(
                                      //   children: [
                                      //     Icon(
                                      //       Icons.calendar_today_outlined,
                                      //       size: 16,
                                      //       color: textSecondaryColor,
                                      //     ),
                                      //     const SizedBox(width: 4),
                                      //     Text(
                                      //       'Created on $createdAt',
                                      //       style: GoogleFonts.poppins(
                                      //         fontSize: 12,
                                      //         color: textSecondaryColor,
                                      //       ),
                                      //     ),
                                      //   ],
                                      // ),

                                      // // Service type if available
                                      // if (request['service_type'] != null)
                                      //   Padding(
                                      //     padding:
                                      //         const EdgeInsets.only(top: 8.0),
                                      //     child: Row(
                                      //       children: [
                                      //         Icon(
                                      //           Icons.category_outlined,
                                      //           size: 16,
                                      //           color: textSecondaryColor,
                                      //         ),
                                      //         const SizedBox(width: 4),
                                      //         Container(
                                      //           padding:
                                      //               const EdgeInsets.symmetric(
                                      //                   horizontal: 8,
                                      //                   vertical: 4),
                                      //           decoration: BoxDecoration(
                                      //             color: primaryColor
                                      //                 .withOpacity(0.1),
                                      //             borderRadius:
                                      //                 BorderRadius.circular(8),
                                      //           ),
                                      //           child: Text(
                                      //             request['service_type']
                                      //                     ['name'] ??
                                      //                 'Unknown',
                                      //             style: GoogleFonts.poppins(
                                      //               fontSize: 12,
                                      //               fontWeight: FontWeight.w500,
                                      //               color: primaryColor,
                                      //             ),
                                      //           ),
                                      //         ),
                                      //       ],
                                      //     ),
                                      //   ),

                                      // // Bid information if any
                                      // if (request['bids'] != null &&
                                      //     (request['bids'] as List).isNotEmpty)
                                      //   Padding(
                                      //     padding:
                                      //         const EdgeInsets.only(top: 8.0),
                                      //     child: Row(
                                      //       children: [
                                      //         Icon(
                                      //           Icons.handshake_outlined,
                                      //           size: 16,
                                      //           color: accentColor,
                                      //         ),
                                      //         const SizedBox(width: 4),
                                      //         Text(
                                      //           "${(request['bids'] as List).length} bid(s) received",
                                      //           style: GoogleFonts.poppins(
                                      //             fontSize: 12,
                                      //             fontWeight: FontWeight.w500,
                                      //             color: accentColor,
                                      //           ),
                                      //         ),
                                      //       ],
                                      //     ),
                                      //   ),
                                    ],
                                  ),
                                ),
                                Container(
                                  width: double.infinity,
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 12),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[50],
                                    borderRadius: const BorderRadius.only(
                                      bottomLeft: Radius.circular(16),
                                      bottomRight: Radius.circular(16),
                                    ),
                                  ),
                                  child: Text(
                                    'View Details',
                                    style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                      color: primaryColor,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }

  Widget _buildDetailCard(String title, Widget child) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: textPrimaryColor,
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}
