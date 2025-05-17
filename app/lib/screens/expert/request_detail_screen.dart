import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/utils/AppColor.dart';
import 'package:app/services/repair_service.dart';
import 'package:intl/intl.dart';
import 'package:app/services/api_client.dart';

class RequestDetailScreen extends StatefulWidget {
  final int requestId;

  const RequestDetailScreen({
    Key? key,
    required this.requestId,
  }) : super(key: key);

  @override
  State<RequestDetailScreen> createState() => _RequestDetailScreenState();
}

class _RequestDetailScreenState extends State<RequestDetailScreen> {
  final RepairService _repairService = RepairService();
  bool _isLoading = true;
  bool _isSubmittingBid = false;
  bool _hasBid = false;
  int? _existingBidId;
  String? _error;
  Map<String, dynamic> _requestDetails = {};

  // Bid form controllers
  final _costController = TextEditingController();
  final _durationController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String _selectedDurationUnit = 'days';

  @override
  void initState() {
    super.initState();
    _fetchRequestDetails();
  }

  @override
  void dispose() {
    _costController.dispose();
    _durationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _fetchRequestDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // First, check if the expert already has a bid for this request
      final bidResponse =
          await _repairService.getExpertBidForRequest(widget.requestId);

      if (bidResponse['success'] == true && bidResponse['data'] != null) {
        final bid = bidResponse['data'];
        _hasBid = true;
        _existingBidId = bid['bid_id'];

        // Pre-fill form with existing bid values
        _costController.text = bid['cost'].toString();
        _durationController.text = bid['duration'].toString();
        _selectedDurationUnit = bid['duration_unit'];
        _descriptionController.text = bid['description'] ?? '';
      }

      // Then, fetch the request details
      final response =
          await _repairService.getExpertRepairRequestById(widget.requestId);

      setState(() {
        _isLoading = false;
        if (response['success'] == true && response['data'] != null) {
          _requestDetails = response['data'];
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

  Future<void> _submitBid() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSubmittingBid = true;
    });

    try {
      final response = _hasBid
          ? await _repairService.updateBid(
              bidId: _existingBidId!,
              cost: double.parse(_costController.text),
              duration: int.parse(_durationController.text),
              durationUnit: _selectedDurationUnit,
              description: _descriptionController.text,
            )
          : await _repairService.submitBid(
              requestId: widget.requestId,
              cost: double.parse(_costController.text),
              duration: int.parse(_durationController.text),
              durationUnit: _selectedDurationUnit,
              description: _descriptionController.text,
            );

      setState(() {
        _isSubmittingBid = false;
      });

      if (response['success'] == true) {
        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                _hasBid
                    ? 'Bid updated successfully'
                    : 'Bid submitted successfully',
                style: GoogleFonts.poppins()),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      } else {
        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                response['message'] ??
                    (_hasBid ? 'Failed to update bid' : 'Failed to submit bid'),
                style: GoogleFonts.poppins()),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isSubmittingBid = false;
      });

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e', style: GoogleFonts.poppins()),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Request Details',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
            color: textPrimaryColor,
          ),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: textPrimaryColor,
        iconTheme: IconThemeData(
          color: textPrimaryColor,
        ),
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
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          _error!,
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            color: textSecondaryColor,
                          ),
                          textAlign: TextAlign.center,
                        ),
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
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Request header card
                      Card(
                        elevation: 2,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Service type and status
                              Row(
                                children: [
                                  if (_requestDetails['service_type'] != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: primaryColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        _requestDetails['service_type']
                                                ['name'] ??
                                            'Unknown',
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w500,
                                          color: primaryColor,
                                        ),
                                      ),
                                    ),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _requestDetails['status'] ==
                                              'bidding'
                                          ? Colors.blue.withOpacity(0.1)
                                          : _requestDetails['status'] ==
                                                  'in_progress'
                                              ? Colors.orange.withOpacity(0.1)
                                              : _requestDetails['status'] ==
                                                      'completed'
                                                  ? Colors.green
                                                      .withOpacity(0.1)
                                                  : Colors.grey
                                                      .withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      _requestDetails['status']
                                              ?.toUpperCase() ??
                                          'UNKNOWN',
                                      style: GoogleFonts.poppins(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: _requestDetails['status'] ==
                                                'bidding'
                                            ? Colors.blue
                                            : _requestDetails['status'] ==
                                                    'in_progress'
                                                ? Colors.orange
                                                : _requestDetails['status'] ==
                                                        'completed'
                                                    ? Colors.green
                                                    : Colors.grey,
                                      ),
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 16),

                              // Description
                              Text(
                                'Description',
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: textSecondaryColor,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _requestDetails['description'] ??
                                    'No description provided',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  color: textPrimaryColor,
                                ),
                              ),

                              const SizedBox(height: 16),

                              // Location
                              if (_requestDetails['location'] != null)
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Location',
                                      style: GoogleFonts.poppins(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: textSecondaryColor,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.location_on,
                                          size: 18,
                                          color: primaryColor,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            _requestDetails['location'],
                                            style: GoogleFonts.poppins(
                                              fontSize: 14,
                                              color: textPrimaryColor,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                  ],
                                ),

                              // Posted date
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Posted On',
                                        style: GoogleFonts.poppins(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: textSecondaryColor,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        _formatDate(
                                            _requestDetails['createdAt']),
                                        style: GoogleFonts.poppins(
                                          fontSize: 14,
                                          color: textPrimaryColor,
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (_requestDetails['customer'] != null)
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          'Posted By',
                                          style: GoogleFonts.poppins(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: textSecondaryColor,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          _requestDetails['customer']['name'] ??
                                              'Unknown',
                                          style: GoogleFonts.poppins(
                                            fontSize: 14,
                                            color: textPrimaryColor,
                                          ),
                                        ),
                                      ],
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Images section
                      if (_requestDetails['service_images'] != null &&
                          (_requestDetails['service_images'] as List)
                              .isNotEmpty)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Images',
                              style: GoogleFonts.poppins(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: textPrimaryColor,
                              ),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              height: 120,
                              child: ListView.builder(
                                scrollDirection: Axis.horizontal,
                                itemCount:
                                    (_requestDetails['service_images'] as List)
                                        .length,
                                itemBuilder: (context, index) {
                                  final image =
                                      _requestDetails['service_images'][index];
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 12),
                                    child: GestureDetector(
                                      onTap: () {
                                        // Show image in full screen
                                        showDialog(
                                          context: context,
                                          builder: (BuildContext context) {
                                            return Dialog(
                                              insetPadding: EdgeInsets.zero,
                                              backgroundColor:
                                                  Colors.transparent,
                                              child: Stack(
                                                children: [
                                                  InteractiveViewer(
                                                    minScale: 0.5,
                                                    maxScale: 4,
                                                    child: Image.network(
                                                      "${ApiClient.baseUrl.replaceAll('/api/v1', '')}/uploads/${image['url']}",
                                                      fit: BoxFit.contain,
                                                      errorBuilder: (context,
                                                              error,
                                                              stackTrace) =>
                                                          Center(
                                                        child: Icon(Icons.error,
                                                            color:
                                                                Colors.red[300],
                                                            size: 48),
                                                      ),
                                                    ),
                                                  ),
                                                  Positioned(
                                                    top: 16,
                                                    right: 16,
                                                    child: CircleAvatar(
                                                      backgroundColor:
                                                          Colors.black54,
                                                      child: IconButton(
                                                        icon: const Icon(
                                                            Icons.close,
                                                            color:
                                                                Colors.white),
                                                        onPressed: () =>
                                                            Navigator.pop(
                                                                context),
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            );
                                          },
                                        );
                                      },
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(12),
                                        child: Image.network(
                                          "${ApiClient.baseUrl.replaceAll('/api/v1', '')}/uploads/${image['url']}",
                                          width: 120,
                                          height: 120,
                                          fit: BoxFit.cover,
                                          errorBuilder:
                                              (context, error, stackTrace) =>
                                                  Container(
                                            width: 120,
                                            height: 120,
                                            color: Colors.grey[200],
                                            child: const Icon(
                                                Icons.image_not_supported,
                                                color: Colors.grey),
                                          ),
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ),

                      const SizedBox(height: 24),

                      // Bid form if status is bidding
                      if (_requestDetails['status'] == 'bidding')
                        Card(
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Form(
                              key: _formKey,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _hasBid ? 'Update Bid' : 'Submit Bid',
                                    style: GoogleFonts.poppins(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                      color: textPrimaryColor,
                                    ),
                                  ),
                                  const SizedBox(height: 16),

                                  // Cost field
                                  TextFormField(
                                    controller: _costController,
                                    keyboardType:
                                        TextInputType.numberWithOptions(
                                            decimal: true),
                                    decoration: InputDecoration(
                                      labelText: 'Bid Amount (\$)',
                                      labelStyle: GoogleFonts.poppins(
                                          color: textSecondaryColor),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide(
                                            color: primaryColor, width: 2),
                                      ),
                                      prefixIcon: Icon(Icons.attach_money,
                                          color: primaryColor),
                                    ),
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Please enter a bid amount';
                                      }
                                      try {
                                        final cost = double.parse(value);
                                        if (cost <= 0) {
                                          return 'Amount must be greater than zero';
                                        }
                                      } catch (e) {
                                        return 'Please enter a valid number';
                                      }
                                      return null;
                                    },
                                  ),

                                  const SizedBox(height: 16),

                                  // Duration fields
                                  Row(
                                    children: [
                                      Expanded(
                                        flex: 2,
                                        child: TextFormField(
                                          controller: _durationController,
                                          keyboardType: TextInputType.number,
                                          decoration: InputDecoration(
                                            labelText: 'Duration',
                                            labelStyle: GoogleFonts.poppins(
                                                color: textSecondaryColor),
                                            border: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                            ),
                                            focusedBorder: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              borderSide: BorderSide(
                                                  color: primaryColor,
                                                  width: 2),
                                            ),
                                          ),
                                          validator: (value) {
                                            if (value == null ||
                                                value.isEmpty) {
                                              return 'Please enter duration';
                                            }
                                            try {
                                              final duration = int.parse(value);
                                              if (duration <= 0) {
                                                return 'Duration must be greater than zero';
                                              }
                                            } catch (e) {
                                              return 'Please enter a valid number';
                                            }
                                            return null;
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        flex: 1,
                                        child: DropdownButtonFormField<String>(
                                          value: _selectedDurationUnit,
                                          decoration: InputDecoration(
                                            labelText: 'Unit',
                                            labelStyle: GoogleFonts.poppins(
                                                color: textSecondaryColor),
                                            border: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                            ),
                                            focusedBorder: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              borderSide: BorderSide(
                                                  color: primaryColor,
                                                  width: 2),
                                            ),
                                          ),
                                          items: ['hours', 'days', 'weeks']
                                              .map((unit) => DropdownMenuItem(
                                                    value: unit,
                                                    child: Text(
                                                      unit.capitalize(),
                                                      style:
                                                          GoogleFonts.poppins(),
                                                    ),
                                                  ))
                                              .toList(),
                                          onChanged: (value) {
                                            if (value != null) {
                                              setState(() {
                                                _selectedDurationUnit = value;
                                              });
                                            }
                                          },
                                        ),
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 16),

                                  // Description field
                                  TextFormField(
                                    controller: _descriptionController,
                                    decoration: InputDecoration(
                                      labelText: 'Bid Details',
                                      labelStyle: GoogleFonts.poppins(
                                          color: textSecondaryColor),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide(
                                            color: primaryColor, width: 2),
                                      ),
                                      alignLabelWithHint: true,
                                    ),
                                    maxLines: 4,
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Please provide details for your bid';
                                      }
                                      return null;
                                    },
                                  ),

                                  const SizedBox(height: 24),

                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton(
                                      onPressed:
                                          _isSubmittingBid ? null : _submitBid,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: accentColor,
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(12),
                                        ),
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 12),
                                      ),
                                      child: _isSubmittingBid
                                          ? const SizedBox(
                                              height: 20,
                                              width: 20,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                color: Colors.white,
                                              ),
                                            )
                                          : Text(
                                              _hasBid
                                                  ? 'Update Bid'
                                                  : 'Submit Bid',
                                              style: GoogleFonts.poppins(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )
                      else
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32.0),
                            child: Column(
                              children: [
                                Icon(Icons.gavel_outlined,
                                    size: 64, color: Colors.grey[400]),
                                const SizedBox(height: 16),
                                Text(
                                  'Bidding not available',
                                  style: GoogleFonts.poppins(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                    color: textPrimaryColor,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'This repair request is no longer accepting bids.',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    color: textSecondaryColor,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
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
}

extension StringExtension on String {
  String capitalize() {
    return "${this[0].toUpperCase()}${substring(1)}";
  }
}
