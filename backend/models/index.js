import Admin from "./admin.model.js";
import Customer from "./customer.model.js";
import Expert from "./expert.model.js";
import ServiceType from "./service-type.model.js";
import RepairRequest from "./repair-request.model.js";
import ServiceImage from "./service-image.model.js";
import Bid from "./bid.model.js";
import ServiceOrder from "./service-order.model.js";
import Payment from "./payment.model.js";
import Payout from "./payout.model.js";
import RefundRequest from "./refund-request.model.js";
import Rating from "./rating.model.js";

// Relationships
ServiceType.hasMany(Expert, { foreignKey: "service_type_id" });
Expert.belongsTo(ServiceType, { foreignKey: "service_type_id" });

Customer.hasMany(RepairRequest, { foreignKey: "customer_id" });
RepairRequest.belongsTo(Customer, { foreignKey: "customer_id" });

RepairRequest.hasMany(ServiceImage, { foreignKey: "request_id" });
ServiceImage.belongsTo(RepairRequest, { foreignKey: "request_id" });

RepairRequest.hasMany(Bid, { foreignKey: "request_id" });
Bid.belongsTo(RepairRequest, { foreignKey: "request_id" });

Expert.hasMany(Bid, { foreignKey: "expert_id" });
Bid.belongsTo(Expert, { foreignKey: "expert_id" });

RepairRequest.hasMany(ServiceOrder, { foreignKey: "request_id" });
ServiceOrder.belongsTo(RepairRequest, { foreignKey: "request_id" });

Customer.hasMany(ServiceOrder, { foreignKey: "customer_id" });
ServiceOrder.belongsTo(Customer, { foreignKey: "customer_id" });

Expert.hasMany(ServiceOrder, { foreignKey: "expert_id" });
ServiceOrder.belongsTo(Expert, { foreignKey: "expert_id" });

ServiceOrder.hasMany(Payment, { foreignKey: "service_order_id" });
Payment.belongsTo(ServiceOrder, { foreignKey: "service_order_id" });

ServiceOrder.hasMany(Payout, { foreignKey: "service_order_id" });
Payout.belongsTo(ServiceOrder, { foreignKey: "service_order_id" });

Expert.hasMany(Payout, { foreignKey: "expert_id" });
Payout.belongsTo(Expert, { foreignKey: "expert_id" });

ServiceOrder.hasMany(RefundRequest, { foreignKey: "service_order_id" });
RefundRequest.belongsTo(ServiceOrder, { foreignKey: "service_order_id" });

Customer.hasMany(RefundRequest, { foreignKey: "customer_id" });
RefundRequest.belongsTo(Customer, { foreignKey: "customer_id" });

ServiceOrder.hasMany(Rating, { foreignKey: "service_order_id" });
Rating.belongsTo(ServiceOrder, { foreignKey: "service_order_id" });

Expert.hasMany(Rating, { foreignKey: "expert_id" });
Rating.belongsTo(Expert, { foreignKey: "expert_id" });

export {
  Admin,
  Customer,
  Expert,
  ServiceType,
  RepairRequest,
  ServiceImage,
  Bid,
  ServiceOrder,
  Payment,
  Payout,
  RefundRequest,
  Rating,
};
