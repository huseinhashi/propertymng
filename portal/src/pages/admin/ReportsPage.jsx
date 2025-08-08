import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, FileText, TrendingUp, Users, CreditCard, Briefcase, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

const reportTypes = [
  { value: "dashboard-summary", label: "Dashboard Summary", icon: TrendingUp },
  { value: "service-orders", label: "Service Orders", icon: FileText },
  { value: "repair-requests", label: "Repair Requests", icon: AlertCircle },
  { value: "payments", label: "Payments", icon: CreditCard },
  { value: "payouts", label: "Payouts", icon: CreditCard },
  { value: "customers", label: "Customers", icon: Users },
  { value: "experts", label: "Technicians", icon: Briefcase },
  { value: "bids", label: "Bids", icon: FileText },
  { value: "refunds", label: "Refunds", icon: CreditCard },
];

const dateFilters = [
  { value: "all_time", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "this_month", label: "This Month" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

const statusOptions = {
  "service-orders": [
    { value: "all", label: "All Status" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "delivered", label: "Delivered" },
    { value: "refunded", label: "Refunded" },
  ],
  "repair-requests": [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "bidding", label: "Bidding" },
    { value: "closed", label: "Closed" },
    { value: "rejected", label: "Rejected" },
  ],
  "payments": [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "refunded", label: "Refunded" },
    { value: "cancelled", label: "Cancelled" },
  ],
  "payouts": [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "released", label: "Released" },
  ],
  "bids": [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
  ],
  "refunds": [
    { value: "all", label: "All Status" },
    { value: "requested", label: "Requested" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ],
};

export const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState("dashboard-summary");
  const [dateFilter, setDateFilter] = useState("all_time");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [status, setStatus] = useState("all");
  const [isActive, setIsActive] = useState("all");
  const [isVerified, setIsVerified] = useState("all");
  const { toast } = useToast();

  const getQueryParams = () => {
    const params = {
      dateFilter,
      status,
    };

    if (dateFilter === "custom") {
      params.customStartDate = customStartDate;
      params.customEndDate = customEndDate;
    }

    if (selectedReport === "customers") {
      params.isActive = isActive;
    }

    if (selectedReport === "experts") {
      params.isActive = isActive;
      params.isVerified = isVerified;
    }

    if (selectedReport === "bids") {
      params.status = status;
    }

    return params;
  };

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ["reports", selectedReport, getQueryParams()],
    queryFn: async () => {
      const params = getQueryParams();
      const response = await api.get(`/reports/${selectedReport}`, { params });
      return response.data;
    },
    enabled: selectedReport !== "",
  });

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "$0.00";
    
    // Handle if it's already a formatted string
    if (typeof amount === "string" && amount.includes("$")) {
      return amount;
    }
    
    const num = parseFloat(amount);
    if (isNaN(num)) return "$0.00";
    return `$${num.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      delivered: "bg-green-100 text-green-800",
      refunded: "bg-red-100 text-red-800",
      bidding: "bg-blue-100 text-blue-800",
      closed: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
      paid: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      released: "bg-green-100 text-green-800",
      accepted: "bg-green-100 text-green-800",
      requested: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
    };

    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {status?.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const exportToPDF = () => {
    if (!reportData?.data) return;

    const doc = new jsPDF();
    const reportType = reportTypes.find(r => r.value === selectedReport)?.label || "Report";
    const currentDate = new Date().toLocaleDateString();

    // Add title
    doc.setFontSize(20);
    doc.text(`${reportType} Report`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${currentDate}`, 14, 30);
    doc.text(`Date Filter: ${dateFilters.find(d => d.value === dateFilter)?.label}`, 14, 40);

    if (dateFilter === "custom") {
      doc.text(`Custom Range: ${customStartDate} to ${customEndDate}`, 14, 50);
    }

    // Add summary if available
    if (reportData.data.summary) {
      doc.setFontSize(14);
      doc.text("Summary", 14, 70);
      doc.setFontSize(10);

      let yPosition = 80;
      Object.entries(reportData.data.summary).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
        let displayValue = value;
        
        // Only format currency for specific fields that are numbers and not already formatted
        if (typeof value === "number" && (key.includes("Amount") || key.includes("Revenue") || key.includes("Price") || key.includes("Cost"))) {
          displayValue = formatCurrency(value);
        } else if (typeof value === "string" && value.includes("$")) {
          // If it's already formatted as currency, don't format again
          displayValue = value;
        } else if (typeof value === "string" && !isNaN(parseFloat(value)) && (key.includes("Amount") || key.includes("Revenue") || key.includes("Price") || key.includes("Cost"))) {
          // Handle string numbers that should be formatted as currency
          displayValue = formatCurrency(parseFloat(value));
        } else if (typeof value === "string" && value.match(/^\d+\.\d{2}$/) && (key.includes("Amount") || key.includes("Revenue") || key.includes("Price") || key.includes("Cost"))) {
          // Handle string numbers like "00.01" that should be formatted as currency
          displayValue = formatCurrency(parseFloat(value));
        }
        
        doc.text(`${label}: ${displayValue}`, 14, yPosition);
        yPosition += 8;
      });
    }

    // Add data table if available
    const dataKey = Object.keys(reportData.data).find(key => 
      key !== "summary" && key !== "filters" && Array.isArray(reportData.data[key])
    );

    if (dataKey && reportData.data[dataKey].length > 0) {
      const data = reportData.data[dataKey];
      const headers = Object.keys(data[0]).filter(key => 
        !key.includes("_id") && key !== "password_hash" && key !== "password"
      );

      const tableData = data.map(item => 
        headers.map(header => {
          const value = item[header];
                     if (header === "createdAt" || header === "updatedAt") {
             return formatDate(value);
           }
           if (header === "status" || header === "payout_status") {
             return value?.replace("_", " ").toUpperCase();
           }
           if (header === "amount" || header === "total_price" || header === "net_payout" || header === "cost" || header === "total_payment" || header === "commission") {
             return formatCurrency(value);
           }
           if (header === "customer" || header === "expert" || header === "bid" || header === "repair_request" || header === "service_order") {
             return "N/A"; // Skip object fields
           }
           if (header === "customer_name" || header === "expert_name" || header === "customer_phone" || header === "expert_email") {
             return value || "Unknown";
           }
          return value?.toString() || "";
        })
      );

             // Create shorter column headers for better fit
       const shortHeaders = headers.map(h => {
         const header = h
           .replace("_", " ")
           .replace("customer name", "Customer")
           .replace("customer phone", "Phone")
           .replace("expert name", "Expert")
           .replace("expert email", "Email")
           .replace("total payment", "Payment")
           .replace("net payout", "Payout")
           .replace("payout status", "Status")
           .replace("released at", "Released")
           .replace("createdat", "Created")
           .replace("updatedat", "Updated")
           .toUpperCase();
         
         return header.length > 12 ? header.substring(0, 12) : header;
       });

       autoTable(doc, {
         head: [shortHeaders],
         body: tableData,
         startY: 120,
         styles: { fontSize: 7 },
         headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
         columnStyles: {
           0: { cellWidth: 20 }, // ID columns
           1: { cellWidth: 25 }, // Name columns
           2: { cellWidth: 25 }, // Email/Phone columns
           3: { cellWidth: 20 }, // Amount columns
           4: { cellWidth: 15 }, // Status columns
           5: { cellWidth: 20 }, // Date columns
         },
         margin: { top: 120, right: 10, bottom: 10, left: 10 },
       });
    }

    // Save the PDF
    const fileName = `${selectedReport}_report_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);

    toast({
      title: "PDF Exported",
      description: `Report has been exported as ${fileName}`,
    });
  };

  const renderSummaryCards = () => {
    if (!reportData?.data?.summary) return null;

    const summary = reportData.data.summary;
    const cards = [];

    Object.entries(summary).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
      let displayValue = value;
      
             // Only format currency for specific fields that are numbers and not already formatted
       if (typeof value === "number" && (key.includes("Amount") || key.includes("Revenue") || key.includes("Price") || key.includes("Cost"))) {
         displayValue = formatCurrency(value);
       } else if (typeof value === "string" && value.includes("$")) {
         // If it's already formatted as currency, don't format again
         displayValue = value;
       } else if (typeof value === "string" && !isNaN(parseFloat(value)) && (key.includes("Amount") || key.includes("Revenue") || key.includes("Price") || key.includes("Cost"))) {
         // Handle string numbers that should be formatted as currency
         displayValue = formatCurrency(parseFloat(value));
       } else if (typeof value === "string" && value.match(/^\d+\.\d{2}$/) && (key.includes("Amount") || key.includes("Revenue") || key.includes("Price") || key.includes("Cost"))) {
         // Handle string numbers like "00.01" that should be formatted as currency
         displayValue = formatCurrency(parseFloat(value));
       } else {
         displayValue = value;
       }

      cards.push(
        <Card key={key} className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayValue}</div>
          </CardContent>
        </Card>
      );
    });

    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{cards}</div>;
  };

  const renderDataTable = () => {
    const dataKey = Object.keys(reportData?.data || {}).find(key => 
      key !== "summary" && key !== "filters" && Array.isArray(reportData.data[key])
    );

    if (!dataKey || !reportData.data[dataKey]?.length) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No data available for the selected filters</p>
          </CardContent>
        </Card>
      );
    }

    const data = reportData.data[dataKey];
    const headers = Object.keys(data[0]).filter(key => 
      !key.includes("_id") && key !== "password_hash" && key !== "password"
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Data</span>
            <Button onClick={exportToPDF} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                                     {headers.map(header => (
                     <TableHead key={header}>
                       {header
                         .replace("_", " ")
                         .replace("customer name", "Customer Name")
                         .replace("customer phone", "Customer Phone")
                         .replace("expert name", "Expert Name")
                         .replace("expert email", "Expert Email")
                         .replace("total payment", "Total Payment")
                         .replace("net payout", "Net Payout")
                         .replace("payout status", "Payout Status")
                         .replace("released at", "Released At")
                         .replace("createdat", "Created At")
                         .replace("updatedat", "Updated At")
                         .split(" ")
                         .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                         .join(" ")}
                     </TableHead>
                   ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                                         {headers.map(header => (
                                            <TableCell key={header}>
                       {header === "createdAt" || header === "updatedAt" ? (
                         formatDate(item[header])
                       ) : header === "status" || header === "payout_status" ? (
                         getStatusBadge(item[header])
                       ) : header === "amount" || header === "total_price" || header === "net_payout" || header === "cost" || header === "total_payment" || header === "commission" ? (
                         formatCurrency(item[header])
                       ) : header === "customer" || header === "expert" || header === "bid" || header === "repair_request" || header === "service_order" ? (
                         "N/A" // Skip object fields
                       ) : header === "customer_name" || header === "expert_name" ? (
                         item[header] || "Unknown"
                       ) : header === "customer_phone" || header === "expert_email" ? (
                         item[header] || "Unknown"
                       ) : (
                         item[header]?.toString() || ""
                       )}
                     </TableCell>
                     ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Error loading report</h3>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export detailed reports for your business
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Report Type */}
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center">
                        <type.icon className="h-4 w-4 mr-2" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="date-filter">Date Filter</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date filter" />
                </SelectTrigger>
                <SelectContent>
                  {dateFilters.map(filter => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            {statusOptions[selectedReport] && (
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions[selectedReport].map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Active Filter for Customers/Experts */}
            {(selectedReport === "customers" || selectedReport === "experts") && (
              <div className="space-y-2">
                <Label htmlFor="active-filter">Active Status</Label>
                <Select value={isActive} onValueChange={setIsActive}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select active status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Verified Filter for Experts */}
            {selectedReport === "experts" && (
              <div className="space-y-2">
                <Label htmlFor="verified-filter">Verification Status</Label>
                <Select value={isVerified} onValueChange={setIsVerified}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Verified</SelectItem>
                    <SelectItem value="false">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Custom Date Range */}
          {dateFilter === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading report...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Data */}
      {!isLoading && reportData && (
        <div className="space-y-6">
          {renderSummaryCards()}
          {renderDataTable()}
        </div>
      )}
    </div>
  );
};
