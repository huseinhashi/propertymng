import 'package:app/utils/AppColor.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'tabs/home_tab.dart';
import 'tabs/bids_tab.dart';
import 'tabs/orders_tab.dart';
import 'tabs/payouts_tab.dart';
import 'tabs/profile_tab.dart';
import 'package:provider/provider.dart';
import 'package:app/providers/auth_provider.dart';

class ExpertDashboardScreen extends StatefulWidget {
  const ExpertDashboardScreen({Key? key}) : super(key: key);

  @override
  State<ExpertDashboardScreen> createState() => _ExpertDashboardScreenState();
}

class _ExpertDashboardScreenState extends State<ExpertDashboardScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final userData = authProvider.userData;
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: surfaceColor,
        title: Row(
          children: [
            Image.asset(
              'assets/logo.png', // Make sure to add this asset
              height: 32,
              // Fallback if asset isn't available
              errorBuilder: (context, error, stackTrace) => Text(
                  'JustProperty Pro',
                  style: GoogleFonts.poppins(
                      color: primaryColor, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: CircleAvatar(
              backgroundColor: primaryColor.withOpacity(0.1),
              child: Icon(Icons.notifications_outlined,
                  color: primaryColor, size: 20),
            ),
            onPressed: () {
              // Show notifications
            },
          ),
          const SizedBox(width: 8),
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: GestureDetector(
              onTap: () async {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: Text('Logout',
                        style:
                            GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                    content: Text('Are you sure you want to logout?',
                        style: GoogleFonts.poppins()),
                    actions: [
                      TextButton(
                        child: Text('Cancel',
                            style:
                                GoogleFonts.poppins(color: textSecondaryColor)),
                        onPressed: () => Navigator.pop(context),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
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
              child: CircleAvatar(
                backgroundColor: primaryColor.withOpacity(0.1),
                child: Text(
                  (userData?['name'] as String? ?? 'U')
                      .substring(0, 1)
                      .toUpperCase(),
                  style: GoogleFonts.poppins(
                      color: primaryColor, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: IndexedStack(
          index: _selectedIndex,
          children: const [
            HomeTab(),
            BidsTab(),
            OrdersTab(),
            PayoutsTab(),
            ProfileTab(),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        selectedItemColor: Colors.green,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: "Home",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.gavel),
            label: "Bids",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment),
            label: "Orders",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.attach_money),
            label: "Payouts",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: "Profile",
          ),
        ],
      ),
    );
  }
}
