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

export const ExpertsPage = () => {
  const [experts, setExperts] = useState([]);
  const [filteredExperts, setFilteredExperts] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    service_type_id: "",
    address: "",
    password: "",
  });
  const { toast } = useToast();

  const columns = [
    {
      accessorKey: "full_name",
      header: "Full Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "address",
      header: "Address",
    },
    {
      accessorKey: "service_type",
      header: "Service Type",
      cell: ({ row }) => row.original.service_type_name || "N/A",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const expert = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditClick(expert)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(expert)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchExperts();
    fetchServiceTypes();
  }, []);

  useEffect(() => {
    filterExperts();
  }, [searchTerm, experts]);

  const filterExperts = () => {
    let filtered = [...experts];

    if (searchTerm) {
      filtered = filtered.filter(
        (expert) =>
          expert.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expert.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expert.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExperts(filtered);
  };

  const fetchExperts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/admin/experts");
      setExperts(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch experts",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServiceTypes = async () => {
    try {
      const response = await api.get("/admin/service-types");
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
    setFormData({
      full_name: "",
      email: "",
      service_type_id: "",
      address: "",
      password: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (expert) => {
    setSelectedExpert(expert);
    setFormData({
      full_name: expert.full_name,
      email: expert.email,
      service_type_id: expert.service_type_id,
      address: expert.address,
      password: "", // Don't populate password in edit mode
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (expert) => {
    setSelectedExpert(expert);
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
    if (!validateForm() || !formData.password) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Password is required for new experts",
      });
      return;
    }

    try {
      const response = await api.post("/admin/experts", formData);
      toast({
        variant: response.data.success ? "default" : "destructive",
        title: response.data.success ? "Success" : "Error",
        description: response.data.message,
      });

      if (response.data.success) {
        setIsAddDialogOpen(false);
        setExperts((prev) => [...prev, response.data.data]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to add expert",
      });
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await api.patch(
        `/admin/experts/${selectedExpert.expert_id}`,
        formData
      );

      toast({
        variant: response.data.success ? "default" : "destructive",
        title: response.data.success ? "Success" : "Error",
        description: response.data.message,
      });

      if (response.data.success) {
        setIsEditDialogOpen(false);
        setExperts((prev) =>
          prev.map((expert) =>
            expert.expert_id === selectedExpert.expert_id
              ? response.data.data
              : expert
          )
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update expert",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(
        `/admin/experts/${selectedExpert.expert_id}`
      );

      toast({
        variant: response.data.success ? "default" : "destructive",
        title: response.data.success ? "Success" : "Error",
        description: response.data.message,
      });

      if (response.data.success) {
        setIsDeleteDialogOpen(false);
        setExperts((prev) =>
          prev.filter((expert) => expert.expert_id !== selectedExpert.expert_id)
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete expert",
      });
    }
  };

  const validateForm = () => {
    if (!formData.full_name || !formData.email || !formData.address || !formData.service_type_id) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "All fields are required",
      });
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Experts</h2>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expert
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredExperts} isLoading={isLoading} />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expert</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_type_id">Service Type</Label>
              <select
                id="service_type_id"
                name="service_type_id"
                value={formData.service_type_id}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2"
              >
                <option value="">Select Service Type</option>
                {serviceTypes.map((type) => (
                  <option key={type.service_type_id} value={type.service_type_id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
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
              <Button type="submit">Add Expert</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expert</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-full_name">Full Name</Label>
              <Input
                id="edit-full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-service_type_id">Service Type</Label>
              <select
                id="edit-service_type_id"
                name="service_type_id"
                value={formData.service_type_id}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2"
              >
                <option value="">Select Service Type</option>
                {serviceTypes.map((type) => (
                  <option key={type.service_type_id} value={type.service_type_id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">
                Password (leave blank to keep unchanged)
              </Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                value={formData.password}
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
              <Button type="submit">Update Expert</Button>
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
              This will permanently delete the expert
              {selectedExpert && ` "${selectedExpert.full_name}"`} and all associated
              data. This action cannot be undone.
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