import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import dotenv from 'dotenv';
import prisma from './utils/prisma';

// Suppress dotenv logs by setting the environment variable before import if possible, 
// or use the specific configuration for the library version.
// Based on logs, this is likely dotenvx or a version that supports quiet/debug options.
// Trying to set DOTENV_KEY to blank or using quiet option if available.
dotenv.config({ path: '.env', quiet: true } as any);

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

export { io };

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('Database connected successfully');

        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server', error);
        process.exit(1);
    }
};

startServer();
