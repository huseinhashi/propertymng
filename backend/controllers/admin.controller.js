// import User from "../models/user.model.js";
// import Client from "../models/client.model.js";
// import ServiceRequest from "../models/service-request.model.js";
// import Payment from "../models/payment.model.js";

// // Client Management
// export const getAllClients = async (req, res) => {
//   try {
//     const clients = await Client.find().select("-password");
//     res.status(200).json({
//       success: true,
//       data: clients,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const createClient = async (req, res) => {
//   try {
//     const { name, email, phone, address, password } = req.body;

//     // Check for duplicate email
//     const emailExists = await Client.findOne({ email });
//     if (emailExists) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is already registered",
//       });
//     }

//     // Check for duplicate phone
//     const phoneExists = await Client.findOne({ phone });
//     if (phoneExists) {
//       return res.status(400).json({
//         success: false,
//         message: "Phone number is already registered",
//       });
//     }

//     const client = await Client.create({
//       name,
//       email,
//       phone,
//       address,
//       password,
//     });

//     // Remove password from response
//     client.password = undefined;

//     res.status(201).json({
//       success: true,
//       data: client,
//     });
//   } catch (error) {
//     // Handle mongoose validation errors
//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((err) => err.message);
//       return res.status(400).json({
//         success: false,
//         message: messages[0], // Return first error message
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: "Server error. Please try again.",
//     });
//   }
// };

// export const updateClient = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, email, phone, address, password } = req.body;

//     // Check if client exists
//     const existingClient = await Client.findById(id);
//     if (!existingClient) {
//       return res.status(404).json({
//         success: false,
//         message: "Client not found",
//       });
//     }

//     // Check for duplicate email
//     if (email && email !== existingClient.email) {
//       const emailExists = await Client.findOne({ email });
//       if (emailExists) {
//         return res.status(400).json({
//           success: false,
//           message: "Email is already registered",
//         });
//       }
//     }

//     // Check for duplicate phone
//     if (phone && phone !== existingClient.phone) {
//       const phoneExists = await Client.findOne({ phone });
//       if (phoneExists) {
//         return res.status(400).json({
//           success: false,
//           message: "Phone number is already registered",
//         });
//       }
//     }

//     const updateData = {
//       ...(name && { name }),
//       ...(email && { email }),
//       ...(phone && { phone }),
//       ...(address && { address }),
//       ...(password && { password }),
//     };

//     const updatedClient = await Client.findOneAndUpdate(
//       { _id: id },
//       updateData,
//       {
//         new: true,
//         runValidators: true,
//       }
//     ).select("-password");

//     res.status(200).json({
//       success: true,
//       data: updatedClient,
//     });
//   } catch (error) {
//     // Handle mongoose validation errors
//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((err) => err.message);
//       return res.status(400).json({
//         success: false,
//         message: messages[0], // Return first error message
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: "Server error. Please try again.",
//     });
//   }
// };

// export const deleteClient = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Check if client has any active service requests
//     const activeRequests = await ServiceRequest.find({
//       client: id,
//       status: { $nin: ["completed", "cancelled"] },
//     });

//     if (activeRequests.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot delete client with active service requests",
//       });
//     }

//     const client = await Client.findByIdAndDelete(id);

//     if (!client) {
//       return res.status(404).json({
//         success: false,
//         message: "Client not found",
//       });
//     }

//     // Also delete all completed/cancelled service requests
//     await ServiceRequest.deleteMany({
//       client: id,
//       status: { $in: ["completed", "cancelled"] },
//     });

//     res.status(200).json({
//       success: true,
//       message: "Client deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Service Request Management
// export const getAllServiceRequests = async (req, res) => {
//   try {
//     const requests = await ServiceRequest.find()
//       .populate("client", "name email phone address")
//       .populate("expert", "name email");

//     res.status(200).json({
//       success: true,
//       data: requests,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const getServiceRequestById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const request = await ServiceRequest.findById(id)
//       .populate("client", "name email phone address")
//       .populate("expert", "name email");

//     if (!request) {
//       return res.status(404).json({
//         success: false,
//         message: "Service request not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: request,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const deleteServiceRequest = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const request = await ServiceRequest.findById(id);

//     if (!request) {
//       return res.status(404).json({
//         success: false,
//         message: "Service request not found",
//       });
//     }

//     if (request.status === "completed") {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot delete completed requests",
//       });
//     }

//     await ServiceRequest.findByIdAndDelete(id);

//     res.status(200).json({
//       success: true,
//       message: "Service request deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const updateServiceRequestStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const validStatuses = [
//       "pending",
//       "assigned",
//       "in-progress",
//       "completed",
//       "cancelled",
//     ];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid status",
//       });
//     }

//     const request = await ServiceRequest.findByIdAndUpdate(
//       id,
//       {
//         status,
//         ...(status === "completed" ? { completedAt: Date.now() } : {}),
//       },
//       { new: true }
//     )
//       .populate("client", "name email phone address")
//       .populate("expert", "name email");

//     if (!request) {
//       return res.status(404).json({
//         success: false,
//         message: "Service request not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: request,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Payment Management
// export const getAllPayments = async (req, res) => {
//   try {
//     const payments = await Payment.find()
//       .populate("client", "name email phone")
//       .populate("serviceRequest", "title description status");

//     res.status(200).json({
//       success: true,
//       data: payments,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const getPaymentById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const payment = await Payment.findById(id)
//       .populate("client", "name email phone")
//       .populate("serviceRequest", "title description status");

//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: "Payment not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: payment,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const createPayment = async (req, res) => {
//   try {
//     const { amount, clientId, serviceRequestId, paymentMethod, status } =
//       req.body;

//     // Validate service request exists and is not already paid
//     const serviceRequest = await ServiceRequest.findById(serviceRequestId);
//     if (!serviceRequest) {
//       return res.status(404).json({
//         success: false,
//         message: "Service request not found",
//       });
//     }

//     // Check if payment already exists for this service request
//     const existingPayment = await Payment.findOne({
//       serviceRequest: serviceRequestId,
//     });
//     if (existingPayment) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment already exists for this service request",
//       });
//     }

//     const payment = await Payment.create({
//       amount,
//       client: clientId,
//       serviceRequest: serviceRequestId,
//       paymentMethod,
//       status,
//       transactionId: `TRX${Date.now()}`, // Generate a simple transaction ID
//     });

//     // If payment is completed, update service request status
//     if (status === "completed") {
//       await ServiceRequest.findByIdAndUpdate(serviceRequestId, {
//         paymentStatus: "paid",
//       });
//     }

//     const populatedPayment = await Payment.findById(payment._id)
//       .populate("client", "name email phone")
//       .populate("serviceRequest", "title description status");

//     res.status(201).json({
//       success: true,
//       data: populatedPayment,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const updatePayment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, paymentMethod } = req.body;

//     const payment = await Payment.findById(id);
//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: "Payment not found",
//       });
//     }

//     // Update payment
//     payment.status = status || payment.status;
//     payment.paymentMethod = paymentMethod || payment.paymentMethod;
//     await payment.save();

//     // If payment is completed, update service request status
//     if (status === "completed") {
//       await ServiceRequest.findByIdAndUpdate(payment.serviceRequest, {
//         paymentStatus: "paid",
//       });
//     }

//     const updatedPayment = await Payment.findById(id)
//       .populate("client", "name email phone")
//       .populate("serviceRequest", "title description status");

//     res.status(200).json({
//       success: true,
//       data: updatedPayment,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const deletePayment = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const payment = await Payment.findById(id);
//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: "Payment not found",
//       });
//     }

//     // Prevent deletion of completed payments
//     if (payment.status === "completed") {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot delete completed payments",
//       });
//     }

//     await Payment.findByIdAndDelete(id);

//     res.status(200).json({
//       success: true,
//       message: "Payment deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const assignServiceRequest = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { expertId } = req.body;

//     // Validate expert exists
//     const expert = await User.findById(expertId);
//     if (!expert || expert.role !== "expert") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid expert ID",
//       });
//     }

//     const request = await ServiceRequest.findById(id);
//     if (!request) {
//       return res.status(404).json({
//         success: false,
//         message: "Service request not found",
//       });
//     }

//     // Only update status if it was pending
//     const newStatus =
//       request.status === "pending" ? "assigned" : request.status;

//     const updatedRequest = await ServiceRequest.findByIdAndUpdate(
//       id,
//       {
//         expert: expertId,
//         status: newStatus,
//       },
//       { new: true }
//     )
//       .populate("client", "name email phone address")
//       .populate("expert", "name email");

//     res.status(200).json({
//       success: true,
//       data: updatedRequest,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const getDashboardStats = async (req, res) => {
//   try {
//     // Get counts from all collections
//     const clientCount = await Client.countDocuments();
//     const expertCount = await User.countDocuments({ role: "expert" });
//     const serviceRequestCount = await ServiceRequest.countDocuments();
//     const completedRequestCount = await ServiceRequest.countDocuments({
//       status: "completed",
//     });
//     const pendingRequestCount = await ServiceRequest.countDocuments({
//       status: "pending",
//     });
//     const totalPayments = await Payment.aggregate([
//       { $match: { status: "completed" } },
//       { $group: { _id: null, total: { $sum: "$amount" } } },
//     ]);

//     // Get recent service requests
//     const recentRequests = await ServiceRequest.find()
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .populate("client", "name")
//       .populate("expert", "name");

//     // Get recent payments
//     const recentPayments = await Payment.find()
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .populate("client", "name")
//       .populate("serviceRequest", "title");

//     res.status(200).json({
//       success: true,
//       data: {
//         counts: {
//           clients: clientCount,
//           experts: expertCount,
//           totalRequests: serviceRequestCount,
//           completedRequests: completedRequestCount,
//           pendingRequests: pendingRequestCount,
//           totalRevenue: totalPayments[0]?.total || 0,
//         },
//         recentRequests,
//         recentPayments,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
