import { Router } from 'express';
import { uploadFiles, deleteFile, getFile } from './file.controller';
import { authenticate } from '../../middleware/auth';
import { upload } from '../../middleware/upload';

const router = Router();

router.use(authenticate);

router.post('/upload', upload.array('files', 5), uploadFiles);
router.delete('/:id', deleteFile);
router.get('/:id/download', getFile);

export default router;
