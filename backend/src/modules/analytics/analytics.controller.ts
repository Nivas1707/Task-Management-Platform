import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../utils/prisma';

export const getTaskStats = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const userId = req.user.id;

        const [totalTasks, tasksByStatus, tasksByPriority] = await Promise.all([
            prisma.task.count({ where: { userId, deletedAt: null } }),
            prisma.task.groupBy({
                by: ['status'],
                where: { userId, deletedAt: null },
                _count: { status: true }
            }),
            prisma.task.groupBy({
                by: ['priority'],
                where: { userId, deletedAt: null },
                _count: { priority: true }
            })
        ]);

        // Fetch completed tasks for performance metrics
        const completedTasks = await prisma.task.findMany({
            where: {
                userId,
                status: 'DONE',
                deletedAt: null
            },
            select: {
                createdAt: true,
                updatedAt: true,
                dueDate: true
            }
        });

        // 1. Average Completion Time
        let avgCompletionTime = 0;
        if (completedTasks.length > 0) {
            const totalTimeMs = completedTasks.reduce((acc, task) => {
                const start = new Date(task.createdAt).getTime();
                const end = new Date(task.updatedAt).getTime();
                return acc + (end - start);
            }, 0);
            avgCompletionTime = totalTimeMs / completedTasks.length; // in milliseconds
        }

        // 2. On-Time Completion Rate
        let onTimeCompletionRate = 0;
        const tasksWithDueDate = completedTasks.filter(t => t.dueDate);
        if (tasksWithDueDate.length > 0) {
            const onTimeCount = tasksWithDueDate.filter(t => {
                const completedAt = new Date(t.updatedAt).getTime();
                const dueAt = new Date(t.dueDate!).getTime();
                return completedAt <= dueAt;
            }).length;
            onTimeCompletionRate = (onTimeCount / tasksWithDueDate.length) * 100;
        }

        res.json({
            totalTasks,
            tasksByStatus: tasksByStatus.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count.status }), {}),
            tasksByPriority: tasksByPriority.reduce((acc, curr) => ({ ...acc, [curr.priority]: curr._count.priority }), {}),
            avgCompletionTime, // ms
            onTimeCompletionRate // percentage
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getTaskTrends = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        // This is a simplified trend: tasks created last 7 days.
        // SQLite/Prisma doesn't support complex date truncation easily in groupBy without raw queries or application-side processing.
        // We will fetch last 7 days tasks and aggregate in JS.
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const createdTasks = await prisma.task.findMany({
            where: {
                userId: req.user.id,
                createdAt: { gte: sevenDaysAgo },
                deletedAt: null
            },
            select: { createdAt: true }
        });

        const completedTasks = await prisma.task.findMany({
            where: {
                userId: req.user.id,
                status: 'DONE',
                updatedAt: { gte: sevenDaysAgo },
                deletedAt: null
            },
            select: { updatedAt: true }
        });

        const trends: Record<string, { created: number; completed: number }> = {};

        // Initialize last 7 days
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            trends[dateStr] = { created: 0, completed: 0 };
        }

        createdTasks.forEach(task => {
            const dateStr = task.createdAt.toISOString().split('T')[0];
            if (trends[dateStr]) {
                trends[dateStr].created++;
            }
        });

        completedTasks.forEach(task => {
            const dateStr = new Date(task.updatedAt).toISOString().split('T')[0];
            if (trends[dateStr]) {
                trends[dateStr].completed++;
            }
        });

        res.json({ trends });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
