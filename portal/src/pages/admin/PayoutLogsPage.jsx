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

export const PayoutLogsPage = () => {
  const [payouts, setPayouts] = useState([]);
  const [filteredPayouts, setFilteredPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  const columns = [
    {
      accessorKey: "payout_id",
      header: "ID",
      cell: ({ row }) => <span>#{row.original.payout_id}</span>,
    },
    {
      accessorKey: "service_order_id",
      header: "Order ID",
      cell: ({ row }) => <span>#{row.original.service_order_id}</span>,
    },
    {
      accessorKey: "expert",
      header: "Expert",
      cell: ({ row }) => row.original.expert?.full_name || "-",
    },
    {
      accessorKey: "total_payment",
      header: "Total Payment",
      cell: ({ row }) => `$${parseFloat(row.original.total_payment).toFixed(2)}`,
    },
    {
      accessorKey: "commission",
      header: "Commission",
      cell: ({ row }) => `$${parseFloat(row.original.commission).toFixed(2)} (${parseFloat(row.original.commission_percent).toFixed(2)}%)`,
    },
    {
      accessorKey: "net_payout",
      header: "Net Payout",
      cell: ({ row }) => `$${parseFloat(row.original.net_payout).toFixed(2)}`,
    },
    {
      accessorKey: "payout_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.payout_status;
        let variant;
        switch (status) {
          case "released":
            variant = "success";
            break;
          case "pending":
            variant = "warning";
            break;
          default:
            variant = "outline";
        }
        return <Badge variant={variant}>{status.toUpperCase()}</Badge>;
      },
    },
    {
      accessorKey: "released_at",
      header: "Released At",
      cell: ({ row }) => row.original.released_at ? format(new Date(row.original.released_at), "PPP") : "-",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const payout = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewServiceOrder(payout.service_order_id)}
              title="View Service Order"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {payout.payout_status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAsReleased(payout.payout_id)}
              >
                Mark as Released
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchPayouts();
  }, []);

  useEffect(() => {
    filterPayouts();
  }, [searchTerm, statusFilter, payouts]);

  const filterPayouts = () => {
    let filtered = [...payouts];
    if (searchTerm) {
      filtered = filtered.filter(
        (payout) =>
          String(payout.payout_id).includes(searchTerm) ||
          String(payout.service_order_id).includes(searchTerm) ||
          payout.expert?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((payout) => payout.payout_status === statusFilter);
    }
    setFilteredPayouts(filtered);
  };

  const fetchPayouts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/admin/payouts");
      setPayouts(response.data.data);
      setFilteredPayouts(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch payouts",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewServiceOrder = (serviceOrderId) => {
    navigate(`/admin/service-orders/${serviceOrderId}`);
  };

  const handleMarkAsReleased = async (payoutId) => {
    try {
      await api.patch(`/admin/payouts/${payoutId}/status`, {
        payout_status: "released"
      });
      toast({
        title: "Success",
        description: "Payout marked as released successfully",
      });
      fetchPayouts();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update payout status",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payout Logs</h2>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by ID, order, or expert..."
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
              <SelectItem value="released">Released</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchPayouts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={filteredPayouts} isLoading={isLoading} />
    </div>
  );
}; 