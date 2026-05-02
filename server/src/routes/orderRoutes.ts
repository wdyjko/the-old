import { Router } from 'express';
import { createOrder, getOrders, getOrderDetail, acceptOrder, updateOrderStatus, rateOrder, confirmOrderCompletion, rejectOrderCompletion } from '../controllers/orderController';
import { createOrderChatMessage, getOrderChatMessages, markOrderChatAsRead } from '../controllers/chatController';
import { auth } from '../middleware/authMiddleware';

const router = Router();

// All order routes require authentication
router.use(auth);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderDetail);
router.get('/:id/chat', getOrderChatMessages);
router.post('/:id/chat', createOrderChatMessage);
router.post('/:id/chat/read', markOrderChatAsRead);
router.post('/:id/accept', acceptOrder);
router.put('/:id/status', updateOrderStatus);
router.post('/:id/confirm', confirmOrderCompletion);
router.post('/:id/reject-completion', rejectOrderCompletion);
router.post('/:id/rate', rateOrder);

export default router;
