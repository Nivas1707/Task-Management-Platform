import request from 'supertest';
import app from '../app';
import prisma from '../utils/prisma';
import { redisConnection } from '../config/redis';

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.user = { id: '507f1f77bcf86cd799439011', email: 'test@example.com' };
        next();
    }
}));

// Mock IO
jest.mock('../server', () => ({
    io: { emit: jest.fn() }
}));

// Mock Bull Queue
jest.mock('../jobs/email.queue', () => ({
    addEmailJob: jest.fn()
}));

describe('Task API', () => {
    beforeAll(async () => {
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.task.deleteMany({ where: { userId: '507f1f77bcf86cd799439011' } });
        await prisma.$disconnect();
        await redisConnection.quit();
    });

    describe('POST /api/tasks', () => {
        it('should create a new task', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .send({
                    title: 'Test Task',
                    description: 'Test Description',
                    priority: 'HIGH',
                    status: 'OPEN'
                });

            expect(res.status).toBe(201);
            expect(res.body.title).toBe('Test Task');
            expect(res.body.priority).toBe('HIGH');
        });

        it('should fail without title', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .send({
                    description: 'No Title'
                });

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/tasks', () => {
        it('should return a list of tasks', async () => {
            const res = await request(app).get('/api/tasks');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.meta).toBeDefined();
        });
    });
});
