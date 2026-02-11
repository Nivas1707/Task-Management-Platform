import { Router } from 'express';
import { createComment, getTaskComments, deleteComment } from './comment.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createComment);
router.get('/task/:taskId', getTaskComments);
router.put('/:id', authenticate, async (req, res, next) => {
    const { updateComment } = await import('./comment.controller');
    await updateComment(req, res);
});
router.delete('/:id', deleteComment);

export default router;
