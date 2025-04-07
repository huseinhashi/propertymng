// import mongoose from "mongoose";

// const serviceRequestSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: [true, "Title is required"],
//   },
//   description: {
//     type: String,
//     required: [true, "Description is required"],
//   },
//   status: {
//     type: String,
//     enum: ["pending", "assigned", "in-progress", "completed", "cancelled"],
//     default: "pending",
//   },
//   client: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Client",
//     required: true,
//   },
//   expert: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//   },
//   cost: {
//     type: Number,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// serviceRequestSchema.pre("save", function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);

// export default ServiceRequest;
