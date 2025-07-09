import Notification from "../models/notification.model.js";

export const getCustomerNotifications = async (req, res, next) => {
  try {
    const customerId = req.user.customer_id;
    const notifications = await Notification.findAll({
      where: { user_id: customerId, user_type: "customer" },
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

export const getExpertNotifications = async (req, res, next) => {
  try {
    const expertId = req.user.expert_id;
    const notifications = await Notification.findAll({
      where: { user_id: expertId, user_type: "expert" },
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};
