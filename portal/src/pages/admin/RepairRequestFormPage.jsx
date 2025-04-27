import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, ImageIcon, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

export const RepairRequestFormPage = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: "",
    description: "",
    location: "",
    service_type_id: "none",
    status: "pending",
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
    fetchServiceTypes();
    if (isEditMode) {
      fetchRepairRequest();
    }
  }, [id]);

  const fetchCustomers = async () => {
    try {
      const response = await api.get("/admin/customers-list");
      setCustomers(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch customers",
      });
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

  const fetchRepairRequest = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/admin/repair-requests/${id}`);
      const request = response.data.data;
      
      setFormData({
        customer_id: request.customer_id.toString(),
        description: request.description,
        location: request.location,
        service_type_id: request.service_type_id ? request.service_type_id.toString() : "none",
        status: request.status,
      });
      
      if (request.service_images && request.service_images.length > 0) {
        setExistingImages(request.service_images);
      }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 5 images total (existing + new)
    const totalImages = existingImages.length + images.length + files.length;
    if (totalImages > 5) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You can only upload a maximum of 5 images",
      });
      return;
    }
    
    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Update state
    setImages((prev) => [...prev, ...imageFiles]);
    
    // Create preview URLs
    const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };
  
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    
    // Revoke the URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingImage = (imageId) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const validateForm = () => {
    if (!formData.customer_id) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a customer",
      });
      return false;
    }
    
    if (!formData.description) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a description",
      });
      return false;
    }
    
    if (!formData.location) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a location",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Create FormData object for file upload
      const formDataObj = new FormData();
      formDataObj.append("customer_id", formData.customer_id);
      formDataObj.append("description", formData.description);
      formDataObj.append("location", formData.location);
      
      if (formData.service_type_id && formData.service_type_id !== "none") {
        formDataObj.append("service_type_id", formData.service_type_id);
      }
      
      formDataObj.append("status", formData.status);
      
      // Add images
      images.forEach((image) => {
        formDataObj.append("images", image);
      });
      
      // For edit mode, include existing images to keep
      if (isEditMode) {
        formDataObj.append("keep_images", JSON.stringify(existingImages.map(img => img.id)));
      }
      
      let response;
      if (isEditMode) {
        response = await api.patch(`/admin/repair-requests/${id}`, formDataObj, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        response = await api.post("/admin/repair-requests", formDataObj, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }
      
      toast({
        title: "Success",
        description: isEditMode ? "Repair request updated successfully" : "Repair request created successfully",
      });
      
      // Navigate to the detail page
      if (isEditMode) {
        navigate(`/admin/repair-requests/${id}`);
      } else if (response.data.data && response.data.data.request_id) {
        navigate(`/admin/repair-requests/${response.data.data.request_id}`);
      } else {
        navigate("/admin/repair-requests");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} repair request`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/repair-requests")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">{isEditMode ? "Edit Repair Request" : "Create New Repair Request"}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer & Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => handleSelectChange("customer_id", value)}
                  disabled={isEditMode} // Can't change customer in edit mode
                >
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.customer_id} value={customer.customer_id.toString()}>
                        {customer.name} ({customer.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type</Label>
                <Select
                  value={formData.service_type_id}
                  onValueChange={(value) => handleSelectChange("service_type_id", value)}
                >
                  <SelectTrigger id="service_type">
                    <SelectValue placeholder="Select a service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not assigned</SelectItem>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.service_type_id} value={type.service_type_id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="bidding">Bidding</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter the repair location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the repair issue"
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div>
                    <Label>Current Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {existingImages.map((image) => (
                        <div key={image.id} className="relative">
                          <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                            <img
                              src={`${api.defaults.serverURL}/uploads/${image.url}`}
                              alt="Repair request"
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 rounded-full"
                            onClick={() => removeExistingImage(image.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Image Previews */}
                {imagePreviewUrls.length > 0 && (
                  <div>
                    <Label>New Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 rounded-full"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <div className="mt-4">
                  <Label htmlFor="imageUpload" className="mb-2 block">
                    Upload Images (Max 5)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="imageUpload"
                      className="flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input bg-background px-4 py-3 text-center text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <Upload className="h-4 w-4 mb-1" />
                      <span>Drop images or click to upload</span>
                      <span className="text-xs text-muted-foreground">
                        {5 - (existingImages.length + images.length)} remaining
                      </span>
                      <Input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                        disabled={existingImages.length + images.length >= 5}
                      />
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/repair-requests")}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : isEditMode ? "Update Request" : "Create Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}; 