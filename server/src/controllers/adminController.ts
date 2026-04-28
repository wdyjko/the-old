import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Order } from '../models/Order';
import sequelize from '../config/database';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import { getIO } from '../services/socketService';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const todayStart = dayjs().startOf('day').toDate();
        const monthStart = dayjs().startOf('month').toDate();

        // Pending orders
        const pendingOrdersCount = await Order.count({ where: { status: 'pending' } });
        
        // Month Completion rate: (Orders created this month AND completed) / (Orders created this month)
        const totalMonthOrders = await Order.count({ where: { createdAt: { [Op.gte]: monthStart } } });
        const completedMonthOrders = await Order.count({ 
            where: { 
                createdAt: { [Op.gte]: monthStart },
                status: 'completed'
            } 
        });
        
        const completionRate = totalMonthOrders === 0 ? 0 : (completedMonthOrders / totalMonthOrders) * 100;

        // Categories distribution (for ECharts Pie chart)
        const categoriesData = await Order.findAll({
            attributes: ['category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['category']
        });

        // User stats
        const totalUsers = await User.count();
        const newUsersToday = await User.count({ where: { createdAt: { [Op.gte]: todayStart } } });

        res.json({
            stats: {
                pendingOrdersCount,
                completionRate: parseFloat(completionRate.toFixed(2)),
                categoriesData,
                totalUsers,
                newUsersToday
            }
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const { role, status } = req.query;
        let whereClause: any = {};
        
        if (role) whereClause.role = role;
        if (status) whereClause.status = status;

        const users = await User.findAll({ 
            where: whereClause,
            attributes: { exclude: ['password'] } 
        });
        res.json({ users });
    } catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateUserStatus = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { id } = req.params;
        const { status } = req.body; // 'active', 'disabled'

        const user = await User.findByPk(parseInt(id as string, 10));
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = status;
        await user.save();

        res.json({ message: 'User status updated successfully', user });
    } catch (error) {
        console.error('Update user status Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { id } = req.params;
        const targetId = parseInt(id as string, 10);

        if (targetId === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const user = await User.findByPk(targetId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const auditOrder = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { id } = req.params;
        const { status, pointsReward } = req.body; // 'pending' (approve) or 'rejected'

        if (status !== 'pending' && status !== 'rejected') {
            return res.status(400).json({ message: 'Invalid audit status' });
        }

        if (status === 'pending' && (pointsReward === undefined || pointsReward === null || pointsReward <= 0)) {
            return res.status(400).json({ message: 'Approved orders must have a valid points reward' });
        }

        const order = await Order.findByPk(parseInt(id as string, 10));
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'under_review') {
            return res.status(400).json({ message: 'Order is not under review' });
        }

        // Apply changes
        order.status = status;
        if (status === 'pending') {
            order.pointsReward = pointsReward;
        }

        await order.save();

        if (status === 'pending') {
            // Notify volunteers that a new order is available
            getIO().emit('new_order', order);
        }

        // Notify elderly user
        getIO().to(`user_${order.elderlyId}`).emit('order_status_update', order);

        res.json({ message: `Order ${status === 'pending' ? 'approved' : 'rejected'} successfully`, order });
    } catch (error) {
        console.error('Audit Order Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { id } = req.params;
        const { title, category, description, status, pointsReward, address, expectedTime } = req.body;

        const order = await Order.findByPk(parseInt(id as string, 10));
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (title !== undefined) order.title = title;
        if (category !== undefined) order.category = category;
        if (description !== undefined) order.description = description;
        if (status !== undefined) order.status = status;
        if (pointsReward !== undefined) order.pointsReward = pointsReward;
        if (address !== undefined) order.address = address;
        if (expectedTime !== undefined) order.expectedTime = expectedTime;

        await order.save();
        res.json({ message: 'Order updated successfully', order });
    } catch (error) {
        console.error('Update Order Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { id } = req.params;
        const order = await Order.findByPk(parseInt(id as string, 10));
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await order.destroy();
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Delete Order Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
