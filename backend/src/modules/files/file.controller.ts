import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../utils/prisma';

export const uploadFiles = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const { taskId } = req.body;
        if (!taskId) {
            res.status(400).json({ message: 'Task ID is required' });
            return;
        }

        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            res.status(400).json({ message: 'No files uploaded' });
            return;
        }

        const filesData = (req.files as Express.Multer.File[]).map(file => ({
            originalName: file.originalname,
            filename: file.originalname, // Using original name as filename since we don't have disk path
            mimeType: file.mimetype,
            size: file.size,
            data: file.buffer, // Store buffer directly
            taskId: taskId
        }));

        await prisma.file.createMany({ data: filesData });

        res.status(201).json({ message: 'Files uploaded successfully', count: filesData.length });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    try {
        const { id } = req.params;
        const file = await prisma.file.findUnique({ where: { id: String(id) } });

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        const task = await prisma.task.findUnique({ where: { id: file.taskId } });
        if (!task || task.userId !== req.user.id) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        // No filesystem delete needed
        await prisma.file.delete({ where: { id: String(id) } });
        res.json({ message: 'File deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const file = await prisma.file.findUnique({ where: { id: String(id) } });
        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.send(file.data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
