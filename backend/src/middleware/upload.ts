import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB limit for MongoDB document size safety
});
