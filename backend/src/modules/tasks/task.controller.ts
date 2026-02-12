import { io } from '../../server';
import { Response } from 'express';
import { addEmailJob } from '../../jobs/email.queue';
import { redisConnection, isRedisConnected } from '../../config/redis';


import prisma from '../../utils/prisma';
import { createTaskSchema, updateTaskSchema, bulkCreateTaskSchema, taskQuerySchema } from './task.schema';
import { AuthRequest } from '../../middleware/auth';
import { Prisma } from '@prisma/client';

// Helper to get priority value
const getPriorityValue = (priority: string) => {
    switch (priority) {
        case 'HIGH': return 3;
        case 'MEDIUM': return 2;
        case 'LOW': return 1;
        default: return 0;
    }
};

// Helper to invalidate cache
const invalidateUserCache = async (userId: string) => {
    if (!isRedisConnected()) return;
    try {
        const keys = await redisConnection.keys(`tasks:${userId}:*`);
        if (keys.length > 0) {
            await redisConnection.del(keys);
        }
    } catch (err) {
        console.error('Redis invalidation error:', err);
    }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const queryValidation = taskQuerySchema.safeParse(req.query);
        if (!queryValidation.success) {
            res.status(400).json({ errors: queryValidation.error.issues });
            return;
        }

        // Cache Key Generation
        const cacheKey = `tasks:${req.user.id}:${JSON.stringify(queryValidation.data)}`;

        if (isRedisConnected()) {
            try {
                const cachedData = await redisConnection.get(cacheKey);
                if (cachedData) {
                    res.json(JSON.parse(cachedData));
                    return;
                }
            } catch (err) {
                console.error('Redis get error:', err);
            }
        }

        console.log(`[GET_TASKS] User: ${req.user.id}, Params:`, queryValidation.data);
        const { status, priority, search, page, limit, tags, sortBy, order } = queryValidation.data;
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        const where: Prisma.TaskWhereInput = {
            userId: req.user.id,
            deletedAt: null
        };

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (tags) {
            const tagList = tags.split(',').map(t => t.trim());
            where.tags = { hasSome: tagList };
        }

        // console.log('[GET_TASKS] Where clause:', JSON.stringify(where, null, 2));

        const orderBy: any = {};
        if (sortBy) {
            // Fix sorting: use priorityValue for 'priority' sort
            const sortField = sortBy === 'priority' ? 'priorityValue' : sortBy;
            orderBy[sortField] = order === 'asc' ? 'asc' : 'desc';
        } else {
            orderBy.createdAt = 'desc';
        }

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                orderBy,
                skip,
                take: limitNum,
                include: {
                    _count: { select: { comments: true, files: true } },
                    assignedTo: { select: { id: true, name: true, email: true } }
                }
            }),
            prisma.task.count({ where })
        ]);

        const result = {
            data: tasks,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        };

        // Cache the result for 60 seconds
        if (isRedisConnected()) {
            try {
                await redisConnection.setex(cacheKey, 60, JSON.stringify(result));
            } catch (err) {
                console.error('Redis set error:', err);
            }
        }

        // console.log(`[GET_TASKS] Found ${tasks.length} tasks, Total: ${total}`);
        res.json(result);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const id = String(req.params.id);
        const task = await prisma.task.findFirst({
            where: { id, userId: req.user.id, deletedAt: null },
            include: {
                comments: {
                    include: { user: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'asc' }
                },
                files: {
                    select: {
                        id: true,
                        originalName: true,
                        filename: true,
                        mimeType: true,
                        size: true,
                        createdAt: true,
                        taskId: true
                    }
                },
                assignedTo: { select: { id: true, name: true, email: true } }
            }
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
        console.log('[CREATE_TASK] Body:', req.body);
        const validation = createTaskSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ errors: validation.error.issues });
            return;
        }

        const { title, description, status, priority, dueDate, tags, assignedToId } = validation.data;
        const priorityVal = getPriorityValue(priority || 'MEDIUM');

        const task = await prisma.task.create({
            data: {
                title,
                description,
                status: status || 'OPEN',
                priority: priority || 'MEDIUM',
                priorityValue: priorityVal,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                tags: tags || [],
                assignedToId,
                userId: req.user.id,
                deletedAt: null, // Explicitly set to null to ensure it matches queries
            },
        });
        console.log('[CREATE_TASK] Success:', task.id);
        io.emit('task:created', task);

        // Send email notification if assigned
        if (task.assignedToId && req.user?.email) {
            addEmailJob(req.user.email, 'New Task Created', `<p>Task <strong>${task.title}</strong> has been created.</p>`);
        }

        await invalidateUserCache(req.user.id);
        res.status(201).json(task);
    } catch (error) {
        console.error('[CREATE_TASK] Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const bulkCreateTasks = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const validation = bulkCreateTaskSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ errors: validation.error.issues });
            return;
        }

        const tasksData = validation.data.map(task => ({
            ...task,
            status: task.status || 'OPEN',
            priority: task.priority || 'MEDIUM',
            priorityValue: getPriorityValue(task.priority || 'MEDIUM'),
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            tags: task.tags || [],
            userId: req.user!.id,
            deletedAt: null,
        }));

        await prisma.task.createMany({ data: tasksData });
        await invalidateUserCache(req.user!.id);
        res.status(201).json({ message: 'Tasks created successfully', count: tasksData.length });
    } catch (error) {
        console.error('Bulk create error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const id = String(req.params.id);
        const validation = updateTaskSchema.safeParse(req.body);
        if (!validation.success) {
            console.error('[UPDATE_TASK] Validation Error:', JSON.stringify(validation.error.issues, null, 2));
            res.status(400).json({ errors: validation.error.issues });
            return;
        }

        const existingTask = await prisma.task.findFirst({ where: { id, deletedAt: null } });
        if (!existingTask) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        // Check permissions: Allow if creator OR assignee
        if (existingTask.userId !== req.user.id && existingTask.assignedToId !== req.user.id) {
            res.status(403).json({ message: 'Forbidden: You are not allowed to edit this task' });
            return;
        }

        const { title, description, status, priority, dueDate, tags, assignedToId } = validation.data;

        const updateData: any = {
            title,
            description,
            status,
            priority,
            tags,
        };

        if (dueDate !== undefined) {
            updateData.dueDate = dueDate ? new Date(dueDate) : null;
        }

        if (assignedToId !== undefined) {
            updateData.assignedToId = assignedToId;
        }

        if (priority) {
            updateData.priorityValue = getPriorityValue(priority);
        }

        if (assignedToId !== undefined) {
            updateData.assignedToId = assignedToId;
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data: updateData
        });
        io.emit('task:updated', updatedTask);
        await invalidateUserCache(req.user.id);
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

        // Soft delete
        await prisma.task.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
        io.emit('task:deleted', { id });
        await invalidateUserCache(req.user.id);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
