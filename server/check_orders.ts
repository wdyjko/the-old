
import { Order } from './src/models/Order';
import { connectDB } from './src/config/database';
import dayjs from 'dayjs';
import { Op } from 'sequelize';

const checkStats = async () => {
    await connectDB();
    const orders = await Order.findAll();

    console.log('--- All Orders ---');
    orders.forEach((o: any) => {
        console.log(`ID: ${o.id}, Status: ${o.status}, Created: ${o.createdAt}, Updated: ${o.updatedAt}`);
    });
    
    process.exit(0);
};

checkStats();
