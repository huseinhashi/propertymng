import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

export const ServiceTypesPage = () => {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [filteredServiceTypes, setFilteredServiceTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    commission_percent: "",
  });
  const { toast } = useToast();

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "commission_percent",
      header: "Commission (%)",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const serviceType = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditClick(serviceType)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(serviceType)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  useEffect(() => {
    filterServiceTypes();
  }, [searchTerm, serviceTypes]);

  const filterServiceTypes = () => {
    let filtered = [...serviceTypes];

    if (searchTerm) {
      filtered = filtered.filter((type) =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServiceTypes(filtered);
  };

  const fetchServiceTypes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/admin/service-types");
      setServiceTypes(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "Failed to fetch service types",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      commission_percent: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (serviceType) => {
    setSelectedServiceType(serviceType);
    setFormData({
      name: serviceType.name,
      commission_percent: serviceType.commission_percent,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (serviceType) => {
    setSelectedServiceType(serviceType);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await api.post("/admin/service-types", formData);
      toast({
        variant: response.data.success ? "default" : "destructive",
        title: response.data.success ? "Success" : "Error",
        description: response.data.message,
      });

      if (response.data.success) {
        setIsAddDialogOpen(false);
        setServiceTypes((prev) => [...prev, response.data.data]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "Failed to add service type",
      });
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await api.patch(
        `/admin/service-types/${selectedServiceType.service_type_id}`,
        formData
      );

      toast({
        variant: response.data.success ? "default" : "destructive",
        title: response.data.success ? "Success" : "Error",
        description: response.data.message,
      });

      if (response.data.success) {
        setIsEditDialogOpen(false);
        setServiceTypes((prev) =>
          prev.map((type) =>
            type.service_type_id === selectedServiceType.service_type_id
              ? response.data.data
              : type
          )
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update service type",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(
        `/admin/service-types/${selectedServiceType.service_type_id}`
      );

      toast({
        variant: response.data.success ? "default" : "destructive",
        title: response.data.success ? "Success" : "Error",
        description: response.data.message,
      });

      if (response.data.success) {
        setIsDeleteDialogOpen(false);
        setServiceTypes((prev) =>
          prev.filter(
            (type) => type.service_type_id !== selectedServiceType.service_type_id
          )
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete service type",
      });
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.commission_percent) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name and commission percent are required",
      });
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Service Types</h2>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service Type
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredServiceTypes}
        isLoading={isLoading}
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission_percent">Commission (%)</Label>
              <Input
                id="commission_percent"
                name="commission_percent"
                type="number"
                value={formData.commission_percent}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Service Type</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-commission_percent">Commission (%)</Label>
              <Input
                id="edit-commission_percent"
                name="commission_percent"
                type="number"
                value={formData.commission_percent}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Service Type</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the service type
              {selectedServiceType && ` "${selectedServiceType.name}"`} and all
              associated data. This action cannot be undone.
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