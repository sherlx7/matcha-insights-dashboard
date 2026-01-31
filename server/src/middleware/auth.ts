import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db/client.js';

const JWT_SECRET = process.env.JWT_SECRET || 'matsu-matcha-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string; // ADMIN or VIEWER
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Generate JWT token for a user
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

/**
 * Authentication middleware - requires valid JWT
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Fetch full user from database
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  next();
}

/**
 * Optional authentication - attaches user if token present
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (decoded) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, role: true },
      });
      if (user) {
        req.user = user;
      }
    }
  }

  next();
}

/**
 * Admin-only middleware
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

/**
 * Rate limiting store (in-memory, use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiting middleware for auth endpoints
 */
export function rateLimit(maxRequests: number = 5, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    const record = rateLimitStore.get(key);
    
    if (!record || record.resetAt < now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter,
      });
    }

    record.count++;
    next();
  };
}
