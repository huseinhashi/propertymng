import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/utils/AppColor.dart';

class PaymentsTab extends StatelessWidget {
  const PaymentsTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final dummyPayments = [
      {
        "type": "Initial",
        "status": "paid",
        "reason": "Initial payment for plumbing",
        "amount": 100.0,
        "date": "2025-04-01",
      },
      {
        "type": "Extra",
        "status": "pending",
        "reason": "xerkaha korontada lacagtooda wyeh",
        "amount": 50.0,
        "date": "2025-04-03",
      },
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Payment History",
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: textPrimaryColor,
            ),
          ),
          const SizedBox(height: 16),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: dummyPayments.length,
            itemBuilder: (context, index) {
              final payment = dummyPayments[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: payment["status"] == "paid"
                          ? Colors.green.withOpacity(0.1)
                          : Colors.orange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      payment["status"] == "paid"
                          ? Icons.check_circle_outline
                          : Icons.pending_actions,
                      color: payment["status"] == "paid"
                          ? Colors.green
                          : Colors.orange,
                    ),
                  ),
                  title: Text(
                    "${payment["type"]} Payment",
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: textPrimaryColor,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        payment["reason"] as String,
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          color: textSecondaryColor,
                        ),
                      ),
                      Text(
                        payment["date"] as String,
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: textSecondaryColor,
                        ),
                      ),
                    ],
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        "\$${payment["amount"]}",
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: textPrimaryColor,
                        ),
                      ),
                      Text(
                        payment["status"] as String,
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: payment["status"] == "paid"
                              ? Colors.green
                              : Colors.orange,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

extension StringExtension on String {
  String capitalize() {
    return "${this[0].toUpperCase()}${substring(1)}";
  }
}
