import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { PrizeRedemption } from '../models/PrizeRedemption';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, role, name, idCard } = req.body;

    if (!phone || !password) {
      res.status(400).json({ message: '手机号和密码不能为空' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      res.status(400).json({ message: '该手机号已注册' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    // Determine initial status based on role
    let initialStatus = 'active';
    if (role === 'volunteer') {
        initialStatus = 'pending';
    }

    // Create user
    const newUser = await User.create({
      phone,
      password: hashedPassword,
      role: role || 'elderly',
      name: name || '',
      idCard: idCard || '',
      status: initialStatus
    });

    const userData = newUser.get({ plain: true });

    res.status(201).json({
      message: '注册成功',
      user: {
        id: userData.id,
        phone: userData.phone,
        role: userData.role,
        status: userData.status
      }
    });

  } catch (error) {
    console.error('[Register] Error:', error);
    res.status(500).json({ message: '注册失败，服务器内部错误' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      res.status(400).json({ message: '请输入手机号和密码' });
      return;
    }

    // Find user by phone - use raw to get plain object
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      res.status(400).json({ message: '手机号或密码错误' });
      return;
    }

    // Use .get() to safely access model attributes
    const userData = user.get({ plain: true }) as any;

    console.log('[Login] User found:', userData.id, 'phone:', userData.phone);

    // Check if password matches
    const isMatch = await bcrypt.compare(String(password), String(userData.password));
    if (!isMatch) {
      res.status(400).json({ message: '手机号或密码错误' });
      return;
    }

    // Check status
    if (userData.status === 'disabled') {
       res.status(403).json({ message: '账号已被禁用，请联系管理员' });
       return;
    }

    // Sign JWT synchronously
    const token = jwt.sign(
      { user: { id: userData.id, role: userData.role, status: userData.status } },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: userData.id,
        phone: userData.phone,
        role: userData.role,
        name: userData.name,
        points: userData.points,
        status: userData.status
      }
    });

  } catch (error) {
    console.error('[Login] Error:', error);
    res.status(500).json({ message: '登录失败，服务器内部错误' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findByPk((req as any).user.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            res.status(404).json({ message: '用户未找到' });
            return;
        }
        
        const userData = user.get({ plain: true });
        res.json({ user: userData });
    } catch (error) {
        console.error('[GetMe] Error:', error);
        res.status(500).json({ message: '获取用户信息失败' });
    }
};

export const redeemPoints = async (req: Request, res: Response): Promise<void> => {
    try {
        const { points, itemName, targetPhone } = req.body;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (req as any).user.id;

        if (!points || points <= 0 || !itemName || !targetPhone) {
            res.status(400).json({ message: '无效的兑换参数' });
            return;
        }

        if (itemName.includes('公益之星')) {
            const existingHonor = await PrizeRedemption.findOne({ 
                where: { targetPhone, prizeName: itemName }
            });
            if (existingHonor) {
                res.status(400).json({ message: '此荣誉称号每人仅限兑换一次' });
                return;
            }
        }

        const user = await User.findByPk(userId);
        
        if (!user) {
            res.status(404).json({ message: '用户不存在' });
            return;
        }

        const currentPoints = user.getDataValue('points') || 0;

        if (currentPoints < points) {
            res.status(400).json({ message: '积分不足，无法兑换' });
            return;
        }

        // Deduct points
        user.setDataValue('points', currentPoints - points);
        await user.save();

        await PrizeRedemption.create({
            userId,
            prizeName: itemName,
            cost: points,
            targetPhone
        });

        res.json({
            message: `成功兑换：${itemName}，已发放至手机：${targetPhone}`,
            points: user.getDataValue('points')
        });
    } catch (error) {
        console.error('[RedeemPoints] Error:', error);
        res.status(500).json({ message: '兑换失败，发生内部错误' });
    }
};

export const usePrize = async (req: Request, res: Response): Promise<void> => {
    try {
        const { prizeId } = req.body;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (req as any).user.id;
        
        const prize = await PrizeRedemption.findByPk(prizeId);
        
        if (!prize) {
            res.status(404).json({ message: '此兑换记录不存在' });
            return;
        }
        
        if (prize.status === 'shipped') {
            res.status(400).json({ message: '此奖品已经使用过了' });
            return;
        }

        prize.status = 'shipped';
        await prize.save();
        
        res.json({ message: '使用成功，已生效！' });
    } catch (error) {
        console.error('[usePrize] Error:', error);
        res.status(500).json({ message: '使用异常，发生内部错误' });
    }
};
