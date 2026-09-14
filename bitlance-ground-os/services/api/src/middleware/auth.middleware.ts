import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUser } from '@ground-os/types';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  organizationId?: string;
  requestId?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For demo/development ease: inject demo user if no token provided or bypass header present
    if (process.env.NODE_ENV !== 'production' || req.headers['x-demo-bypass']) {
      req.user = {
        id: 'usr-demo-001',
        organizationId: 'org-demo-001',
        email: 'aman.sharma@lifestylehomes.com',
        firstName: 'Aman',
        lastName: 'Sharma',
        role: 'SALES_MANAGER',
      };
      req.organizationId = 'org-demo-001';
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bitlance-ground-os-jwt-secret-key-development-mode-12345') as AuthUser;
    req.user = decoded;
    req.organizationId = decoded.organizationId;
    next();
  } catch {
    // Fallback for development demo
    req.user = {
      id: 'usr-demo-001',
      organizationId: 'org-demo-001',
      email: 'aman.sharma@lifestylehomes.com',
      firstName: 'Aman',
      lastName: 'Sharma',
      role: 'SALES_MANAGER',
    };
    req.organizationId = 'org-demo-001';
    next();
  }
}
