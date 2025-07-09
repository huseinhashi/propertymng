import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Banknote, Clock, CheckCircle2, ReceiptText, RefreshCw, XCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const ServiceOrderDetailsPage = () => {
  const { id } = useParams();
  const [serviceOrder, setServiceOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [refunds, setRefunds] = useState([]);
  const [isLoadingRefunds, setIsLoadingRefunds] = useState(true);
  const [decisionDialog, setDecisionDialog] = useState({ open: false, refund: null, action: null });
  const [decisionNote, setDecisionNote] = useState("");

  useEffect(() => {
    fetchServiceOrderDetails();
    fetchRefunds();
  }, [id]);

  const fetchServiceOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/admin/service-orders/${id}`);
      setServiceOrder(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch service order details",
      });
      navigate("/admin/service-orders");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRefunds = async () => {
    try {
      setIsLoadingRefunds(true);
      const response = await api.get(`/admin/service-orders/${id}/refunds`);
      setRefunds(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch refunds",
      });
    } finally {
      setIsLoadingRefunds(false);
    }
  };

  const handleMarkAsPaid = async (paymentId) => {
    try {
      setIsProcessing(true);
      await api.patch(`/admin/payments/${paymentId}/status`, {
        status: "paid"
      });
      
      toast({
        title: "Success",
        description: "Payment marked as paid successfully",
      });
      
      // Refresh service order details
      fetchServiceOrderDetails();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update payment status",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "in_progress": return "warning";
      case "completed": return "success";
      case "delivered": return "default";
      case "refunded": return "destructive";
      default: return "outline";
    }
  };

  const getPaymentStatusBadgeVariant = (status) => {
    switch (status) {
      case "fully_paid": return "success";
      case "partially_paid": return "warning";
      case "unpaid": return "destructive";
      case "refunded": return "secondary";
      default: return "outline";
    }
  };

  const getPaymentBadgeVariant = (status) => {
    switch (status) {
      case "paid": return "success";
      case "pending": return "warning";
      case "refunded": return "destructive";
      case "cancelled": return "outline";
      default: return "outline";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "PPP");
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const handleViewRepairRequest = () => {
    if (serviceOrder?.bid?.repair_request?.request_id) {
      navigate(`/admin/repair-requests/${serviceOrder.bid.repair_request.request_id}`);
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  if (!serviceOrder) {
    return <div>Service order not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/service-orders")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">Service Order #{serviceOrder.service_order_id}</h2>
          <Badge variant={getStatusBadgeVariant(serviceOrder.status)}>
            {serviceOrder.status?.toUpperCase().replace("_", " ")}
          </Badge>
          <Badge variant={getPaymentStatusBadgeVariant(serviceOrder.payment_status)}>
            {serviceOrder.payment_status?.toUpperCase().replace("_", " ")}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={fetchServiceOrderDetails}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleViewRepairRequest}
          >
            <ReceiptText className="h-4 w-4" />
            View Original Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Service Order Details */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>
              Created on {formatDate(serviceOrder.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviceOrder.bid?.repair_request && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Service Description</h3>
                <p className="mt-1">{serviceOrder.bid.repair_request.description}</p>
              </div>
            )}
            {serviceOrder.bid?.repair_request?.location && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Service Location</h3>
                <p className="mt-1">{serviceOrder.bid.repair_request.location}</p>
              </div>
            )}
            {serviceOrder.completion_notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Completion Notes</h3>
                <p className="mt-1">{serviceOrder.completion_notes}</p>
              </div>
            )}
            
            <div className="flex flex-col gap-4 pt-4">
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Deadline</p>
                    <p className="font-medium">{formatDate(serviceOrder.deadline)}</p>
                  </div>
                </div>
                
                {serviceOrder.completed_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Completed On</p>
                      <p className="font-medium">{formatDate(serviceOrder.completed_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="text-muted-foreground">Base Price</div>
              <div className="font-semibold">{formatCurrency(serviceOrder.base_price)}</div>
            </div>
            
            {parseFloat(serviceOrder.extra_price) > 0 && (
              <div className="flex justify-between items-center">
                <div className="text-muted-foreground">Extra Charges</div>
                <div className="font-semibold text-amber-600">{formatCurrency(serviceOrder.extra_price)}</div>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div className="font-medium">Total Price</div>
              <div className="text-xl font-bold">{formatCurrency(serviceOrder.total_price)}</div>
            </div>

            <div className="bg-muted p-4 rounded-md mt-4">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Payment Status:</span>
                <Badge variant={getPaymentStatusBadgeVariant(serviceOrder.payment_status)}>
                  {serviceOrder.payment_status?.toUpperCase().replace("_", " ")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceOrder.bid?.repair_request?.customer && (
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border">
                  <div className="flex h-full w-full items-center justify-center bg-muted text-xl uppercase">
                    {serviceOrder.bid.repair_request.customer.name.charAt(0)}
                  </div>
                </Avatar>
                <div>
                  <p className="font-medium">{serviceOrder.bid.repair_request.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{serviceOrder.bid.repair_request.customer.phone}</p>
                  {serviceOrder.bid.repair_request.customer.address && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {serviceOrder.bid.repair_request.customer.address}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expert Information */}
        <Card>
          <CardHeader>
            <CardTitle>Expert Information</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceOrder.bid?.expert && (
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border">
                  <div className="flex h-full w-full items-center justify-center bg-muted text-xl uppercase">
                    {serviceOrder.bid.expert.full_name.charAt(0)}
                  </div>
                </Avatar>
                <div>
                  <p className="font-medium">{serviceOrder.bid.expert.full_name}</p>
                  <p className="text-sm text-muted-foreground">{serviceOrder.bid.expert.email}</p>
                  {serviceOrder.bid.expert.address && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {serviceOrder.bid.expert.address}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Record of all payments related to this service order</CardDescription>
        </CardHeader>
        <CardContent>
          {serviceOrder.payments && serviceOrder.payments.length > 0 ? (
            <div className="space-y-4">
              {serviceOrder.payments.map((payment) => (
                <div key={payment.payment_id} className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPaymentBadgeVariant(payment.status)}>
                        {payment.status.toUpperCase()}
                      </Badge>
                      <span className="font-medium capitalize">{payment.type} Payment</span>
                      <span className="text-sm text-muted-foreground">#{payment.payment_id}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{payment.reason}</p>
                    {payment.paid_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Paid on {format(new Date(payment.paid_at), "PPp")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                      {payment.transaction_ref && (
                        <p className="text-xs text-muted-foreground">
                          Ref: {payment.transaction_ref}
                        </p>
                      )}
                    </div>
                    {payment.status === "pending" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleMarkAsPaid(payment.payment_id)}
                      >
                        {isProcessing ? "Processing..." : "Mark as Paid"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No payment records found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refunds Section (moved after payments) */}
      <Card>
        <CardHeader>
          <CardTitle>Refunds</CardTitle>
          <CardDescription>All refund requests for this service order</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRefunds ? (
            <div className="text-center py-4">Loading refunds...</div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No refund requests found</div>
          ) : (
            <div className="space-y-4">
              {refunds.map((refund) => {
                let statusVariant;
                switch (refund.status) {
                  case "approved": statusVariant = "success"; break;
                  case "requested": statusVariant = "warning"; break;
                  case "rejected": statusVariant = "destructive"; break;
                  default: statusVariant = "outline";
                }
                return (
                  <div key={refund.refund_id} className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant}>{refund.status.toUpperCase()}</Badge>
                        <span className="font-medium">Refund #{refund.refund_id}</span>
                        <span className="text-sm text-muted-foreground">Order #{refund.service_order_id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Amount: ${parseFloat(refund.amount).toFixed(2)}</p>
                      {refund.reason && <p className="text-sm text-muted-foreground mt-1">Reason: {refund.reason}</p>}
                      {refund.decision_notes && <p className="text-sm text-muted-foreground mt-1">Admin Notes: {refund.decision_notes}</p>}
                      {refund.decided_at && <p className="text-xs text-muted-foreground mt-1">Decided at: {formatDate(refund.decided_at)}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditDecisionNote(refund)} title="Edit Decision Note" disabled={!refund.decision_notes}>
                        <Edit className="h-4 w-4 text-purple-600" />
                      </Button>
                      {refund.status === "requested" && (
                        <>
                          <Button variant="outline" size="sm" className="text-green-600 border-green-600" onClick={() => handleApproveRefund(refund.refund_id)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 border-red-600" onClick={() => handleRejectRefund(refund.refund_id)}>
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteRefund(refund.refund_id)} title="Delete Refund">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
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