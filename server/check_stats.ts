
import { Order } from './src/models/Order';
import { connectDB } from './src/config/database';
import dayjs from 'dayjs';
import { Op } from 'sequelize';

const checkStats = async () => {
    await connectDB();
    const monthStart = dayjs().startOf('month').toDate();
    
    const totalMonthOrders = await Order.count({ where: { createdAt: { [Op.gte]: monthStart } } });
    const completedMonthOrders = await Order.count({ 
        where: { 
            createdAt: { [Op.gte]: monthStart },
            status: 'completed'
        } 
    });

    const allCompletedOrders = await Order.count({ where: { status: 'completed' } });
    const allOrders = await Order.count();

    console.log('--- Stats Check ---');
    console.log('Month Start:', monthStart);
    console.log('Total Orders created this month:', totalMonthOrders);
    console.log('Completed Orders created this month:', completedMonthOrders);
    console.log('All Completed Orders in DB:', allCompletedOrders);
    console.log('All Orders in DB:', allOrders);
    
    process.exit(0);
};

checkStats();
