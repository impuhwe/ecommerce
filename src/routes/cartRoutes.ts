import { Router } from "express";
import {
  addCartItem,
  getMyCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cartController";
import { authMiddleware } from "../middleware/authMiddleware";
import { customerOnly } from "../middleware/roleMiddleware";
import { validate } from "../middleware/validate";
import {
  addCartItemSchema,
  updateCartItemSchema,
} from "../validators/storeValidators";

const router = Router();

router.use(authMiddleware, customerOnly);
router.get("/", getMyCart);
router.post("/items", validate(addCartItemSchema), addCartItem);
router.put("/items/:id", validate(updateCartItemSchema), updateCartItem);
router.delete("/items/:id", removeCartItem);

export default router;
