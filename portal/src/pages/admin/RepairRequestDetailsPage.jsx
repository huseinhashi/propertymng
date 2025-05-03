import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ArrowLeft, Pencil, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

export const RepairRequestDetailsPage = () => {
  const { id } = useParams();
  const [repairRequest, setRepairRequest] = useState(null);
  const [bids, setBids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRepairRequest();
    fetchBids();
  }, [id]);

  const fetchRepairRequest = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/admin/repair-requests/${id}`);
      setRepairRequest(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch repair request details",
      });
      navigate("/admin/repair-requests");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const response = await api.get(`/admin/bids/request/${id}`);
      setBids(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch bids for this request",
      });
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await api.patch(`/admin/repair-requests/${id}`, {
        status: newStatus
      });

      if (response.data.success) {
        toast({
          title: "Status Updated",
          description: `Request status changed to ${newStatus}`,
        });
        fetchRepairRequest();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
      });
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/repair-requests")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">Repair Request #{repairRequest.request_id}</h2>
          <Badge variant={getStatusBadgeVariant(repairRequest.status)}>
            {repairRequest.status.toUpperCase()}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate(`/admin/repair-requests/${id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
            Edit Request
          </Button>
          {repairRequest.status === "pending" && (
            <>
              <Button 
                variant="default"
                onClick={() => handleStatusChange("bidding")}
              >
                Accept Request
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleStatusChange("rejected")}
              >
                Reject Request
              </Button>
            </>
          )}
          {repairRequest.status === "bidding" && (
            <Button variant="destructive" onClick={() => handleStatusChange("rejected")}>
              Reject Request
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              Created on {format(new Date(repairRequest.createdAt), "PPpp")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <p className="mt-1">{repairRequest.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
              <p className="mt-1">{repairRequest.location}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Service Type</h3>
              <p className="mt-1">
                {repairRequest.service_type ? repairRequest.service_type.name : "Not assigned"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {repairRequest.customer && (
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border">
                  <div className="flex h-full w-full items-center justify-center bg-muted text-xl uppercase">
                    {repairRequest.customer.name.charAt(0)}
                  </div>
                </Avatar>
                <div>
                  <p className="font-medium">{repairRequest.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{repairRequest.customer.phone}</p>
                  {repairRequest.customer.address && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {repairRequest.customer.address}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="images" className="w-full">
        <TabsList>
          <TabsTrigger value="images">Images ({repairRequest.service_images ? repairRequest.service_images.length : 0})</TabsTrigger>
          <TabsTrigger value="bids">Bids ({bids.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="images" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {repairRequest.service_images && repairRequest.service_images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {repairRequest.service_images.map((image) => (
                    <div key={image.id} className="relative aspect-square rounded-md overflow-hidden border bg-muted">
                      <img
                        src={`${api.defaults.serverURL}/uploads/${image.url}`}
                        alt="Repair request"
                        className="object-cover w-full h-full transition-all hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No images attached to this request</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bids" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {bids.length > 0 ? (
                <div className="space-y-4">
                  {bids.map((bid) => (
                    <Card key={bid.bid_id} className={`${bid.is_accepted ? 'border-2 border-green-500' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              Bid from {bid.expert.full_name}
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
                            Estimated completion by: {format(new Date(bid.deadline), "PPP")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-muted-foreground">
                    {repairRequest.status === "bidding" 
                      ? "No bids have been submitted yet" 
                      : repairRequest.status === "pending"
                        ? "This request is still pending. Move it to bidding to allow experts to bid."
                        : "No bids were submitted for this request"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 