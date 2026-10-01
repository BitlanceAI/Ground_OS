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
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bitlance-ground-os-jwt-secret-key-development-mode-12345') as AuthUser;
    req.user = decoded;
    req.organizationId = decoded.organizationId;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
