import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app/providers/auth_provider.dart';
import 'package:app/services/api_client.dart';
import 'package:app/utils/AppColor.dart';
import 'package:google_fonts/google_fonts.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String _selectedUserType = 'customer';
  List<Map<String, dynamic>> _serviceTypes = [];
  List<int> _selectedServiceTypeIds = [];
  bool _isLoadingServiceTypes = false;
  String? _serviceTypeError;
  bool _acceptedTerms = false;
  bool _showAllServices = false;

  bool get _isFormValid {
    final formState = _formKey.currentState;
    if (formState == null || !formState.validate()) return false;
    if (!_acceptedTerms) return false;
    if (_selectedUserType == 'expert' && _selectedServiceTypeIds.isEmpty)
      return false;
    return true;
  }

  @override
  void initState() {
    super.initState();
    _phoneController.text = '252';
    _phoneController.addListener(() {
      if (!_phoneController.text.startsWith('252')) {
        _phoneController.text = '252' + _phoneController.text;
        _phoneController.selection = TextSelection.fromPosition(
          TextPosition(offset: _phoneController.text.length),
        );
      }
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args != null && args is String) {
        setState(() {
          _selectedUserType = args;
        });
      }
      if (_selectedUserType == 'expert') {
        _fetchServiceTypes();
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
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
            _selectedServiceTypeIds = [
              _serviceTypes.first['service_type_id'] as int
            ];
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

  Future<void> _register() async {
    if (_formKey.currentState!.validate() && _isFormValid) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      bool success;

      if (_selectedUserType == 'expert') {
        success = await authProvider.registerExpert(
          _nameController.text.trim(),
          _emailController.text.trim(),
          _passwordController.text,
          _selectedServiceTypeIds,
          _addressController.text.trim(),
        );
      } else {
        success = await authProvider.registerCustomer(
          _nameController.text.trim(),
          _phoneController.text.trim(),
          _passwordController.text,
          _addressController.text.trim(),
        );
      }

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Registration successful. Please login.'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pushReplacementNamed(context, '/login');
      }
    }
  }

  void _showTermsModal() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Terms and Conditions',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
            fontSize: 20,
          ),
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '1. Acceptance of Terms',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'By registering as a customer or technician (expert), you agree to comply with and be legally bound by these Terms and Conditions, which govern your use of our platform.',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                '2. User Responsibilities',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'You are responsible for the accuracy of your provided information and for maintaining the confidentiality of your account. Any activity occurring under your account is your responsibility.',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                '3. Service Workflow',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Customers may request services by submitting details and optionally images. Technicians may view and bid on these requests based on their service type. Once a bid is accepted by the customer, it becomes a binding order at the bid price. Customers are required to pay this amount. Experts may request additional payments during service delivery, which customers can review and approve.',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                '4. Payments and Payouts',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Customer payments are held until the expert marks the job as completed and/or delivered. Upon confirmation, the expert receives the order amount minus a platform commission based on the service type. The admin handles the payout process.',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                '5. Refunds',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Customers may request refunds for orders. The admin will review and has the authority to approve or deny such requests. Refunds will be issued based on the outcome of the review.',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                '6. Privacy and Data',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'All user data is handled according to our Privacy Policy. We collect and use your data only to provide and improve our services.',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                '7. Modifications',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'We may update these Terms and Conditions from time to time. Continued use of the platform after changes means you agree to the new terms. Latest update: ${DateTime.now().toString().split(' ')[0]}',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
            },
            child: Text(
              'Close',
              style: GoogleFonts.poppins(
                color: primaryColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: Text(
          'Create Account',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        backgroundColor: primaryColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // User Type Selector
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
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedUserType = 'customer';
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: _selectedUserType == 'customer'
                                  ? primaryColor
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.person,
                                  size: 18,
                                  color: _selectedUserType == 'customer'
                                      ? Colors.white
                                      : textSecondaryColor,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Customer',
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                    color: _selectedUserType == 'customer'
                                        ? Colors.white
                                        : textSecondaryColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedUserType = 'expert';
                              _fetchServiceTypes();
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: _selectedUserType == 'expert'
                                  ? primaryColor
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.engineering,
                                  size: 18,
                                  color: _selectedUserType == 'expert'
                                      ? Colors.white
                                      : textSecondaryColor,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Expert',
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                    color: _selectedUserType == 'expert'
                                        ? Colors.white
                                        : textSecondaryColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Registration Form
                Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Service Types for Expert (moved to top)
                      if (_selectedUserType == 'expert')
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildInputLabel('Service Types'),
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
                                      final isSelected = _selectedServiceTypeIds
                                          .contains(type['service_type_id']);
                                      return Theme(
                                        data: Theme.of(context).copyWith(
                                          checkboxTheme: CheckboxThemeData(
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(4),
                                            ),
                                          ),
                                        ),
                                        child: CheckboxListTile(
                                          title: Text(
                                            type['name'] as String,
                                            style: GoogleFonts.poppins(
                                              color: textPrimaryColor,
                                              fontSize: 14,
                                            ),
                                          ),
                                          value: isSelected,
                                          onChanged: (selected) {
                                            setState(() {
                                              if (selected == true) {
                                                _selectedServiceTypeIds.add(
                                                    type['service_type_id']);
                                              } else {
                                                _selectedServiceTypeIds.remove(
                                                    type['service_type_id']);
                                              }
                                            });
                                          },
                                          activeColor: primaryColor,
                                          checkColor: Colors.white,
                                          controlAffinity:
                                              ListTileControlAffinity.leading,
                                          dense: true,
                                          contentPadding: EdgeInsets.zero,
                                        ),
                                      );
                                    }),
                                    if (_serviceTypes.length > 4)
                                      TextButton(
                                        onPressed: () {
                                          setState(() {
                                            _showAllServices =
                                                !_showAllServices;
                                          });
                                        },
                                        child: Text(
                                          _showAllServices
                                              ? 'Show Less'
                                              : 'Show More',
                                          style: GoogleFonts.poppins(
                                            color: primaryColor,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ),
                                    if (_selectedServiceTypeIds.isEmpty)
                                      Padding(
                                        padding: const EdgeInsets.all(8.0),
                                        child: Text(
                                          'Please select at least one service type',
                                          style: GoogleFonts.poppins(
                                            color: Colors.red,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            const SizedBox(height: 16),
                          ],
                        ),

                      // Name field
                      _buildInputLabel(
                          _selectedUserType == 'expert' ? 'Full Name' : 'Name'),
                      _buildInputField(
                        controller: _nameController,
                        hintText: 'Enter your name',
                        icon: Icons.person_outline,
                        validator: _validateName,
                      ),
                      const SizedBox(height: 16),

                      // Email for expert
                      if (_selectedUserType == 'expert')
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildInputLabel('Email'),
                            _buildInputField(
                              controller: _emailController,
                              hintText: 'example@email.com',
                              icon: Icons.email_outlined,
                              keyboardType: TextInputType.emailAddress,
                              validator: _validateEmail,
                            ),
                            const SizedBox(height: 16),
                          ],
                        ),

                      // Phone for customer
                      if (_selectedUserType == 'customer')
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildInputLabel('Phone Number'),
                            _buildInputField(
                              controller: _phoneController,
                              hintText: '07xxxxxxxx',
                              icon: Icons.phone_outlined,
                              keyboardType: TextInputType.phone,
                              validator: _validatePhone,
                            ),
                            const SizedBox(height: 16),
                          ],
                        ),

                      // Address field
                      _buildInputLabel('Address'),
                      _buildInputField(
                        controller: _addressController,
                        hintText: 'Enter your address',
                        icon: Icons.location_on_outlined,
                        validator: _validateAddress,
                      ),
                      const SizedBox(height: 16),

                      // Password field
                      _buildInputLabel('Password'),
                      _buildInputField(
                        controller: _passwordController,
                        hintText: '••••••••',
                        icon: Icons.lock_outline,
                        obscureText: _obscurePassword,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: primaryColor,
                          ),
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                        ),
                        validator: _validatePassword,
                      ),
                      const SizedBox(height: 16),

                      // Confirm Password field
                      _buildInputLabel('Confirm Password'),
                      _buildInputField(
                        controller: _confirmPasswordController,
                        hintText: '••••••••',
                        icon: Icons.lock_outline,
                        obscureText: _obscureConfirmPassword,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscureConfirmPassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: primaryColor,
                          ),
                          onPressed: () {
                            setState(() {
                              _obscureConfirmPassword =
                                  !_obscureConfirmPassword;
                            });
                          },
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please confirm your password';
                          }
                          if (value != _passwordController.text) {
                            return 'Passwords do not match';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Terms and Conditions Checkbox
                      Row(
                        children: [
                          Checkbox(
                            value: _acceptedTerms,
                            onChanged: (value) {
                              setState(() {
                                _acceptedTerms = value ?? false;
                              });
                            },
                            activeColor: primaryColor,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          Expanded(
                            child: Row(
                              children: [
                                Text(
                                  'I agree to the ',
                                  style: GoogleFonts.poppins(
                                    color: textPrimaryColor,
                                    fontSize: 14,
                                  ),
                                ),
                                GestureDetector(
                                  onTap: _showTermsModal,
                                  child: Text(
                                    'Terms and Conditions',
                                    style: GoogleFonts.poppins(
                                      color: primaryColor,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      decoration: TextDecoration.underline,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Error message
                      if (authProvider.error != null)
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
                                  authProvider.error!,
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    color: Colors.red.shade800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      // Register Button
                      Container(
                        width: double.infinity,
                        height: 55,
                        margin: const EdgeInsets.only(top: 8),
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
                          onPressed: _isFormValid && !authProvider.isLoading
                              ? _register
                              : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor:
                                _isFormValid ? accentColor : Colors.grey,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: authProvider.isLoading
                              ? SizedBox(
                                  height: 24,
                                  width: 24,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(
                                  'Register',
                                  style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Login Link
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "Already have an account?",
                            style: GoogleFonts.poppins(
                              color: textSecondaryColor,
                              fontSize: 14,
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.pushReplacementNamed(
                                context,
                                '/login',
                                arguments: _selectedUserType,
                              );
                            },
                            style: TextButton.styleFrom(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 8),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: Text(
                              'Login Now',
                              style: GoogleFonts.poppins(
                                color: accentColor,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
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
      ),
    );
  }

  Widget _buildInputLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        label,
        style: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimaryColor,
        ),
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String hintText,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    bool obscureText = false,
    Widget? suffixIcon,
    required String? Function(String?) validator,
  }) {
    return Container(
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
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscureText,
        style: GoogleFonts.poppins(
          color: textPrimaryColor,
          fontSize: 14,
        ),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: GoogleFonts.poppins(
            color: Colors.grey,
            fontSize: 14,
          ),
          prefixIcon: Icon(icon, color: primaryColor),
          suffixIcon: suffixIcon,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            vertical: 16,
            horizontal: 20,
          ),
        ),
        validator: validator,
      ),
    );
  }

  String? _validateName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your name';
    }
    if (value.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(value)) {
      return 'Name can only contain letters and spaces';
    }
    return null;
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your email';
    }
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  String? _validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your phone number';
    }
    if (!value.startsWith('252')) {
      return 'Phone number must start with 252';
    }
    if (!RegExp(r'^252[0-9]{9}$').hasMatch(value)) {
      return 'Please enter a valid 9-digit number after 252';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your password';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!RegExp(r'[A-Z]').hasMatch(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!RegExp(r'[a-z]').hasMatch(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!RegExp(r'[0-9]').hasMatch(value)) {
      return 'Password must contain at least one number';
    }
    if (!RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(value)) {
      return 'Password must contain at least one special character';
    }
    return null;
  }

  String? _validateAddress(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your address';
    }
    if (value.length < 5) {
      return 'Address must be at least 5 characters';
    }
    return null;
  }
}
