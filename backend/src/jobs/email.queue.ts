import Queue from 'bull';
import { sendEmail } from '../services/email.service';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
};

export const emailQueue = new Queue('email', {
    redis: redisConfig
});

emailQueue.process(async (job) => {
    const { to, subject, html } = job.data;
    console.log(`Processing email job for ${to}`);
    await sendEmail(to, subject, html);
});

export const addEmailJob = (to: string, subject: string, html: string) => {
    emailQueue.add({ to, subject, html }, {
        attempts: 3,
        backoff: 5000, // 5 seconds
        removeOnComplete: true
    });
};
