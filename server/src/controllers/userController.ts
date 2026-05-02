import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { PrizeRedemption } from '../models/PrizeRedemption';

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'phone', 'address', 'role', 'points'],
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Find redemptions where the current user's phone is the target phone
        const redemptions = await PrizeRedemption.findAll({
            where: { targetPhone: user.phone },
            order: [['createdAt', 'DESC']]
        });
        
        const userData = user.get({ plain: true });
        userData.prizeRedemptions = redemptions;
        
        res.json({ user: userData });
    } catch (error) {
        console.error('getProfile error:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { name, phone, address } = req.body;
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // If updating phone, ensure it's not taken by someone else
        if (phone && phone !== user.phone) {
            const existing = await User.findOne({ where: { phone } });
            if (existing) {
                return res.status(400).json({ message: '此手机号已被其他账号使用' });
            }
        }
        
        user.name = name !== undefined ? name : user.name;
        user.phone = phone !== undefined ? phone : user.phone;
        user.address = address !== undefined ? address : user.address;
        
        await user.save();
        
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('updateProfile error:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};
