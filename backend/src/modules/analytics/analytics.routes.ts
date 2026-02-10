import { Router } from 'express';
import { getTaskStats, getTaskTrends } from './analytics.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getTaskStats);
router.get('/trends', getTaskTrends);

export default router;
