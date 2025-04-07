import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PayoutsTab extends StatelessWidget {
  const PayoutsTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final dummyPayouts = [
      {
        "total_payment": 200.0,
        "commission": 10.0,
        "net_payout": 180.0,
        "status": "released",
      },
      {
        "total_payment": 150.0,
        "commission": 10.0,
        "net_payout": 135.0,
        "status": "pending",
      },
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: dummyPayouts.length,
      itemBuilder: (context, index) {
        final payout = dummyPayouts[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: ListTile(
            title: Text(
              "Total Payment: \$${payout["total_payment"]}",
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            subtitle: Text(
              "Net Payout: \$${payout["net_payout"]} • Commission: ${payout["commission"]}%",
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: Colors.grey,
              ),
            ),
            trailing: Text(
              payout["status"]! as String,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: payout["status"] == "released"
                    ? Colors.green
                    : Colors.orange,
              ),
            ),
          ),
        );
      },
    );
  }
}
