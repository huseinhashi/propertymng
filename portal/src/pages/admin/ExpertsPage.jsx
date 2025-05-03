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
import { Checkbox } from "@/components/ui/checkbox";

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
  const [showAllServices, setShowAllServices] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    service_type_ids: [],
    address: "",
    password: "",
  });
  const { toast } = useToast();
  const [errors, setErrors] = useState({});

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
      accessorKey: "service_types",
      header: "Service Types",
      cell: ({ row }) => {
        const expert = row.original;
        return expert.service_types && expert.service_types.length > 0
          ? expert.service_types.map(st => st.name).join(", ")
          : "N/A";
      },
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
      phone: "",
      service_type_ids: [],
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
      phone: expert.phone,
      service_type_ids: expert.service_types ? expert.service_types.map(st => st.service_type_id) : [],
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

  const handleServiceTypeChange = (serviceTypeId) => {
    setFormData((prev) => {
      const currentServiceTypeIds = [...prev.service_type_ids];
      const index = currentServiceTypeIds.indexOf(serviceTypeId);
      
      if (index === -1) {
        // Add service type if not present
        currentServiceTypeIds.push(serviceTypeId);
      } else {
        // Remove service type if already present
        currentServiceTypeIds.splice(index, 1);
      }
      
      return {
        ...prev,
        service_type_ids: currentServiceTypeIds,
      };
    });
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

    if (!formData.full_name) {
      newErrors.full_name = "Name is required";
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(formData.full_name)) {
      newErrors.full_name = "Name can only contain letters and spaces";
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
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

    if (!selectedExpert) {
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

    if (formData.service_type_ids.length === 0) {
      newErrors.service_type_ids = "At least one service type must be selected";
      isValid = false;
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
      const response = await api.post("/admin/experts", formData);
      toast({
        variant: response.data.success ? "default" : "destructive",
        title: response.data.success ? "Success" : "Error",
        description: response.data.message,
      });

      if (response.data.success) {
        setIsAddDialogOpen(false);
        fetchExperts(); // Refresh the expert list
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
        fetchExperts(); // Refresh the expert list
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
              <Label className={cn(errors.service_type_ids && "text-destructive")}>
                Service Types *
              </Label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                {(showAllServices ? serviceTypes : serviceTypes.slice(0, 4)).map((type) => (
                  <div key={type.service_type_id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`service-type-${type.service_type_id}`}
                      checked={formData.service_type_ids.includes(type.service_type_id)}
                      onChange={() => handleServiceTypeChange(type.service_type_id)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`service-type-${type.service_type_id}`} className="cursor-pointer">
                      {type.name}
                    </Label>
                  </div>
                ))}
                {serviceTypes.length > 4 && (
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowAllServices(!showAllServices)}
                    className="w-full mt-2"
                  >
                    {showAllServices ? "Show Less" : "Show More"}
                  </Button>
                )}
              </div>
              {errors.service_type_ids && (
                <p className="text-sm text-destructive">{errors.service_type_ids}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name" className={cn(errors.full_name && "text-destructive")}>
                Full Name *
              </Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter expert name"
                className={cn(errors.full_name && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className={cn(errors.email && "text-destructive")}>
                Email *
              </Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@email.com"
                type="email"
                className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
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
                placeholder="Enter expert address"
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
              <Label htmlFor="edit-full_name" className={cn(errors.full_name && "text-destructive")}>
                Full Name *
              </Label>
              <Input
                id="edit-full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter expert name"
                className={cn(errors.full_name && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className={cn(errors.email && "text-destructive")}>
                Email *
              </Label>
              <Input
                id="edit-email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@email.com"
                type="email"
                className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
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
                placeholder="Enter expert address"
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
            <div className="space-y-2">
              <Label className={cn(errors.service_type_ids && "text-destructive")}>
                Service Types *
              </Label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                {(showAllServices ? serviceTypes : serviceTypes.slice(0, 4)).map((type) => (
                  <div key={type.service_type_id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`edit-service-type-${type.service_type_id}`}
                      checked={formData.service_type_ids.includes(type.service_type_id)}
                      onChange={() => handleServiceTypeChange(type.service_type_id)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`edit-service-type-${type.service_type_id}`} className="cursor-pointer">
                      {type.name}
                    </Label>
                  </div>
                ))}
                {serviceTypes.length > 4 && (
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowAllServices(!showAllServices)}
                    className="w-full mt-2"
                  >
                    {showAllServices ? "Show Less" : "Show More"}
                  </Button>
                )}
              </div>
              {errors.service_type_ids && (
                <p className="text-sm text-destructive">{errors.service_type_ids}</p>
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