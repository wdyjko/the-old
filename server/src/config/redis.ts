import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: false  // Do not auto-reconnect
  }
});

redisClient.on('error', () => {}); // Suppress errors; handled in connectRedis
redisClient.on('connect', () => console.log('✅ Redis Client Connected'));

export const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (error) {
        console.warn('⚠️  Redis 未连接，积分缓存功能将降级运行。如需完整功能请启动 Redis。');
    }
};

export default redisClient;

