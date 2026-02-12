import { z } from 'zod';

export const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    dueDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
    assignedToId: z.string().optional(), // MongoDB ObjectID
});

export const bulkCreateTaskSchema = z.array(createTaskSchema);

export const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.union([z.string(), z.null()]).optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    dueDate: z.union([z.string(), z.null()]).optional(), // Allow string, null, or undefined
    tags: z.array(z.string()).optional(),
    assignedToId: z.string().nullable().optional(),
});

export const taskQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    tags: z.string().optional(),
    sortBy: z.string().optional(),
    order: z.string().optional(),
});
