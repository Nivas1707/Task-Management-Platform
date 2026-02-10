import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { createTaskSchema, updateTaskSchema } from './task.schema';
import { AuthRequest } from '../../middleware/auth';

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const { status, priority, search } = req.query;

        const where: any = { userId: req.user.id };
        if (status) where.status = String(status);
        if (priority) where.priority = String(priority);
        if (search) {
            const searchTerm = String(search);
            where.OR = [
                { title: { contains: searchTerm } },
                { description: { contains: searchTerm } },
            ];
        }

        const tasks = await prisma.task.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { comments: true, files: true } }
            }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const id = String(req.params.id);
        const task = await prisma.task.findFirst({
            where: { id, userId: req.user.id },
            include: { comments: true, files: true }
        });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const validation = createTaskSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ errors: validation.error.issues });
            return;
        }

        const { title, description, status, priority, dueDate } = validation.data;

        const task = await prisma.task.create({
            data: {
                title,
                description,
                status: status || 'OPEN',
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : undefined,
                userId: req.user.id,
            },
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const id = String(req.params.id);
        const validation = updateTaskSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ errors: validation.error.issues });
            return;
        }

        const existingTask = await prisma.task.findFirst({ where: { id, userId: req.user.id } });
        if (!existingTask) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        const { title, description, status, priority, dueDate } = validation.data;
        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                title,
                description,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : undefined
            }
        });
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const id = String(req.params.id);
        const existingTask = await prisma.task.findFirst({ where: { id, userId: req.user.id } });
        if (!existingTask) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        await prisma.task.delete({ where: { id } });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
