import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../utils/prisma';
import fs from 'fs';
import path from 'path';

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
            filename: file.filename,
            path: file.path,
            mimeType: file.mimetype,
            size: file.size,
            taskId: taskId
        }));

        await prisma.file.createMany({ data: filesData });

        res.status(201).json({ message: 'Files uploaded successfully', count: filesData.length });
    } catch (error) {
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

        // Check if user has access to the task associated with the file
        // For now, assuming if they can see the task they can delete files? Or maybe just task owner.
        // Let's restrict to task owner for safety.
        const task = await prisma.task.findUnique({ where: { id: file.taskId } });
        if (!task || task.userId !== req.user.id) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        // Delete from filesystem
        fs.unlink(file.path, (err) => {
            if (err) console.error('Failed to delete file from disk:', err);
        });

        await prisma.file.delete({ where: { id: String(id) } });
        res.json({ message: 'File deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getFile = async (req: AuthRequest, res: Response): Promise<void> => {
    // Basic download/view
    try {
        const { id } = req.params;
        const file = await prisma.file.findUnique({ where: { id: String(id) } });
        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }
        res.download(file.path, file.originalName);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
