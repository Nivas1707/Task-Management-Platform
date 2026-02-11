import { Router } from 'express';
import { getTasks, getTask, createTask, updateTask, deleteTask } from './task.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All task routes are protected
router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.post('/bulk', authenticate, async (req, res, next) => {
    // Dynamic import to avoid circular dependency if any, or just direct import
    const { bulkCreateTasks } = await import('./task.controller');
    await bulkCreateTasks(req, res);
});
// Support both PUT and PATCH for updates
router.put('/:id', updateTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
