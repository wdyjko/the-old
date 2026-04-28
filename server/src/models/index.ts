import sequelize from '../config/database';
import { User } from './User';
import { Order } from './Order';
import { PointLog } from './PointLog';
import { PrizeRedemption } from './PrizeRedemption';

// Define associations
User.hasMany(Order, { foreignKey: 'elderlyId', as: 'publishedOrders' });
Order.belongsTo(User, { foreignKey: 'elderlyId', as: 'elderly' });

User.hasMany(Order, { foreignKey: 'volunteerId', as: 'acceptedOrders' });
Order.belongsTo(User, { foreignKey: 'volunteerId', as: 'volunteer' });

User.hasMany(PointLog, { foreignKey: 'userId', as: 'pointLogs' });
PointLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Order.hasMany(PointLog, { foreignKey: 'orderId', as: 'pointLogs' });
PointLog.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

User.hasMany(PrizeRedemption, { foreignKey: 'userId', as: 'prizeRedemptions' });
PrizeRedemption.belongsTo(User, { foreignKey: 'userId', as: 'user' });

import bcrypt from 'bcryptjs';

export const syncDatabase = async () => {
  try {
    // Note: use { alter: true } sparingly in production.
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully.');

    // Seed default admin account if not exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await User.create({
        phone: 'admin',
        password: hashedPassword,
        role: 'admin',
        name: '系统管理员',
        idCard: '',
        status: 'active',
      });
      console.log('Default admin account created (phone: admin, password: admin123)');
    }
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

export { User, Order, PointLog, PrizeRedemption, sequelize };
