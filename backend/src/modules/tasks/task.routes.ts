import { Router } from 'express';
import { getTasks, getTask, createTask, updateTask, deleteTask } from './task.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All task routes are protected
router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
