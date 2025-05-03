import 'package:flutter/material.dart';
import 'package:app/utils/AppColor.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/services/repair_service.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:app/services/api_client.dart';

class RepairRequestScreen extends StatefulWidget {
  const RepairRequestScreen({Key? key}) : super(key: key);

  @override
  State<RepairRequestScreen> createState() => _RepairRequestScreenState();
}

class _RepairRequestScreenState extends State<RepairRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final List<XFile> _selectedImages = [];
  final ImagePicker _picker = ImagePicker();
  bool _isLoading = false;
  String? _errorMessage;
  List<Map<String, dynamic>> _serviceTypes = [];
  bool _isLoadingServiceTypes = false;
  String? _serviceTypeError;
  bool _showAllServices = false;
  int? _selectedServiceTypeId;

  @override
  void initState() {
    super.initState();
    _fetchServiceTypes();
  }

  Future<void> _fetchServiceTypes() async {
    setState(() {
      _isLoadingServiceTypes = true;
      _serviceTypeError = null;
    });

    try {
      final response = await ApiClient().request(
        method: 'GET',
        path: '/service-types',
      );

      if (response['success']) {
        setState(() {
          _serviceTypes = List<Map<String, dynamic>>.from(response['data']);
          if (_serviceTypes.isNotEmpty) {
            _selectedServiceTypeId =
                _serviceTypes.first['service_type_id'] as int;
          }
        });
      } else {
        setState(() {
          _serviceTypeError =
              response['message'] ?? 'Failed to load service types';
        });
      }
    } catch (e) {
      setState(() {
        _serviceTypeError = 'Error fetching service types: $e';
      });
    } finally {
      setState(() {
        _isLoadingServiceTypes = false;
      });
    }
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    try {
      final List<XFile> images = await _picker.pickMultiImage(
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 85,
      );

      if (images.isNotEmpty) {
        setState(() {
          // Limit to max 5 images
          if (_selectedImages.length + images.length > 5) {
            _selectedImages.addAll(images.take(5 - _selectedImages.length));
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Maximum 5 images allowed',
                    style: GoogleFonts.poppins()),
                backgroundColor: Colors.orange,
              ),
            );
          } else {
            _selectedImages.addAll(images);
          }
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              Text('Error picking images: $e', style: GoogleFonts.poppins()),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  Future<void> _submitRequest() async {
    if (_formKey.currentState!.validate()) {
      if (_selectedServiceTypeId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please select a service type'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      try {
        final repairService = RepairService();

        final response = await repairService.createRepairRequest(
          description: _descriptionController.text.trim(),
          location: _locationController.text.trim(),
          serviceTypeId: _selectedServiceTypeId!,
          imagePaths: _selectedImages.map((image) => image.path).toList(),
        );

        setState(() {
          _isLoading = false;
        });

        if (response['success'] == true) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Repair request submitted successfully!',
                    style: GoogleFonts.poppins()),
                backgroundColor: Colors.green,
              ),
            );
            Navigator.pop(context, true);
          }
        } else {
          setState(() {
            _errorMessage = response['message'] ?? 'Failed to submit request';
          });
        }
      } catch (e) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Error submitting request: $e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: primaryColor,
        title: Text(
          'New Repair Request',
          style: GoogleFonts.poppins(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Service Type Selection
                Text(
                  'Service Type',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 8),
                if (_isLoadingServiceTypes)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 20.0),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (_serviceTypeError != null)
                  Text(
                    _serviceTypeError!,
                    style: GoogleFonts.poppins(color: Colors.red),
                  )
                else
                  Container(
                    decoration: BoxDecoration(
                      color: surfaceColor,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      children: [
                        ...(_showAllServices
                                ? _serviceTypes
                                : _serviceTypes.take(4))
                            .map((type) {
                          final isSelected =
                              _selectedServiceTypeId == type['service_type_id'];
                          return Theme(
                            data: Theme.of(context).copyWith(
                              radioTheme: RadioThemeData(
                                fillColor:
                                    MaterialStateProperty.all(primaryColor),
                              ),
                            ),
                            child: RadioListTile(
                              title: Text(
                                type['name'] as String,
                                style: GoogleFonts.poppins(
                                  color: textPrimaryColor,
                                  fontSize: 14,
                                ),
                              ),
                              value: type['service_type_id'] as int,
                              groupValue: _selectedServiceTypeId,
                              onChanged: (value) {
                                setState(() {
                                  _selectedServiceTypeId = value as int;
                                });
                              },
                              dense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                          );
                        }),
                        if (_serviceTypes.length > 4)
                          TextButton(
                            onPressed: () {
                              setState(() {
                                _showAllServices = !_showAllServices;
                              });
                            },
                            child: Text(
                              _showAllServices ? 'Show Less' : 'Show More',
                              style: GoogleFonts.poppins(
                                color: primaryColor,
                                fontSize: 14,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                const SizedBox(height: 24),

                // Description label
                Text(
                  'Description',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 8),

                // Description input
                Container(
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: TextFormField(
                    controller: _descriptionController,
                    maxLines: 5,
                    decoration: InputDecoration(
                      hintText: 'Describe the issue that needs repair...',
                      hintStyle: GoogleFonts.poppins(
                        color: Colors.grey,
                        fontSize: 14,
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.all(20),
                    ),
                    style: GoogleFonts.poppins(
                      color: textPrimaryColor,
                      fontSize: 14,
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please describe the issue';
                      }
                      if (value.length < 10) {
                        return 'Description must be at least 10 characters';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(height: 24),

                // Location label
                Text(
                  'Location',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 8),

                // Location input
                Container(
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: TextFormField(
                    controller: _locationController,
                    decoration: InputDecoration(
                      hintText: 'Address where repair is needed',
                      hintStyle: GoogleFonts.poppins(
                        color: Colors.grey,
                        fontSize: 14,
                      ),
                      prefixIcon: Icon(
                        Icons.location_on_outlined,
                        color: primaryColor,
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        vertical: 16,
                        horizontal: 20,
                      ),
                    ),
                    style: GoogleFonts.poppins(
                      color: textPrimaryColor,
                      fontSize: 14,
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter the location';
                      }
                      if (value.length < 5) {
                        return 'Location must be at least 5 characters';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(height: 24),

                // Images section
                Text(
                  'Images (optional)',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 8),

                Text(
                  'Upload up to 5 images of the issue',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: textSecondaryColor,
                  ),
                ),
                const SizedBox(height: 16),

                // Image grid
                if (_selectedImages.isNotEmpty)
                  Container(
                    decoration: BoxDecoration(
                      color: surfaceColor,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(12),
                    child: GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 1,
                      ),
                      itemCount: _selectedImages.length,
                      itemBuilder: (context, index) {
                        return Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.file(
                                File(_selectedImages[index].path),
                                fit: BoxFit.cover,
                                width: double.infinity,
                                height: double.infinity,
                              ),
                            ),
                            Positioned(
                              top: 0,
                              right: 0,
                              child: GestureDetector(
                                onTap: () => _removeImage(index),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.red,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  padding: const EdgeInsets.all(2),
                                  child: const Icon(
                                    Icons.close,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),

                const SizedBox(height: 16),

                // Add image button
                GestureDetector(
                  onTap: _selectedImages.length >= 5 ? null : _pickImages,
                  child: Container(
                    decoration: BoxDecoration(
                      color: _selectedImages.length >= 5
                          ? Colors.grey.shade300
                          : primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: _selectedImages.length >= 5
                            ? Colors.grey.shade400
                            : primaryColor,
                        width: 1,
                      ),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    width: double.infinity,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.camera_alt_outlined,
                          color: _selectedImages.length >= 5
                              ? Colors.grey.shade600
                              : primaryColor,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _selectedImages.isEmpty
                              ? 'Add Images'
                              : _selectedImages.length >= 5
                                  ? 'Maximum images added'
                                  : 'Add More Images',
                          style: GoogleFonts.poppins(
                            color: _selectedImages.length >= 5
                                ? Colors.grey.shade600
                                : primaryColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Error message
                if (_errorMessage != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        vertical: 12, horizontal: 16),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline,
                            color: Colors.red.shade800, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              color: Colors.red.shade800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Submit button
                Container(
                  width: double.infinity,
                  height: 55,
                  decoration: BoxDecoration(
                    boxShadow: [
                      BoxShadow(
                        color: accentColor.withOpacity(0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submitRequest,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: accentColor,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            'Submit Request',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
