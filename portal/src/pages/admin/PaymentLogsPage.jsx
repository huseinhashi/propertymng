import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Eye, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { format } from "date-fns";

export const PaymentLogsPage = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  const columns = [
    {
      accessorKey: "payment_id",
      header: "ID",
      cell: ({ row }) => <span>#{row.original.payment_id}</span>,
    },
    {
      accessorKey: "service_order_id",
      header: "Order ID",
      cell: ({ row }) => <span>#{row.original.service_order_id}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.original.amount);
        return `$${amount.toFixed(2)}`;
      },
    },
    {
      accessorKey: "type",
      header: "Payment Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => {
        const reason = row.original.reason;
        return reason?.length > 30 ? `${reason.substring(0, 30)}...` : reason;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let variant;
        
        switch (status) {
          case "paid":
            variant = "success";
            break;
          case "pending":
            variant = "warning";
            break;
          case "refunded":
            variant = "destructive";
            break;
          case "cancelled":
            variant = "outline";
            break;
          default:
            variant = "outline";
        }
        
        return <Badge variant={variant}>{status.toUpperCase()}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => format(new Date(row.original.createdAt), "PPP"),
    },
    {
      accessorKey: "paid_at",
      header: "Paid At",
      cell: ({ row }) => row.original.paid_at ? format(new Date(row.original.paid_at), "PPP") : "Not paid",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewServiceOrder(payment.service_order_id)}
              title="View Service Order"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {payment.status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAsPaid(payment.payment_id)}
              >
                Mark as Paid
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [searchTerm, statusFilter, typeFilter, payments]);

  const filterPayments = () => {
    let filtered = [...payments];

    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(payment.payment_id).includes(searchTerm) ||
          String(payment.service_order_id).includes(searchTerm)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter((payment) => payment.type === typeFilter);
    }

    setFilteredPayments(filtered);
  };

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/admin/payments");
      setPayments(response.data.data);
      setFilteredPayments(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch payments",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewServiceOrder = (serviceOrderId) => {
    navigate(`/admin/service-orders/${serviceOrderId}`);
  };

  const handleMarkAsPaid = async (paymentId) => {
    try {
      await api.patch(`/admin/payments/${paymentId}/status`, {
        status: "paid"
      });
      
      toast({
        title: "Success",
        description: "Payment marked as paid successfully",
      });
      
      // Refresh payments data
      fetchPayments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update payment status",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Logs</h2>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by ID or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="initial">Initial</SelectItem>
              <SelectItem value="extra">Extra</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchPayments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredPayments} isLoading={isLoading} />
    </div>
  );
}; 