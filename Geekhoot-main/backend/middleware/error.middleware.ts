import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  errors?: any;
  constructor(message: string, statusCode: number, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let validationErrors: Record<string, string> | null = null;

  // Handles Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    const formatted: Record<string, string> = {};
    err.issues.forEach((subErr) => {
      const path = subErr.path.join('.');
      formatted[path] = subErr.message;
    });
    validationErrors = formatted;
  }

  // Handles Prisma known constraint errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    statusCode = 400;
    if (err.code === 'P2002') {
      const target = err.meta?.target;
      message = `Unique constraint failed: A record already exists with those details (${target ? String(target) : 'unique fields'}).`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'The requested record resources could not be found.';
    } else {
      message = `Database constraint violation [${err.code}]: Please check your input parameters.`;
    }
  }

  // Structured Logging
  const timestamp = new Date().toISOString();
  if (statusCode >= 500) {
    console.error(`[${timestamp}] ❌ SERVER ERROR 5xx | Route: ${req.method} ${req.path}`);
    console.error(`Message: ${message}`);
    console.error(err.stack || err);
  } else {
    console.warn(`[${timestamp}] ⚠️ CLIENT WARN 4xx | Route: ${req.method} ${req.path} | Status: ${statusCode} | Message: ${message}`);
    if (validationErrors) {
      console.warn('Validation details:', JSON.stringify(validationErrors, null, 2));
    }
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    errors: validationErrors || err.issues || err.errors || null,
    timestamp,
    path: req.path,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

