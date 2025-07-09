import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/services/repair_service.dart';
import 'package:intl/intl.dart';
import 'package:app/utils/AppColor.dart';
import 'package:app/screens/expert/request_detail_screen.dart';

class BidsTab extends StatefulWidget {
  const BidsTab({Key? key}) : super(key: key);

  @override
  State<BidsTab> createState() => _BidsTabState();
}

class _BidsTabState extends State<BidsTab> {
  final RepairService _repairService = RepairService();
  bool _isLoading = true;
  String? _error;
  List<dynamic> _bids = [];

  @override
  void initState() {
    super.initState();
    _fetchBids();
  }

  Future<void> _fetchBids() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _repairService.getExpertBids();

      setState(() {
        _isLoading = false;
        if (response['success'] == true) {
          _bids = response['data'] ?? [];
        } else {
          _error = response['message'] ?? 'Failed to load bids';
        }
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Error: $e';
      });
    }
  }

  Future<void> _deleteBid(int bidId) async {
    try {
      final response = await _repairService.deleteBid(bidId);

      if (response['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Bid withdrawn successfully',
                style: GoogleFonts.poppins()),
            backgroundColor: Colors.green,
          ),
        );
        _fetchBids(); // Refresh the list
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response['message'] ?? 'Failed to withdraw bid',
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
    return RefreshIndicator(
      onRefresh: _fetchBids,
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
                        'Error loading bids',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _error!,
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _fetchBids,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: Text('Try Again', style: GoogleFonts.poppins()),
                      ),
                    ],
                  ),
                )
              : _bids.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.gavel_outlined,
                              size: 64, color: Colors.grey[400]),
                          const SizedBox(height: 16),
                          Text(
                            'No bids yet',
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'You have not placed any bids on repair requests.',
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(20),
                      itemCount: _bids.length,
                      itemBuilder: (context, index) {
                        final bid = _bids[index];
                        final repairRequest = bid['repair_request'];
                        final requestTitle =
                            repairRequest?['description'] ?? 'No description';
                        final isBidding = repairRequest?['status'] == 'bidding';

                        return Card(
                          margin: const EdgeInsets.only(bottom: 16),
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            children: [
                              ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                title: Text(
                                  requestTitle.length > 50
                                      ? '${requestTitle.substring(0, 50)}...'
                                      : requestTitle,
                                  style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Icon(Icons.attach_money,
                                            size: 16, color: primaryColor),
                                        const SizedBox(width: 4),
                                        Text(
                                          '\$${bid['cost']}',
                                          style: GoogleFonts.poppins(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w500,
                                            color: primaryColor,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Icon(Icons.calendar_today,
                                            size: 16, color: Colors.grey[600]),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Due: ${_formatDate(bid['deadline'])}',
                                          style: GoogleFonts.poppins(
                                            fontSize: 13,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: bid['is_accepted']
                                            ? Colors.green.withOpacity(0.1)
                                            : isBidding
                                                ? Colors.orange.withOpacity(0.1)
                                                : Colors.grey.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        bid['is_accepted']
                                            ? 'Accepted'
                                            : isBidding
                                                ? 'Pending'
                                                : 'Closed',
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w500,
                                          color: bid['is_accepted']
                                              ? Colors.green
                                              : isBidding
                                                  ? Colors.orange
                                                  : Colors.grey,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                onTap: () {
                                  // Navigate to request details page
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => RequestDetailScreen(
                                        requestId: repairRequest['request_id'],
                                      ),
                                    ),
                                  ).then((_) =>
                                      _fetchBids()); // Refresh when returning
                                },
                              ),
                              if (isBidding && !bid['is_accepted'])
                                Padding(
                                  padding: const EdgeInsets.only(
                                      left: 8, right: 8, bottom: 8),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      TextButton.icon(
                                        icon: const Icon(Icons.edit, size: 16),
                                        label: Text('Update',
                                            style: GoogleFonts.poppins(
                                                fontSize: 12)),
                                        onPressed: () {
                                          // Navigate to request details for updating
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (context) =>
                                                  RequestDetailScreen(
                                                requestId:
                                                    repairRequest['request_id'],
                                              ),
                                            ),
                                          ).then((_) =>
                                              _fetchBids()); // Refresh when returning
                                        },
                                        style: TextButton.styleFrom(
                                          foregroundColor: primaryColor,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      TextButton.icon(
                                        icon: const Icon(Icons.delete_outline,
                                            size: 16),
                                        label: Text('Withdraw',
                                            style: GoogleFonts.poppins(
                                                fontSize: 12)),
                                        onPressed: () {
                                          // Show confirmation dialog
                                          showDialog(
                                            context: context,
                                            builder: (context) => AlertDialog(
                                              title: Text('Withdraw Bid',
                                                  style: GoogleFonts.poppins(
                                                      fontWeight:
                                                          FontWeight.w600)),
                                              content: Text(
                                                'Are you sure you want to withdraw this bid? This action cannot be undone.',
                                                style: GoogleFonts.poppins(),
                                              ),
                                              actions: [
                                                TextButton(
                                                  onPressed: () =>
                                                      Navigator.pop(context),
                                                  child: Text('Cancel',
                                                      style: GoogleFonts
                                                          .poppins()),
                                                ),
                                                TextButton(
                                                  onPressed: () {
                                                    Navigator.pop(context);
                                                    _deleteBid(bid['bid_id']);
                                                  },
                                                  style: TextButton.styleFrom(
                                                    foregroundColor: Colors.red,
                                                  ),
                                                  child: Text('Withdraw',
                                                      style: GoogleFonts
                                                          .poppins()),
                                                ),
                                              ],
                                            ),
                                          );
                                        },
                                        style: TextButton.styleFrom(
                                          foregroundColor: Colors.red,
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
    );
  }
}
