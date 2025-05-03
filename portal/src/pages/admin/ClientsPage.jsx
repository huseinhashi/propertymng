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
import { cn } from "@/lib/utils";

export const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    password: "",
  });
  const { toast } = useToast();
  const [errors, setErrors] = useState({});

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "address",
      header: "Address",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditClick(client)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(client)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  const filterClients = () => {
    let filtered = [...clients];

    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone.includes(searchTerm) ||
          client.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  };

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/admin/customers");
      setClients(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch customers",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      phone: "",
      address: "",
      password: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      address: client.address,
      password: "", // Don't populate password in edit mode
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    // If value starts with 252, don't allow removing it
    if (value.startsWith('252') && value.length < 3) return;
    
    // If value doesn't start with 252, add it
    if (!value.startsWith('252')) {
      setFormData(prev => ({ ...prev, phone: '252' + value }));
      return;
    }
    
    // Limit to 12 characters (252 + 9 digits)
    if (value.length > 12) return;
    
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.name) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      newErrors.name = "Name can only contain letters and spaces";
      isValid = false;
    }

    if (!formData.phone) {
      newErrors.phone = "Phone is required";
      isValid = false;
    } else if (!/^252[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must start with 252 followed by 9 digits";
      isValid = false;
    }

    if (!formData.address) {
      newErrors.address = "Address is required";
      isValid = false;
    }

    if (!selectedClient) {
      if (!formData.password) {
        newErrors.password = "Password is required";
        isValid = false;
      } else {
        if (formData.password.length < 8) {
          newErrors.password = "Password must be at least 8 characters";
          isValid = false;
        }
        if (!/[A-Z]/.test(formData.password)) {
          newErrors.password = "Password must contain at least one uppercase letter";
          isValid = false;
        }
        if (!/[a-z]/.test(formData.password)) {
          newErrors.password = "Password must contain at least one lowercase letter";
          isValid = false;
        }
        if (!/[0-9]/.test(formData.password)) {
          newErrors.password = "Password must contain at least one number";
          isValid = false;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
          newErrors.password = "Password must contain at least one special character";
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors in the form",
      });
      return;
    }

    try {
      const response = await api.post("/admin/customers", formData);
      toast({
        variant: response.data.success ? "default" : "destructive",
        title: response.data.success ? "Success" : "Error",
        description: response.data.message,
      });

      if (response.data.success) {
        setIsAddDialogOpen(false);
        setClients((prev) => [...prev, response.data.data]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to add customer",
      });
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors in the form",
      });
      return;
    }

    try {
      const response = await api.patch(
        `/admin/customers/${selectedClient.customer_id}`,
        formData
      );

      toast({
        variant: response.data.success ? "default" : "destructive",
        title: response.data.success ? "Success" : "Error",
        description: response.data.message,
      });

      if (response.data.success) {
        setIsEditDialogOpen(false);
        setClients((prev) =>
          prev.map((client) =>
            client.customer_id === selectedClient.customer_id
              ? response.data.data
              : client
          )
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update customer",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(
        `/admin/customers/${selectedClient.customer_id}`
      );

      toast({
        variant: response.data.success ? "default" : "destructive",
        title: response.data.success ? "Success" : "Error",
        description: response.data.message,
      });

      if (response.data.success) {
        setIsDeleteDialogOpen(false);
        setClients((prev) =>
          prev.filter((client) => client.customer_id !== selectedClient.customer_id)
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete customer",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customers</h2>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredClients} isLoading={isLoading} />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={cn(errors.name && "text-destructive")}>
                Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter client name"
                className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className={cn(errors.phone && "text-destructive")}>
                Phone *
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="252xxxxxxxxx"
                maxLength={12}
                className={cn(errors.phone && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className={cn(errors.address && "text-destructive")}>
                Address *
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter client address"
                className={cn(errors.address && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className={cn(errors.password && "text-destructive")}>
                Password *
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                className={cn(errors.password && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Client</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className={cn(errors.name && "text-destructive")}>
                Name *
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter client name"
                className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className={cn(errors.phone && "text-destructive")}>
                Phone *
              </Label>
              <Input
                id="edit-phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="252xxxxxxxxx"
                maxLength={12}
                className={cn(errors.phone && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address" className={cn(errors.address && "text-destructive")}>
                Address *
              </Label>
              <Input
                id="edit-address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter client address"
                className={cn(errors.address && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password" className={cn(errors.password && "text-destructive")}>
                Password (leave blank to keep unchanged)
              </Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter new password"
                className={cn(errors.password && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Update Client</Button>
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
              This will permanently delete the customer
              {selectedClient && ` "${selectedClient.name}"`} and all associated
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