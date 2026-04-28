import { Router } from 'express';
import { createOrder, getOrders, getOrderDetail, acceptOrder, updateOrderStatus, rateOrder, confirmOrderCompletion } from '../controllers/orderController';
import { auth } from '../middleware/authMiddleware';

const router = Router();

// All order routes require authentication
router.use(auth);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderDetail);
router.post('/:id/accept', acceptOrder);
router.put('/:id/status', updateOrderStatus);
router.post('/:id/confirm', confirmOrderCompletion);
router.post('/:id/rate', rateOrder);

export default router;
