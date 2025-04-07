import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class OrdersTab extends StatelessWidget {
  const OrdersTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final dummyOrders = [
      {
        "request": "Fix leaking pipe",
        "status": "in_progress",
        "total_price": 120.0,
      },
      {
        "request": "Repair electrical wiring",
        "status": "completed",
        "total_price": 200.0,
      },
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: dummyOrders.length,
      itemBuilder: (context, index) {
        final order = dummyOrders[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: ListTile(
            title: Text(
              order["request"]! as String,
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            subtitle: Text(
              "Total: \$${order["total_price"]}",
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: Colors.grey,
              ),
            ),
            trailing: Text(
              order["status"]! as String,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: order["status"] == "in_progress"
                    ? Colors.orange
                    : Colors.green,
              ),
            ),
            onTap: () {
              // Navigate to request details page
            },
          ),
        );
      },
    );
  }
}
