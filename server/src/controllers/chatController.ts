import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ChatMessage, Order, User } from '../models';
import { getIO } from '../services/socketService';

const CHAT_ENABLED_STATUSES = ['in_progress', 'submitted', 'completed'];

const getUnreadFieldByRole = (role: string) => {
    return role === 'elderly' ? 'readByElderly' : 'readByVolunteer';
};

const getAuthorizedOrder = async (req: AuthRequest, orderId: number) => {
    const order = await Order.findByPk(orderId);
    if (!order) {
        return { status: 404, message: 'Order not found' } as const;
    }

    const user = req.user!;
    const isAdmin = user.role === 'admin';
    const isElderlyOwner = order.elderlyId === user.id;
    const isAssignedVolunteer = order.volunteerId === user.id;

    if (!isAdmin && !isElderlyOwner && !isAssignedVolunteer) {
        return { status: 403, message: 'Not authorized for this order chat' } as const;
    }

    if (!isAdmin && !CHAT_ENABLED_STATUSES.includes(order.status)) {
        return { status: 400, message: 'Chat is available after the order is accepted' } as const;
    }

    return { order } as const;
};

export const getOrderChatMessages = async (req: AuthRequest, res: Response) => {
    try {
        const orderId = parseInt(req.params.id as string, 10);
        const authResult = await getAuthorizedOrder(req, orderId);
        if ('status' in authResult) {
            const errorResult = authResult as { status: number; message: string };
            return res.status(errorResult.status).json({ message: errorResult.message });
        }

        const messages = await ChatMessage.findAll({
            where: { orderId },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name', 'phone', 'role'],
                },
            ],
            order: [['createdAt', 'ASC']],
        });

        res.json({ messages });
    } catch (error) {
        console.error('Get order chat messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const createOrderChatMessage = async (req: AuthRequest, res: Response) => {
    try {
        const orderId = parseInt(req.params.id as string, 10);
        const authResult = await getAuthorizedOrder(req, orderId);
        const currentUserId = req.user!.id;
        const currentUserRole = req.user!.role;
        if ('status' in authResult) {
            const errorResult = authResult as { status: number; message: string };
            return res.status(errorResult.status).json({ message: errorResult.message });
        }

        const { type = 'text', content } = req.body;
        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ message: 'Message content is required' });
        }
        if (type !== 'text' && type !== 'image') {
            return res.status(400).json({ message: 'Invalid message type' });
        }

        const message = await ChatMessage.create({
            orderId,
            senderId: currentUserId,
            senderRole: currentUserRole,
            type,
            content: content.trim(),
            readByElderly: currentUserRole === 'elderly',
            readByVolunteer: currentUserRole === 'volunteer',
        });

        const fullMessage = await ChatMessage.findByPk(message.id, {
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name', 'phone', 'role'],
                },
            ],
        });

        getIO().to(`order_chat_${orderId}`).emit('chat_message', fullMessage);

        res.status(201).json({ message: fullMessage });
    } catch (error) {
        console.error('Create order chat message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const markOrderChatAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const orderId = parseInt(req.params.id as string, 10);
        const authResult = await getAuthorizedOrder(req, orderId);
        if ('status' in authResult) {
            const errorResult = authResult as { status: number; message: string };
            return res.status(errorResult.status).json({ message: errorResult.message });
        }

        const currentUserRole = req.user!.role;
        if (currentUserRole !== 'elderly' && currentUserRole !== 'volunteer') {
            return res.json({ success: true });
        }

        const unreadField = getUnreadFieldByRole(currentUserRole);
        await ChatMessage.update(
            { [unreadField]: true },
            {
                where: {
                    orderId,
                    [unreadField]: false,
                },
            }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Mark order chat as read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
