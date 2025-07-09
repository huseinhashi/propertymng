import 'package:app/providers/auth_provider.dart';
import 'package:app/utils/AppColor.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'tabs/home_tab.dart';
import 'tabs/history_tab.dart';
import 'tabs/payments_tab.dart';
import 'tabs/profile_tab.dart';
import 'orders_screen.dart';
import 'repair_request_screen.dart';
import 'package:app/services/repair_service.dart';

class CustomerDashboardScreen extends StatefulWidget {
  const CustomerDashboardScreen({Key? key}) : super(key: key);

  @override
  State<CustomerDashboardScreen> createState() =>
      _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState extends State<CustomerDashboardScreen> {
  int _selectedIndex = 0;
  List<Map<String, dynamic>> _notifications = [];
  int _unreadCount = 0;
  bool _loadingNotifications = false;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    setState(() => _loadingNotifications = true);
    final notifications = await RepairService().getCustomerNotifications();
    setState(() {
      _notifications = notifications;
      _unreadCount = notifications.where((n) => n['is_read'] == false).length;
      _loadingNotifications = false;
    });
  }

  Future<void> _markAsRead(int notificationId) async {
    await RepairService().markCustomerNotificationAsRead(notificationId);
    await _fetchNotifications();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final userData = authProvider.userData;

    return Scaffold(
        // key: _scaffoldKey,
        backgroundColor: backgroundColor,
        appBar: AppBar(
          automaticallyImplyLeading: false,
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
            Stack(
              children: [
                IconButton(
                  icon: CircleAvatar(
                    backgroundColor: primaryColor.withOpacity(0.1),
                    child: Icon(Icons.notifications_outlined,
                        color: primaryColor, size: 20),
                  ),
                  onPressed: _loadingNotifications
                      ? null
                      : () {
                          showDialog(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: Text('Notifications'),
                              content: SizedBox(
                                width: 350,
                                child: _loadingNotifications
                                    ? Center(child: CircularProgressIndicator())
                                    : _notifications.isEmpty
                                        ? Text('No notifications')
                                        : ListView.builder(
                                            shrinkWrap: true,
                                            itemCount: _notifications.length,
                                            itemBuilder: (context, i) {
                                              final n = _notifications[i];
                                              return ListTile(
                                                title: Text(n['title'] ?? ''),
                                                subtitle:
                                                    Text(n['message'] ?? ''),
                                                trailing: n['is_read']
                                                    ? null
                                                    : IconButton(
                                                        icon: Icon(Icons
                                                            .mark_email_read),
                                                        tooltip: 'Mark as read',
                                                        onPressed: () async {
                                                          await _markAsRead(n[
                                                              'notification_id']);
                                                          Navigator.of(context)
                                                              .pop();
                                                        },
                                                      ),
                                                leading: n['is_read']
                                                    ? Icon(Icons.notifications,
                                                        color: Colors.grey)
                                                    : Icon(
                                                        Icons
                                                            .notifications_active,
                                                        color: primaryColor),
                                                dense: true,
                                              );
                                            },
                                          ),
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.of(context).pop(),
                                  child: Text('Close'),
                                ),
                              ],
                            ),
                          );
                        },
                ),
                if (_unreadCount > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '$_unreadCount',
                        style: TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
                  ),
              ],
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
              OrdersScreen(),
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
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const RepairRequestScreen(),
                    ),
                  ).then((result) {
                    // Refresh the screen if request was successful
                    if (result == true) {
                      setState(() {});
                    }
                  });
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
                icon: Icon(Icons.assignment),
                label: "Orders",
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
