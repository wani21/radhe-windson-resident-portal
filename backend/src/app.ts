import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { corsOptions } from './config/cors';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './utils/errors';
import { sendSuccess } from './utils/response';
import { authRoutes } from './modules/auth/auth.routes';
import { societyRoutes } from './modules/society/society.routes';
import { buildingRoutes } from './modules/buildings/building.routes';
import { flatRoutes } from './modules/flats/flat.routes';
import { residentRoutes, flatResidentsRoutes } from './modules/residents/resident.routes';

export const createApp = (): express.Application => {
  const app = express();

  // 1. Security Headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // 2. CORS with Credentials
  app.use(cors(corsOptions));

  // 3. Body Parsing & Cookies
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // 4. Rate Limiting (Applied across all API endpoints)
  app.use('/api', globalLimiter);

  // 5. System Health Check Endpoint
  app.get('/api/v1/health', async (req: Request, res: Response, next) => {
    try {
      const dbState = mongoose.connection.readyState;
      const isDbConnected = dbState === 1;

      const healthData = {
        status: isDbConnected ? 'UP' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
          readyState: dbState,
        },
      };

      sendSuccess(res, healthData, isDbConnected ? 200 : 503, 'System health report');
    } catch (err) {
      next(err);
    }
  });

  // 6. Root API Information
  app.get('/api/v1', (req: Request, res: Response) => {
    sendSuccess(res, {
      name: 'Radhe Windson Society ERP API',
      version: '1.0.0',
      status: 'operational',
    }, 200, 'Welcome to Radhe Windson Society ERP API');
  });

  // 7. API Modules
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/society', societyRoutes);
  app.use('/api/v1/buildings', buildingRoutes);
  app.use('/api/v1/flats', flatRoutes);
  app.use('/api/v1/flats', flatResidentsRoutes);
  app.use('/api/v1/residents', residentRoutes);
  // app.use('/api/v1/visitors', visitorRoutes);
  // app.use('/api/v1/complaints', complaintRoutes);
  // app.use('/api/v1/maintenance', maintenanceRoutes);
  // app.use('/api/v1/notices', noticeRoutes);
  // app.use('/api/v1/dashboard', dashboardRoutes);

  // 7. Catch-all for undefined routes
  app.use((req: Request, res: Response, next) => {
    next(new NotFoundError(`Resource not found: ${req.method} ${req.originalUrl}`));
  });

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
};
