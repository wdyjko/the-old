import { User, sequelize } from '../models/index';
import bcrypt from 'bcryptjs';

const createAdmin = async () => {
    try {
        console.log('Starting admin creation...');
        await sequelize.authenticate();
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('1', salt);

        await User.create({
            phone: '19717946283',
            password: hashedPassword,
            role: 'admin',
            name: '超级管理员',
            idCard: '000000000000000000',
            status: 'active',
        });
        
        console.log('Admin account created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Failed to create admin:', error);
        process.exit(1);
    }
};

createAdmin();
