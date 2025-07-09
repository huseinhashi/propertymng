import 'package:app/providers/auth_provider.dart';
import 'package:app/utils/AppColor.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class ProfileTab extends StatefulWidget {
  const ProfileTab({Key? key}) : super(key: key);

  @override
  _ProfileTabState createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final userData = authProvider.userData;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "My Profile",
            style: GoogleFonts.poppins(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              color: textPrimaryColor,
            ),
          ),
          const SizedBox(height: 24),

          // Profile card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: surfaceColor,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                // Profile avatar and basic info
                CircleAvatar(
                  radius: 50,
                  backgroundColor: primaryColor.withOpacity(0.1),
                  child: Text(
                    (userData?['full_name'] as String? ?? 'U')
                        .substring(0, 1)
                        .toUpperCase(),
                    style: GoogleFonts.poppins(
                      fontSize: 36,
                      color: primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  userData?['full_name'] as String? ?? 'Expert User',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  userData?['email'] as String? ?? 'Email not available',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: textSecondaryColor,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Expert',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: primaryColor,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Divider(color: Colors.grey.withOpacity(0.2)),
                const SizedBox(height: 20),

                // Profile details
                _buildProfileDetail(
                  Icons.location_on_outlined,
                  'Address',
                  userData?['address'] as String? ?? 'Address not available',
                ),
                _buildProfileDetail(
                  Icons.verified_outlined,
                  'Verification Status',
                  userData?['is_verified'] == true
                      ? 'Verified'
                      : 'Pending Verification',
                  valueColor: userData?['is_verified'] == true
                      ? Colors.green
                      : Colors.orange,
                ),
                _buildProfileDetail(
                  Icons.account_circle_outlined,
                  'Account Status',
                  userData?['is_active'] == true ? 'Active' : 'Inactive',
                  valueColor: userData?['is_active'] == true
                      ? Colors.green
                      : Colors.red,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Action buttons
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: surfaceColor,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                _buildProfileMenuItem(
                  Icons.edit_outlined,
                  "Edit Profile",
                  () {
                    // Navigate to edit profile
                  },
                ),
                _buildProfileMenuItem(
                  Icons.notifications_outlined,
                  "Notification Settings",
                  () {
                    // Navigate to notification settings
                  },
                ),
                _buildProfileMenuItem(
                  Icons.help_outline,
                  "Help & Support",
                  () {
                    // Navigate to help
                  },
                ),
                _buildProfileMenuItem(
                  Icons.privacy_tip_outlined,
                  "Privacy Policy",
                  () {
                    // Navigate to privacy policy
                  },
                ),
                _buildProfileMenuItem(
                  Icons.logout_rounded,
                  "Logout",
                  () async {
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: Text(
                          'Logout',
                          style:
                              GoogleFonts.poppins(fontWeight: FontWeight.w600),
                        ),
                        content: Text(
                          'Are you sure you want to logout?',
                          style: GoogleFonts.poppins(),
                        ),
                        actions: [
                          TextButton(
                            child: Text(
                              'Cancel',
                              style: GoogleFonts.poppins(
                                  color: textSecondaryColor),
                            ),
                            onPressed: () => Navigator.pop(context),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: primaryColor,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            child: Text('Logout', style: GoogleFonts.poppins()),
                            onPressed: () async {
                              Navigator.pop(context);
                              final success = await authProvider.logout();
                              if (success && mounted) {
                                Navigator.pushReplacementNamed(context, '/');
                              }
                            },
                          ),
                        ],
                      ),
                    );
                  },
                  color: Colors.red,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileDetail(IconData icon, String label, String value,
      {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              color: primaryColor,
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
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: textSecondaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: valueColor ?? textPrimaryColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileMenuItem(IconData icon, String title, VoidCallback onTap,
      {Color? color}) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: (color ?? primaryColor).withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          color: color ?? primaryColor,
          size: 20,
        ),
      ),
      title: Text(
        title,
        style: GoogleFonts.poppins(
          fontSize: 16,
          color: color ?? textPrimaryColor,
        ),
      ),
      trailing: Icon(
        Icons.arrow_forward_ios,
        size: 16,
        color: textSecondaryColor,
      ),
      onTap: onTap,
    );
  }
}
