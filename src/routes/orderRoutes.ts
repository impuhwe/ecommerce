import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminOnly, customerOnly } from "../middleware/roleMiddleware";
import { validate } from "../middleware/validate";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../validators/storeValidators";

const router = Router();

router.post("/", authMiddleware, customerOnly, validate(createOrderSchema), createOrder);
router.get("/my", authMiddleware, customerOnly, getMyOrders);
router.get("/", authMiddleware, adminOnly, getAllOrders);
router.get("/:id", authMiddleware, adminOnly, getOrderById);
router.put(
  "/:id/status",
  authMiddleware,
  adminOnly,
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

export default router;
