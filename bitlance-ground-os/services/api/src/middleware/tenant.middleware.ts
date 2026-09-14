import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export function tenantMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const tenantId = (req.headers['x-tenant-id'] as string) || req.user?.organizationId || 'org-demo-001';
  req.organizationId = tenantId;
  next();
}
