import 'package:app/providers/auth_provider.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:app/utils/AppColor.dart';

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
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: textPrimaryColor,
            ),
          ),
          const SizedBox(height: 24),

          // Profile card
          Container(
            padding: const EdgeInsets.all(20),
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
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: primaryColor.withOpacity(0.1),
                  child: Text(
                    (userData?['name'] as String? ?? 'U')
                        .substring(0, 1)
                        .toUpperCase(),
                    style: GoogleFonts.poppins(
                      fontSize: 30,
                      color: primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  userData?['name'] as String? ?? 'User',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: textPrimaryColor,
                  ),
                ),
                Text(
                  userData?['phone'] as String? ?? 'not available yert',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: textSecondaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                Divider(),
                const SizedBox(height: 16),

                // Profile menu items
                _buildProfileMenuItem(
                    Icons.person_outline, "Personal Information", () {}),
                _buildProfileMenuItem(
                    Icons.home_outlined, "My Properties", () {}),
                _buildProfileMenuItem(Icons.notifications_outlined,
                    "Notification Settings", () {}),
                _buildProfileMenuItem(
                    Icons.help_outline, "Help & Support", () {}),
                _buildProfileMenuItem(
                    Icons.privacy_tip_outlined, "Privacy Policy", () {}),
                _buildProfileMenuItem(Icons.logout_rounded, "Logout", () async {
                  final success =
                      await Provider.of<AuthProvider>(context, listen: false)
                          .logout();
                  if (success && mounted) {
                    Navigator.pushReplacementNamed(context, '/');
                  }
                }, color: Colors.red),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileMenuItem(IconData icon, String title, VoidCallback onTap,
      {Color? color}) {
    final Color textPrimaryColor = const Color(0xFF1F2937); // Gray-800
    final Color textSecondaryColor = const Color(0xFF6B7280); // Gray-500

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
