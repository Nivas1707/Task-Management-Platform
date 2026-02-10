import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../utils/prisma';

export const getTaskStats = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const userId = req.user.id;

        const [totalTasks, tasksByStatus, tasksByPriority] = await Promise.all([
            prisma.task.count({ where: { userId } }),
            prisma.task.groupBy({
                by: ['status'],
                where: { userId },
                _count: { status: true }
            }),
            prisma.task.groupBy({
                by: ['priority'],
                where: { userId },
                _count: { priority: true }
            })
        ]);

        res.json({
            totalTasks,
            tasksByStatus: tasksByStatus.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count.status }), {}),
            tasksByPriority: tasksByPriority.reduce((acc, curr) => ({ ...acc, [curr.priority]: curr._count.priority }), {})
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

        const tasks = await prisma.task.findMany({
            where: {
                userId: req.user.id,
                createdAt: { gte: sevenDaysAgo }
            },
            select: { createdAt: true, status: true }
        });

        const trends: Record<string, number> = {};
        // Initialize last 7 days
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            trends[dateStr] = 0;
        }

        tasks.forEach(task => {
            const dateStr = task.createdAt.toISOString().split('T')[0];
            if (trends[dateStr] !== undefined) {
                trends[dateStr]++;
            }
        });

        res.json({ trends });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
