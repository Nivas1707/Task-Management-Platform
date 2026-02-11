import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
};

export const redisConnection = new Redis(redisConfig);

redisConnection.on('error', (err) => {
    console.warn('Redis connection error:', err.message);
    console.warn('Caching and Background Jobs will be disabled.');
});

export const isRedisConnected = () => redisConnection.status === 'ready';
