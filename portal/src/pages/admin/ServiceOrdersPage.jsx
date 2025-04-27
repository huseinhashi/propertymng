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

export const ServiceOrdersPage = () => {
  const [serviceOrders, setServiceOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  const columns = [
    {
      accessorKey: "service_order_id",
      header: "ID",
      cell: ({ row }) => <span>#{row.original.service_order_id}</span>,
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const order = row.original;
        return order.bid?.repair_request?.customer?.name || "Unknown";
      },
    },
    {
      accessorKey: "expert",
      header: "Expert",
      cell: ({ row }) => {
        const order = row.original;
        return order.bid?.expert?.full_name || "Unknown";
      },
    },
    {
      accessorKey: "description",
      header: "Service",
      cell: ({ row }) => {
        const description = row.original.bid?.repair_request?.description;
        return description?.length > 30 ? `${description.substring(0, 30)}...` : description || "No description";
      },
    },
    {
      accessorKey: "total_price",
      header: "Total Price",
      cell: ({ row }) => {
        const price = parseFloat(row.original.total_price);
        return `$${price.toFixed(2)}`;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let variant;
        
        switch (status) {
          case "in_progress":
            variant = "warning";
            break;
          case "completed":
            variant = "success";
            break;
          case "delivered":
            variant = "default";
            break;
          case "refunded":
            variant = "destructive";
            break;
          default:
            variant = "outline";
        }
        
        return <Badge variant={variant}>{status.toUpperCase().replace("_", " ")}</Badge>;
      },
    },
    {
      accessorKey: "payment_status",
      header: "Payment",
      cell: ({ row }) => {
        const status = row.original.payment_status;
        let variant;
        
        switch (status) {
          case "fully_paid":
            variant = "success";
            break;
          case "partially_paid":
            variant = "warning";
            break;
          case "unpaid":
            variant = "destructive";
            break;
          case "refunded":
            variant = "secondary";
            break;
          default:
            variant = "outline";
        }
        
        return <Badge variant={variant}>{status.toUpperCase().replace("_", " ")}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => format(new Date(row.original.createdAt), "PPP"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewClick(order)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchServiceOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, paymentStatusFilter, serviceOrders]);

  const filterOrders = () => {
    let filtered = [...serviceOrders];

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          (order.bid?.repair_request?.description && 
           order.bid.repair_request.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.bid?.repair_request?.customer?.name && 
           order.bid.repair_request.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.bid?.expert?.full_name && 
           order.bid.expert.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          String(order.service_order_id).includes(searchTerm)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (paymentStatusFilter && paymentStatusFilter !== "all") {
      filtered = filtered.filter((order) => order.payment_status === paymentStatusFilter);
    }

    setFilteredOrders(filtered);
  };

  const fetchServiceOrders = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/admin/service-orders");
      setServiceOrders(response.data.data);
      setFilteredOrders(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch service orders",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewClick = (order) => {
    navigate(`/admin/service-orders/${order.service_order_id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Service Orders</h2>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search..."
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
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="fully_paid">Fully Paid</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchServiceOrders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredOrders} isLoading={isLoading} />
    </div>
  );
}; 