// Modern History Tab
import 'package:app/screens/customer/request_details_screen.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:app/utils/AppColor.dart';

class HistoryTab extends StatefulWidget {
  const HistoryTab({Key? key}) : super(key: key);

  @override
  State<HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends State<HistoryTab> {
  String selectedStatus = "All";

  final List<Map<String, dynamic>> dummyRequests = [
    {
      "description": "Armaajo baa iga halaysan", //translate to somali language
      "location": "Tarbuunka",
      "serviceType": "Furniture",
      "status": "pending",
      "date": "Mar 30, 2025",
      "icon": Icons.water_drop_rounded,
      "color": Colors.blue,
    },
    {
      "description":
          "Xerkaha korontada iga halaysan waana ku wareeray inaa xaliyo",
      "location": "suuqbacaad",
      "serviceType": "Electrical",
      "status": "bidding",
      "date": "Mar 25, 2025",
      "icon": Icons.electrical_services_rounded,
      "color": Colors.amber,
    },
    {
      "description": "qolka jiifka dayactir u baahan",
      "location": "xamarweyne",
      "serviceType": "Furniture",
      "status": "completed",
      "date": "Mar 15, 2025",
      "icon": Icons.format_paint_rounded,
      "color": Colors.purple,
    },
    {
      "description":
          "Tubooyinka musqusha welibo mida qabayska dayactir u baahan",
      "location": "suuqa xoolaha",
      "serviceType": "Tiling",
      "status": "completed",
      "date": "Mar 10, 2025",
      "icon": Icons.grid_on_rounded,
      "color": Colors.teal,
    },
  ];

  @override
  Widget build(BuildContext context) {
    List<Map<String, dynamic>> filteredRequests = selectedStatus == "All"
        ? dummyRequests
        : dummyRequests
            .where((request) =>
                request["status"].toString().toLowerCase() ==
                selectedStatus.toLowerCase())
            .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
          child: Text(
            "Service History",
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: textPrimaryColor,
            ),
          ),
        ),

        // Filter chips
        Container(
          height: 50,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _buildFilterChip("All"),
              _buildFilterChip("Pending"),
              _buildFilterChip("Bidding"),
              _buildFilterChip("In Progress"),
              _buildFilterChip("Completed"),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // History list
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: filteredRequests.length,
            itemBuilder: (context, index) {
              final request = filteredRequests[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _buildRequestCard(context, request),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = selectedStatus.toLowerCase() == label.toLowerCase();

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Text(label),
        labelStyle: GoogleFonts.poppins(
          color: isSelected ? Colors.white : textSecondaryColor,
          fontSize: 13,
        ),
        backgroundColor: Colors.transparent,
        selectedColor: primaryColor,
        checkmarkColor: Colors.white,
        showCheckmark: false,
        shape: StadiumBorder(
          side: BorderSide(
            color: isSelected ? primaryColor : Colors.grey.shade300,
          ),
        ),
        onSelected: (_) {
          setState(() {
            selectedStatus = label;
          });
        },
      ),
    );
  }

  Widget _buildRequestCard(BuildContext context, Map<String, dynamic> request) {
    Color statusColor;
    IconData statusIcon;

    switch (request["status"]) {
      case "pending":
        statusColor = Colors.orange;
        statusIcon = Icons.schedule_rounded;
        break;
      case "bidding":
        statusColor = Colors.blue;
        statusIcon = Icons.gavel_rounded;
        break;
      case "in_progress":
        statusColor = Colors.purple;
        statusIcon = Icons.engineering_rounded;
        break;
      case "completed":
        statusColor = Colors.green;
        statusIcon = Icons.check_circle_rounded;
        break;
      default:
        statusColor = Colors.grey;
        statusIcon = Icons.help_outline_rounded;
    }

    return Container(
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => RequestDetailsScreen(request: request),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: (request["color"] as Color).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        request["icon"] as IconData,
                        color: request["color"] as Color,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            request["description"] as String,
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: textPrimaryColor,
                            ),
                          ),
                          Text(
                            request["serviceType"] as String,
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              color: textSecondaryColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            statusIcon,
                            size: 14,
                            color: statusColor,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            (request["status"] as String),
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: statusColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 16,
                      color: Colors.grey,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      request["location"] as String,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: textSecondaryColor,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      request["date"] as String,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: textSecondaryColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
