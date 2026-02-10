import { Router } from 'express';
import { createComment, getTaskComments, deleteComment } from './comment.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createComment);
router.get('/task/:taskId', getTaskComments);
router.delete('/:id', deleteComment);

export default router;
