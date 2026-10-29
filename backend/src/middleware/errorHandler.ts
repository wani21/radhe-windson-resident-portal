import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedIssues = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input data',
        details: formattedIssues,
      },
    });
    return;
  }

  // 2. Custom Application Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // 3. MongoDB Duplicate Key (E11000)
  if (err.name === 'MongoServerError' && err.code === 11000) {
    const duplicatedFields = Object.keys(err.keyPattern || {});
    const fieldName = duplicatedFields[0] || 'record';
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY_ERROR',
        message: `A record with this ${fieldName} already exists.`,
        details: err.keyValue,
      },
    });
    return;
  }

  // 4. Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_IDENTIFIER',
        message: `Invalid format for identifier: ${err.value}`,
      },
    });
    return;
  }

  // 5. Default Unhandled Server Error
  console.error('Unhandled Server Error:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred. Please contact society administration.'
        : err.message || 'Internal server error',
      ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};
