import 'package:app/utils/AppColor.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class RequestDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> request;

  const RequestDetailsScreen({Key? key, required this.request})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Dummy data for demonstration
    final dummyImages = [
      "https://media.gettyimages.com/id/120374483/photo/broken-water-pipe-in-flooded-room.jpg?s=2048x2048&w=gi&k=20&c=s2u_sYmu_yTr3LVptefZ0PU6OtMqzNo3lNmcUAaX_xM=",
      "https://lirp.cdn-website.com/17c1fc63/dms3rep/multi/opt/water+damaged+furniture-640w.jpg",
    ];

    final dummyOrderDetails = {
      "base_price": 100.0,
      "extra_price": 20.0,
      "total_price": 120.0,
      "status": "in_progress",
      "payment_status": "partially_paid",
      "deadline": "2025-04-15",
    };

    final dummyPayments = [
      {
        "type": "Initial",
        "status": "paid",
        "reason": "Initial payment for plumbing",
        "amount": 100.0,
      },
      {
        "type": "Extra",
        "status": "pending",
        "reason": "Additional work for electrical wiring",
        "amount": 20.0,
      },
    ];

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: const Text("Request Details"),
        backgroundColor: surfaceColor,
        elevation: 0,
        iconTheme: IconThemeData(color: primaryColor),
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimaryColor,
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Request Information
            Text(
              "Request Information",
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
            const SizedBox(height: 16),
            _buildDetailCard(
                "Description", request["description"], primaryColor),
            _buildDetailCard("Location", request["location"], primaryColor),
            _buildDetailCard(
                "Service Type", request["serviceType"], primaryColor),
            _buildDetailCard("Status", request["status"], primaryColor),
            const SizedBox(height: 24),

            // Images
            Text(
              "Images",
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 150,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: dummyImages.length,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 16.0),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        dummyImages[index],
                        width: 150,
                        height: 150,
                        fit: BoxFit.cover,
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),

            // Order Details
            Text(
              "Order Details",
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
            const SizedBox(height: 16),
            _buildDetailCard("Base Price",
                "\$${dummyOrderDetails["base_price"]}", accentColor),
            _buildDetailCard("Extra Price",
                "\$${dummyOrderDetails["extra_price"]}", accentColor),
            _buildDetailCard("Total Price",
                "\$${dummyOrderDetails["total_price"]}", accentColor),
            _buildDetailCard("Order Status",
                dummyOrderDetails["status"] as String, accentColor),
            _buildDetailCard("Payment Status",
                dummyOrderDetails["payment_status"] as String, accentColor),
            _buildDetailCard("Deadline",
                dummyOrderDetails["deadline"] as String, accentColor),
            const SizedBox(height: 24),

            // Payments
            Text(
              "Payments",
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
                    subtitle: Text(
                      payment["reason"] as String,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: textSecondaryColor,
                      ),
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
            const SizedBox(height: 24),

            // Refund Button
            Center(
              child: ElevatedButton(
                onPressed: () {
                  // Handle refund request
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  "Request Refund",
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailCard(String label, String value, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.info_outline,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: textSecondaryColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
