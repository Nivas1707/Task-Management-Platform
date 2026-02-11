import { z } from 'zod';

export const createCommentSchema = z.object({
    content: z.string().min(1),
    taskId: z.string(), // MongoDB ObjectID is not a UUID
});

export const updateCommentSchema = z.object({
    content: z.string().min(1),
});
