import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class HomeTab extends StatelessWidget {
  const HomeTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final dummyRequests = [
      {
        "description": "Fix leaking pipe",
        "location": "123 Main St",
        "serviceType": "Plumbing",
        "status": "pending",
      },
      {
        "description": "Repair electrical wiring",
        "location": "456 Elm St",
        "serviceType": "Electrical",
        "status": "bidding",
      },
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: dummyRequests.length,
      itemBuilder: (context, index) {
        final request = dummyRequests[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: ListTile(
            title: Text(
              request["description"]!,
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            subtitle: Text(
              "${request["location"]} • ${request["serviceType"]}",
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: Colors.grey,
              ),
            ),
            trailing: Text(
              request["status"]!,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: request["status"] == "pending"
                    ? Colors.orange
                    : request["status"] == "bidding"
                        ? Colors.blue
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
