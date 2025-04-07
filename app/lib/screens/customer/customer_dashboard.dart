import 'package:app/providers/auth_provider.dart';
import 'package:app/utils/AppColor.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'tabs/home_tab.dart';
import 'tabs/history_tab.dart';
import 'tabs/payments_tab.dart';
import 'tabs/profile_tab.dart';

class CustomerDashboardScreen extends StatefulWidget {
  const CustomerDashboardScreen({Key? key}) : super(key: key);

  @override
  State<CustomerDashboardScreen> createState() =>
      _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState extends State<CustomerDashboardScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final userData = authProvider.userData;

    return Scaffold(
        // key: _scaffoldKey,
        backgroundColor: backgroundColor,
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
                              style: GoogleFonts.poppins(
                                  color: textSecondaryColor)),
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
              HistoryTab(),
              PaymentsTab(),
              ProfileTab(),
            ],
          ),
        ),
        floatingActionButton: _selectedIndex == 0
            ? FloatingActionButton.extended(
                backgroundColor: accentColor,
                onPressed: () {
                  // Navigate to request creation screen
                },
                icon: const Icon(Icons.add),
                label: Text('New Request', style: GoogleFonts.poppins()),
              )
            : null,
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: surfaceColor,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: BottomNavigationBar(
            currentIndex: _selectedIndex,
            onTap: (index) {
              setState(() {
                _selectedIndex = index;
              });
            },
            selectedItemColor: primaryColor,
            unselectedItemColor: textSecondaryColor,
            selectedLabelStyle:
                GoogleFonts.poppins(fontWeight: FontWeight.w500, fontSize: 12),
            unselectedLabelStyle: GoogleFonts.poppins(fontSize: 12),
            type: BottomNavigationBarType.fixed,
            backgroundColor: surfaceColor,
            elevation: 0,
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.home),
                label: "Home",
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.history),
                label: "History",
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.payment),
                label: "Payments",
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person),
                label: "Profile",
              ),
            ],
          ),
        ));
  }
}
