import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/services/repair_service.dart';
import 'package:app/screens/expert/order_details_screen.dart';

class PayoutsTab extends StatefulWidget {
  const PayoutsTab({Key? key}) : super(key: key);

  @override
  State<PayoutsTab> createState() => _PayoutsTabState();
}

class _PayoutsTabState extends State<PayoutsTab> {
  final RepairService _repairService = RepairService();
  bool _isLoading = true;
  List<Map<String, dynamic>> _payouts = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchPayouts();
  }

  Future<void> _fetchPayouts() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    final response = await _repairService.getExpertPayouts();
    if (response['success'] == true && response['data'] != null) {
      setState(() {
        _payouts = List<Map<String, dynamic>>.from(response['data']);
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = response['message'] ?? 'Failed to load payouts';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Error loading payouts',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: GoogleFonts.poppins(fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchPayouts,
              child: Text('Try Again', style: GoogleFonts.poppins()),
            ),
          ],
        ),
      );
    }
    if (_payouts.isEmpty) {
      return RefreshIndicator(
        onRefresh: _fetchPayouts,
        child: ListView(
          children: [
            SizedBox(
              height: MediaQuery.of(context).size.height * 0.3,
            ),
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.attach_money, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'No Payouts Yet',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Complete orders to see your payouts here',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _fetchPayouts,
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: _payouts.length,
        itemBuilder: (context, index) {
          final payout = _payouts[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: ListTile(
              title: Text(
                "Net Payout: \$${payout["net_payout"]}",
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: Text(
                "Total Payment: \$${payout["total_payment"]} • Commission: \$${payout["commission"]} (${payout["commission_percent"] ?? '-'}%)",
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  color: Colors.grey,
                ),
              ),
              trailing: Text(
                payout["payout_status"] ?? '',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: payout["payout_status"] == "released"
                      ? Colors.green
                      : Colors.orange,
                ),
              ),
              onTap: payout["service_order_id"] != null
                  ? () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ExpertOrderDetailsScreen(
                            orderId: payout["service_order_id"],
                          ),
                        ),
                      ).then((_) => _fetchPayouts());
                    }
                  : null,
            ),
          );
        },
      ),
    );
  }
}
