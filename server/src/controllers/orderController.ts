import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { awardPointsForOrder } from '../services/pointService';
import { getIO } from '../services/socketService';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    if (req.user.role !== 'elderly' && req.user.role !== 'admin') {
         return res.status(403).json({ message: 'Only elderly/family or admin can publish requests' });
    }

    const { title, category, description, address, expectedTime, lat, lng } = req.body;

    const newOrder = await Order.create({
      title,
      category,
      description,
      address,
      expectedTime,
      lat,
      lng,
      elderlyId: userId,
      status: 'under_review',
      pointsReward: null
    });

    // We no longer notify volunteers here because it needs admin approval first
    // getIO().emit('new_order', newOrder);

    res.status(201).json({ message: 'Order created and pending admin review', order: newOrder });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    // Auto-expire orders that are still under review or pending but past their expected time
    await Order.update(
        { status: 'expired' },
        { 
            where: { 
                status: { [Op.in]: ['under_review', 'pending'] },
                expectedTime: { [Op.lt]: new Date() }
            } 
        }
    );
    
    let orders;
    // Volunteer sees pending orders (could add geo sorting later) or their own accepted orders
    if (user.role === 'volunteer') {
        const { tab, lat, lng, radius = 5 } = req.query; // e.g., 'available' or 'mine'
        if (tab === 'mine') {
            orders = await Order.findAll({ where: { volunteerId: user.id } });
        } else {
            // Only show pending orders that are NOT expired
            orders = await Order.findAll({ 
                where: { 
                    status: 'pending',
                    expectedTime: { [Op.gte]: new Date() }
                } 
            });
            
            // Apply geolocation distance filtering if coordinates provided
            if (lat && lng) {
                const userLat = parseFloat(lat as string);
                const userLng = parseFloat(lng as string);
                const r = parseFloat(radius as string);
                
                orders = orders.filter((o: any) => {
                    if (!o.lat || !o.lng) return false;
                    const R = 6371; // Earth's radius in km
                    const dLat = (o.lat - userLat) * (Math.PI / 180);
                    const dLon = (o.lng - userLng) * (Math.PI / 180);
                    const a = 
                        Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(userLat * (Math.PI / 180)) * Math.cos(o.lat * (Math.PI / 180)) * 
                        Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const d = R * c; // Distance
                    return d <= r;
                });
            }
        }
    } else if (user.role === 'elderly') {
        // Elderly sees their own orders
        orders = await Order.findAll({ where: { elderlyId: user.id } });
    } else {
        // Admin sees all
        orders = await Order.findAll();
    }

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrderDetail = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const order = await Order.findByPk(parseInt(id as string, 10));

        if (!order) {
             return res.status(404).json({ message: '订单不存在' });
        }

        // Authorization check
        if (user.role === 'elderly' && order.elderlyId !== user.id) {
             return res.status(403).json({ message: '无权查看此订单' });
        }
        if (user.role === 'volunteer' && order.status !== 'pending' && order.volunteerId !== user.id) {
             return res.status(403).json({ message: '无权查看此订单详情' });
        }

        res.json({ order });
    } catch (error) {
        console.error('Get order detail error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const acceptOrder = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (user.role !== 'volunteer') {
            return res.status(403).json({ message: 'Only volunteers can accept orders' });
        }
        
        // Ensure volunteer is active
        if (user.status !== 'active') {
             return res.status(403).json({ message: 'Your volunteer account is not active yet' });
        }

        const { id } = req.params;
        const order = await Order.findByPk(parseInt(id as string, 10));

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Order is no longer available' });
        }

        order.status = 'accepted';
        order.volunteerId = user.id;
        await order.save();

        // Notify the specific elderly user their order was accepted
        getIO().to(`user_${order.elderlyId}`).emit('order_status_update', order);

        res.json({ message: 'Order accepted successfully', order });

    } catch (error) {
        console.error('Accept order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { status, completionPhotos, completionDescription } = req.body; // 'in_progress', 'submitted', 'completed' 

        const order = await Order.findByPk(parseInt(id as string, 10));

        if (!order) {
             return res.status(404).json({ message: 'Order not found' });
        }

        // Only the assigned volunteer or admin can update status
        if (user.role === 'volunteer') {
            if (order.volunteerId !== user.id) {
                return res.status(403).json({ message: 'Not authorized for this order' });
            }
            if (status === 'completed') {
                return res.status(403).json({ message: '志愿者不能直接完成订单，请提交并等待确认' });
            }
        }

        order.status = status;
        if (completionPhotos) {
            order.completionPhotos = JSON.stringify(completionPhotos);
        }
        if (completionDescription) {
            order.completionDescription = completionDescription;
        }
        await order.save();

        let newPoints = undefined;
        if (status === 'completed' && order.volunteerId) {
            await awardPointsForOrder(order.volunteerId, order.id, order.category, order.pointsReward);
            const volunteerUser = await User.findByPk(order.volunteerId);
            if (volunteerUser) {
                 newPoints = volunteerUser.getDataValue('points');
            }
        }

        // Notify the elderly user of status update (e.g., in_progress, completed)
        getIO().to(`user_${order.elderlyId}`).emit('order_status_update', order);

        res.json({ message: 'Order updated successfully', order, newPoints });

    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const rateOrder = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { rating, comment } = req.body;
        
        const order = await Order.findByPk(parseInt(id as string, 10));
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (order.elderlyId !== user.id && user.role !== 'admin') {
            return res.status(403).json({ message: 'Only the issuer can rate this order' });
        }

        if (order.status !== 'completed') {
            return res.status(400).json({ message: 'Can only rate completed orders' });
        }

        order.rating = rating;
        order.comment = comment;
        await order.save();
        
        res.json({ message: 'Order rated successfully', order });
        
    } catch (error) {
        console.error('Rate order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const confirmOrderCompletion = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const order = await Order.findByPk(parseInt(id as string, 10));

        if (!order) {
            return res.status(404).json({ message: '订单不存在' });
        }

        // Only the elderly who created the order or admin can confirm
        if (order.elderlyId !== user.id && user.role !== 'admin') {
            return res.status(403).json({ message: '无权确认此订单' });
        }

        if (order.status !== 'submitted') {
            return res.status(400).json({ message: '只有已提交的订单可以确认完成' });
        }

        order.status = 'completed';
        await order.save();

        let newPoints = undefined;
        if (order.volunteerId) {
            await awardPointsForOrder(order.volunteerId, order.id, order.category, order.pointsReward);
            const volunteerUser = await User.findByPk(order.volunteerId);
            if (volunteerUser) {
                newPoints = volunteerUser.getDataValue('points');
            }
        }

        // Notify the volunteer that their order was confirmed
        getIO().to(`user_${order.volunteerId}`).emit('order_status_update', order);

        res.json({ message: '订单已确认完成', order, volunteerPoints: newPoints });

    } catch (error) {
        console.error('Confirm order completion error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};
