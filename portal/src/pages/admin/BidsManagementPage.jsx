import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Check, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export const BidsManagementPage = () => {
  const { requestId } = useParams();
  const [repairRequest, setRepairRequest] = useState(null);
  const [bids, setBids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBid, setCurrentBid] = useState(null);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [requestId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [requestResponse, bidsResponse] = await Promise.all([
        api.get(`/admin/repair-requests/${requestId}`),
        api.get(`/admin/bids/request/${requestId}`)
      ]);

      setRepairRequest(requestResponse.data.data);
      setBids(bidsResponse.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch data",
      });
      navigate("/admin/repair-requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptBid = (bid) => {
    setCurrentBid(bid);
    setIsAcceptDialogOpen(true);
  };

  const handleRejectBid = (bid) => {
    setCurrentBid(bid);
    setIsRejectDialogOpen(true);
  };

  const confirmAcceptBid = async () => {
    try {
      // Only allow accepting bids for requests in bidding status
      if (repairRequest.status !== "bidding") {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Cannot accept bids for requests not in bidding status",
        });
        setIsAcceptDialogOpen(false);
        return;
      }

      const response = await api.patch(`/admin/bids/${currentBid.bid_id}/accept`);
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Bid accepted successfully",
        });

        // Update local state
        setBids(prev => 
          prev.map(bid => ({
            ...bid,
            is_accepted: bid.bid_id === currentBid.bid_id
          }))
        );

        // Update repair request status to closed
        setRepairRequest(prev => ({
          ...prev,
          status: "closed"
        }));

        fetchData(); // Refresh data
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to accept bid",
      });
    } finally {
      setIsAcceptDialogOpen(false);
    }
  };

  const confirmRejectBid = async () => {
    try {
      // Only allow rejecting bids for requests in bidding status
      if (repairRequest.status !== "bidding") {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Cannot reject bids for requests not in bidding status",
        });
        setIsRejectDialogOpen(false);
        return;
      }

      const response = await api.delete(`/admin/bids/${currentBid.bid_id}`);
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Bid rejected successfully",
        });

        // Update local state
        setBids(prev => 
          prev.filter(bid => bid.bid_id !== currentBid.bid_id)
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to reject bid",
      });
    } finally {
      setIsRejectDialogOpen(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "pending": return "outline";
      case "bidding": return "secondary";
      case "closed": return "default";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  if (!repairRequest) {
    return <div>Repair request not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/repair-requests/${requestId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">Bids for Request #{repairRequest.request_id}</h2>
          <Badge variant={getStatusBadgeVariant(repairRequest.status)}>
            {repairRequest.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Request Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Request Summary</CardTitle>
          <CardDescription>
            Created on {format(new Date(repairRequest.createdAt), "PPP")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
            <p className="mt-1">{repairRequest.customer?.name || "Unknown"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Service Type</h3>
            <p className="mt-1">
              {repairRequest.service_type ? repairRequest.service_type.name : "Not assigned"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
            <p className="mt-1">{repairRequest.location}</p>
          </div>
          <div className="md:col-span-3">
            <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
            <p className="mt-1">{repairRequest.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Bids List */}
      <div>
        <h3 className="text-xl font-bold mb-4">Bids ({bids.length})</h3>
        
        {bids.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {repairRequest.status === "bidding" 
                  ? "No bids have been submitted yet" 
                  : repairRequest.status === "pending"
                    ? "This request is still pending. Move it to bidding to allow experts to bid."
                    : "No bids were submitted for this request"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => (
              <Card key={bid.bid_id} className={`${bid.is_accepted ? 'border-2 border-green-500' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Bid from {bid.expert?.full_name || "Unknown Expert"}
                        {bid.is_accepted && (
                          <Badge variant="success" className="bg-green-500">Accepted</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Submitted on {format(new Date(bid.createdAt), "PPp")}
                      </CardDescription>
                    </div>
                    <div className="text-xl font-bold">${bid.cost}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>{bid.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Estimated completion time: {bid.duration} {bid.duration_unit}
                    </p>
                  </div>
                </CardContent>
                {repairRequest.status === "bidding" && !bid.is_accepted && (
                  <CardFooter className="flex justify-end gap-2 pt-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleRejectBid(bid)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="text-green-500 border-green-200 hover:bg-green-50 hover:text-green-600"
                      onClick={() => handleAcceptBid(bid)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Accept Bid Dialog */}
      <AlertDialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Bid</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to accept this bid? This will close the repair request 
              and reject all other bids. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAcceptBid}>
              Accept Bid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Bid Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Bid</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this bid? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRejectBid}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject Bid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 