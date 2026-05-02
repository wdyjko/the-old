import sequelize from '../config/database';
import { User } from '../models/User';
import { PointLog } from '../models/PointLog';

const POINT_RULES: Record<string, number> = {
    '代购物品': 2,
    '上门维修': 4,
    '陪同就医': 5,
    '生活照料': 3,
    'default': 1
};

export const awardPointsForOrder = async (volunteerId: number, orderId: number, category: string, pointsReward?: number | null) => {
    const pointsToAward = pointsReward != null ? pointsReward : (POINT_RULES[category] || POINT_RULES['default']);

    const transaction = await sequelize.transaction();
    try {
        // 1. Add points to User
        const user = await User.findByPk(volunteerId, { transaction });
        if (!user) throw new Error('Volunteer not found');
        
        user.points += pointsToAward;
        await user.save({ transaction });

        // 2. Create PointLog
        await PointLog.create({
            userId: volunteerId,
            pointsChanged: pointsToAward,
            reason: `Completed order: ${category}`,
            orderId: orderId
        }, { transaction });

        await transaction.commit();
        console.log(`Successfully awarded ${pointsToAward} points to volunteer ${volunteerId}`);
    } catch (error) {
        await transaction.rollback();
        console.error('Failed to award points transaction:', error);
        throw error;
    }
};
