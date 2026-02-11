import { Router } from 'express';
import { register, login, getMe } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, async (req, res, next) => {
    const { getUsers } = await import('./auth.controller');
    await getUsers(req, res);
});

export default router;
