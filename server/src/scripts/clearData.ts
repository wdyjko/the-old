import { User, Order, PointLog, PrizeRedemption, sequelize } from '../models/index';

const clearAllData = async () => {
    try {
        console.log('Starting DB wipe...');
        await sequelize.authenticate();
        
        // Delete child tables first to avoid foreign key constraint errors
        await PrizeRedemption.destroy({ where: {} });
        await PointLog.destroy({ where: {} });
        await Order.destroy({ where: {} });
        
        // Finally, delete all users
        await User.destroy({ where: {} });
        
        console.log('All DB tables have been wiped successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Wipe failed:', error);
        process.exit(1);
    }
};

clearAllData();
