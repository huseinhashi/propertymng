import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class BidsTab extends StatelessWidget {
  const BidsTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final dummyBids = [
      {
        "request": "Fix leaking pipe",
        "cost": 100.0,
        "deadline": "2025-04-10",
        "is_accepted": false,
      },
      {
        "request": "Repair electrical wiring",
        "cost": 200.0,
        "deadline": "2025-04-15",
        "is_accepted": true,
      },
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: dummyBids.length,
      itemBuilder: (context, index) {
        final bid = dummyBids[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: ListTile(
            title: Text(
              bid["request"]! as String,
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            subtitle: Text(
              "Cost: \$${bid["cost"]} • Deadline: ${bid["deadline"]}",
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: Colors.grey,
              ),
            ),
            trailing: Text(
              bid["is_accepted"]! as bool ? "Accepted" : "Pending",
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: (bid["is_accepted"]! as bool)
                    ? Colors.green
                    : Colors.orange,
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
