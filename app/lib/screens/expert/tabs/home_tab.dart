import 'package:app/services/api_client.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/utils/AppColor.dart';
import 'package:app/services/repair_service.dart';
import 'package:intl/intl.dart';
import '../request_detail_screen.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({Key? key}) : super(key: key);

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  final RepairService _repairService = RepairService();
  bool _isLoading = true;
  String? _error;
  List<dynamic> _availableRequests = [];

  @override
  void initState() {
    super.initState();
    _fetchAvailableRequests();
  }

  Future<void> _fetchAvailableRequests() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _repairService.getAvailableRequestsForExpert();

      setState(() {
        _isLoading = false;
        if (response['success'] == true) {
          _availableRequests = response['data'] ?? [];
        } else {
          _error = response['message'] ?? 'Failed to load available requests';
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

  String _truncateText(String text, int maxLength) {
    if (text.length <= maxLength) return text;
    return '${text.substring(0, maxLength)}...';
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _fetchAvailableRequests,
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
                        'Error loading available requests',
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
                        onPressed: _fetchAvailableRequests,
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
              : _availableRequests.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.search_off,
                              size: 64, color: Colors.grey[400]),
                          const SizedBox(height: 16),
                          Text(
                            'No Available Requests',
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: textPrimaryColor,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 32.0),
                            child: Text(
                              'There are no repair requests matching your service types or you\'ve already bid on all available requests.',
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                color: textSecondaryColor,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _availableRequests.length,
                      itemBuilder: (context, index) {
                        final request = _availableRequests[index];
                        final createdAt = _formatDate(request['createdAt']);

                        // Extract image URL if available
                        String? imageUrl;
                        if (request['service_images'] != null &&
                            (request['service_images'] as List).isNotEmpty) {
                          imageUrl = request['service_images'][0]['url'];
                        }

                        return GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => RequestDetailScreen(
                                  requestId: int.parse(
                                      request['request_id'].toString()),
                                ),
                              ),
                            ).then((_) => _fetchAvailableRequests());
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
                                // Header with service type
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: primaryColor.withOpacity(0.05),
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(16),
                                      topRight: Radius.circular(16),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      if (request['service_type'] != null)
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color:
                                                primaryColor.withOpacity(0.1),
                                            borderRadius:
                                                BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            request['service_type']['name'] ??
                                                'Unknown',
                                            style: GoogleFonts.poppins(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w500,
                                              color: primaryColor,
                                            ),
                                          ),
                                        ),
                                      const Spacer(),
                                      Text(
                                        'Posted: $createdAt',
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          color: textSecondaryColor,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                // Content section
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Image (if available)
                                    if (imageUrl != null)
                                      Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: ClipRRect(
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          child: Image.network(
                                            "${ApiClient.baseUrl.replaceAll('/api/v1', '')}/uploads/$imageUrl",
                                            width: 80,
                                            height: 80,
                                            fit: BoxFit.cover,
                                            errorBuilder:
                                                (context, error, stackTrace) =>
                                                    Container(
                                              width: 80,
                                              height: 80,
                                              color: Colors.grey[200],
                                              child: const Icon(
                                                  Icons.image_not_supported,
                                                  color: Colors.grey),
                                            ),
                                          ),
                                        ),
                                      ),

                                    // Details
                                    Expanded(
                                      child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              _truncateText(
                                                  request['description'] ??
                                                      'No description',
                                                  80),
                                              style: GoogleFonts.poppins(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w500,
                                                color: textPrimaryColor,
                                              ),
                                            ),
                                            const SizedBox(height: 12),
                                            Row(
                                              children: [
                                                Icon(
                                                  Icons.location_on_outlined,
                                                  size: 16,
                                                  color: textSecondaryColor,
                                                ),
                                                const SizedBox(width: 4),
                                                Expanded(
                                                  child: Text(
                                                    request['location'] ??
                                                        'No location',
                                                    style: GoogleFonts.poppins(
                                                      fontSize: 12,
                                                      color: textSecondaryColor,
                                                    ),
                                                    maxLines: 1,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            if (request['customer'] != null)
                                              Padding(
                                                padding: const EdgeInsets.only(
                                                    top: 8),
                                                child: Row(
                                                  children: [
                                                    Icon(
                                                      Icons.person_outline,
                                                      size: 16,
                                                      color: textSecondaryColor,
                                                    ),
                                                    const SizedBox(width: 4),
                                                    Text(
                                                      'Customer: ${request['customer']['name'] ?? 'Unknown'}',
                                                      style:
                                                          GoogleFonts.poppins(
                                                        fontSize: 12,
                                                        color:
                                                            textSecondaryColor,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),

                                // Action button
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[50],
                                    borderRadius: const BorderRadius.only(
                                      bottomLeft: Radius.circular(16),
                                      bottomRight: Radius.circular(16),
                                    ),
                                  ),
                                  child: Center(
                                    child: ElevatedButton.icon(
                                      onPressed: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                RequestDetailScreen(
                                              requestId: int.parse(
                                                  request['request_id']
                                                      .toString()),
                                            ),
                                          ),
                                        ).then(
                                            (_) => _fetchAvailableRequests());
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: accentColor,
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 24, vertical: 12),
                                      ),
                                      icon: Icon(
                                          request['bids'] != null &&
                                                  request['bids'].isNotEmpty
                                              ? Icons.edit
                                              : Icons.gavel,
                                          size: 16),
                                      label: Text(
                                          request['bids'] != null &&
                                                  request['bids'].isNotEmpty
                                              ? 'Update Bid'
                                              : 'Accept Request',
                                          style: GoogleFonts.poppins()),
                                    ),
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
}
