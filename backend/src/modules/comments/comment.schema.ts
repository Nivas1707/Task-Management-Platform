import { z } from 'zod';

export const createCommentSchema = z.object({
    content: z.string().min(1),
    taskId: z.string().uuid(),
});
