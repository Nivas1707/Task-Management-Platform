import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { createCommentSchema } from './comment.schema';
import { AuthRequest } from '../../middleware/auth';

export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const validation = createCommentSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ errors: validation.error.issues });
            return;
        }

        const { content, taskId } = validation.data;

        // Verify task exists and user has access (for simplicity, just existence or arbitrary logic)
        // Here assuming any auth user can comment on visible tasks.
        // Ideally check if task belongs to user or is shared.
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                taskId,
                userId: req.user.id,
            },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getTaskComments = async (req: Request, res: Response): Promise<void> => {
    // Should be authenticated? Yes.
    try {
        const { taskId } = req.params;
        const comments = await prisma.comment.findMany({
            where: { taskId: String(taskId) },
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { id: true, name: true } }
            }
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const { id } = req.params;
        const comment = await prisma.comment.findUnique({ where: { id: String(id) } });

        if (!comment) {
            res.status(404).json({ message: 'Comment not found' });
            return;
        }

        // Only allow deleting own comments
        if (comment.userId !== req.user.id) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        await prisma.comment.delete({ where: { id: String(id) } });
        res.json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
