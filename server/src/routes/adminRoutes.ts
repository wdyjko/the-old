import { Router } from 'express';
import { getDashboardStats, getUsers, updateUserStatus, auditOrder, updateOrder, deleteOrder, deleteUser } from '../controllers/adminController';
import { auth } from '../middleware/authMiddleware';

const router = Router();

// All admin routes require authentication (and role check in controller)
router.use(auth);

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);
router.put('/orders/:id/audit', auditOrder);
router.put('/orders/:id/update', updateOrder);
router.delete('/orders/:id', deleteOrder);

export default router;
