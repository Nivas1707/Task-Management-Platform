import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import authRoutes from './modules/auth/auth.routes';
import taskRoutes from './modules/tasks/task.routes';
import commentRoutes from './modules/comments/comment.routes';
import fileRoutes from './modules/files/file.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

const app: Application = express();

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Swagger Document
const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'swagger.yaml'));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// app.use(express.static('uploads')); // Removed: Files are now stored in MongoDB
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(limiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to the Task Management System API' });
});

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

export default app;
