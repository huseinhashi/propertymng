import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Eye, RefreshCw, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const RefundsPage = () => {
  const [refunds, setRefunds] = useState([]);
  const [filteredRefunds, setFilteredRefunds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [decisionDialog, setDecisionDialog] = useState({ open: false, refund: null, action: null });
  const [decisionNote, setDecisionNote] = useState("");

  const columns = [
    {
      accessorKey: "refund_id",
      header: "ID",
      cell: ({ row }) => <span>#{row.original.refund_id}</span>,
    },
    {
      accessorKey: "service_order_id",
      header: "Order ID",
      cell: ({ row }) => <span>#{row.original.service_order_id}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `$${parseFloat(row.original.amount).toFixed(2)}`,
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
          case "approved":
            variant = "success";
            break;
          case "requested":
            variant = "warning";
            break;
          case "rejected":
            variant = "destructive";
            break;
          default:
            variant = "outline";
        }
        return <Badge variant={variant}>{status.toUpperCase()}</Badge>;
      },
    },
    {
      accessorKey: "decision_notes",
      header: "Admin Notes",
      cell: ({ row }) => row.original.decision_notes || "-",
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => format(new Date(row.original.createdAt), "PPP"),
    },
    {
      accessorKey: "decided_at",
      header: "Decided At",
      cell: ({ row }) => row.original.decided_at ? format(new Date(row.original.decided_at), "PPP") : "-",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const refund = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewServiceOrder(refund.service_order_id)}
              title="View Service Order"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditRefund(refund)}
              title="Edit Refund"
              disabled={refund.status !== "requested"}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteRefund(refund.refund_id)}
              title="Delete Refund"
              disabled={refund.status !== "requested"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditDecisionNote(refund)}
              title="Edit Decision Note"
              disabled={!refund.decision_notes}
            >
              <Edit className="h-4 w-4 text-purple-600" />
            </Button>
            {refund.status === "requested" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApproveRefund(refund.refund_id)}
                  className="text-green-600 border-green-600"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRejectRefund(refund.refund_id)}
                  className="text-red-600 border-red-600"
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchRefunds();
  }, []);

  useEffect(() => {
    filterRefunds();
  }, [searchTerm, statusFilter, refunds]);

  const filterRefunds = () => {
    let filtered = [...refunds];
    if (searchTerm) {
      filtered = filtered.filter(
        (refund) =>
          refund.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(refund.refund_id).includes(searchTerm) ||
          String(refund.service_order_id).includes(searchTerm)
      );
    }
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((refund) => refund.status === statusFilter);
    }
    setFilteredRefunds(filtered);
  };

  const fetchRefunds = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/admin/refunds");
      setRefunds(response.data.data);
      setFilteredRefunds(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch refunds",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewServiceOrder = (serviceOrderId) => {
    navigate(`/admin/service-orders/${serviceOrderId}`);
  };

  const handleEditRefund = (refund) => {
    // TODO: Show dialog to edit refund reason/notes
    toast({ title: "Edit Refund", description: "Edit dialog coming soon." });
  };

  const handleDeleteRefund = async (refundId) => {
    if (!window.confirm("Are you sure you want to delete this refund request?")) return;
    try {
      await api.delete(`/customer/refunds/${refundId}`);
      toast({ title: "Deleted", description: "Refund request deleted." });
      fetchRefunds();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete refund",
      });
    }
  };

  const handleEditDecisionNote = (refund) => {
    setDecisionNote(refund.decision_notes || "");
    setDecisionDialog({ open: true, refund, action: "edit_note" });
  };

  const handleApproveRefund = (refundId) => {
    setDecisionNote("");
    setDecisionDialog({ open: true, refund: { refund_id: refundId }, action: "approve" });
  };

  const handleRejectRefund = (refundId) => {
    setDecisionNote("");
    setDecisionDialog({ open: true, refund: { refund_id: refundId }, action: "reject" });
  };

  const submitDecision = async () => {
    const { refund, action } = decisionDialog;
    try {
      if (action === "approve" || action === "reject") {
        await api.patch(`/admin/refunds/${refund.refund_id}/status`, { status: action === "approve" ? "approved" : "rejected", decision_notes: decisionNote });
        toast({ title: action === "approve" ? "Approved" : "Rejected", description: `Refund ${action === "approve" ? "approved" : "rejected"}.` });
      } else if (action === "edit_note") {
        await api.patch(`/customer/refunds/${refund.refund_id}`, { decision_notes: decisionNote });
        toast({ title: "Updated", description: "Decision note updated." });
      }
      setDecisionDialog({ open: false, refund: null, action: null });
      fetchRefunds();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update refund",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Refund Requests</h2>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by ID, order, or reason..."
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
              <SelectItem value="requested">Requested</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchRefunds}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={filteredRefunds} isLoading={isLoading} />
      <Dialog open={decisionDialog.open} onOpenChange={open => setDecisionDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionDialog.action === "approve"
                ? "Approve Refund"
                : decisionDialog.action === "reject"
                ? "Reject Refund"
                : "Edit Decision Note"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={decisionNote}
            onChange={e => setDecisionNote(e.target.value)}
            placeholder="Enter decision note (optional)"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionDialog({ open: false, refund: null, action: null })}>Cancel</Button>
            <Button onClick={submitDecision}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 