import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export function tenantMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const tenantId = req.user?.organizationId;
  if (!tenantId) {
    return res.status(403).json({ error: 'Forbidden: No organization assigned' });
  }
  req.organizationId = tenantId;
  next();
}
