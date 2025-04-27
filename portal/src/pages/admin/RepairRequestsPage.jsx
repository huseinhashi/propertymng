import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { format } from "date-fns";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export const RepairRequestsPage = () => {
  const [repairRequests, setRepairRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [serviceTypes, setServiceTypes] = useState([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const columns = [
    {
      accessorKey: "request_id",
      header: "ID",
      cell: ({ row }) => <span>#{row.original.request_id}</span>,
    },
    {
      accessorKey: "customer.name",
      header: "Customer",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.original.description;
        return description.length > 50 ? `${description.substring(0, 50)}...` : description;
      },
    },
    {
      accessorKey: "location",
      header: "Location",
    },
    {
      accessorKey: "service_type.name",
      header: "Service Type",
      cell: ({ row }) => {
        return row.original.service_type ? row.original.service_type.name : "Not assigned";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let variant;
        
        switch (status) {
          case "pending":
            variant = "outline";
            break;
          case "bidding":
            variant = "secondary";
            break;
          case "closed":
            variant = "default";
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
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => format(new Date(row.original.createdAt), "PPP"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const request = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewClick(request)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditClick(request)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(request)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchRepairRequests();
    fetchServiceTypes();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, statusFilter, serviceTypeFilter, repairRequests]);

  const filterRequests = () => {
    let filtered = [...repairRequests];

    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          (request.description && request.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (request.location && request.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (request.customer && request.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    if (serviceTypeFilter && serviceTypeFilter !== "all") {
      filtered = filtered.filter(
        (request) => request.service_type && request.service_type.service_type_id.toString() === serviceTypeFilter
      );
    }

    setFilteredRequests(filtered);
  };

  const fetchRepairRequests = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/admin/repair-requests");
      setRepairRequests(response.data.data);
      setFilteredRequests(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch repair requests",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServiceTypes = async () => {
    try {
      const response = await api.get("/admin/service-types-list");
      setServiceTypes(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch service types",
      });
    }
  };

  const handleAddClick = () => {
    navigate("/admin/repair-requests/new");
  };

  const handleViewClick = (request) => {
    navigate(`/admin/repair-requests/${request.request_id}`);
  };

  const handleEditClick = (request) => {
    navigate(`/admin/repair-requests/${request.request_id}/edit`);
  };

  const handleDeleteClick = (request) => {
    setSelectedRequest(request);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/admin/repair-requests/${selectedRequest.request_id}`);

      toast({
        variant: response.data.success ? "default" : "destructive",
        title: response.data.success ? "Success" : "Error",
        description: response.data.message,
      });

      if (response.data.success) {
        setIsDeleteDialogOpen(false);
        setRepairRequests((prev) =>
          prev.filter((request) => request.request_id !== selectedRequest.request_id)
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete repair request",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Repair Requests</h2>
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="bidding">Bidding</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Service Types</SelectItem>
              {serviceTypes.map((type) => (
                <SelectItem key={type.service_type_id} value={type.service_type_id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredRequests} isLoading={isLoading} />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the repair request
              {selectedRequest && ` #${selectedRequest.request_id}`} and all associated
              data including images and bids. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 