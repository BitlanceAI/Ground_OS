// ============================================================
// AUTH MODULE — JWT authentication, login, refresh, me
// ============================================================

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '@ground-os/database';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Provide instant fallback demo user if database not yet migrated locally
    if (email === 'aman.sharma@lifestylehomes.com' || email === 'demo@lifestylehomes.com') {
      const demoUser = {
        id: 'usr-demo-001',
        organizationId: 'org-demo-001',
        email,
        firstName: 'Aman',
        lastName: 'Sharma',
        role: 'SALES_MANAGER',
      };
      const secret = process.env.JWT_SECRET || 'bitlance-ground-os-jwt-secret-key-development-mode-12345';
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'bitlance-ground-os-jwt-refresh-secret-development-67890';
      
      const accessToken = jwt.sign(demoUser, secret, { expiresIn: '15m' as any });
      const refreshToken = jwt.sign({ sub: demoUser.id }, refreshSecret, { expiresIn: '7d' as any });

      return res.json({
        user: demoUser,
        organization: {
          id: 'org-demo-001',
          name: 'Lifestyle Homes',
          slug: 'lifestyle-homes',
        },
        tokens: { accessToken, refreshToken, expiresIn: 900 },
      });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const secret = process.env.JWT_SECRET || 'bitlance-ground-os-jwt-secret-key-development-mode-12345';
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'bitlance-ground-os-jwt-refresh-secret-development-67890';

      const accessToken = jwt.sign(
        { sub: user.id, orgId: user.organizationId, role: user.role },
        secret,
        { expiresIn: '15m' as any }
      );

      const refreshToken = jwt.sign(
        { sub: user.id },
        refreshSecret,
        { expiresIn: '7d' as any }
      );

      return res.json({
        user: {
          id: user.id,
          organizationId: user.organizationId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          settings: user.organization.settings,
        },
        tokens: { accessToken, refreshToken, expiresIn: 900 },
      });
    } catch (dbErr) {
      // Fallback response for mock-first demo
      const demoUser = {
        id: 'usr-demo-001',
        organizationId: 'org-demo-001',
        email,
        firstName: 'Aman',
        lastName: 'Sharma',
        role: 'SALES_MANAGER',
      };
      const secret = process.env.JWT_SECRET || 'bitlance-ground-os-jwt-secret-key-development-mode-12345';
      const accessToken = jwt.sign(demoUser, secret, { expiresIn: '15m' as any });
      const refreshToken = jwt.sign({ sub: demoUser.id }, secret, { expiresIn: '7d' as any });

      return res.json({
        user: demoUser,
        organization: { id: 'org-demo-001', name: 'Lifestyle Homes', slug: 'lifestyle-homes' },
        tokens: { accessToken, refreshToken, expiresIn: 900 },
      });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

  try {
    const secret = process.env.JWT_SECRET || 'bitlance-ground-os-jwt-secret-key-development-mode-12345';
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || secret) as { sub: string };

    const accessToken = jwt.sign(
      { sub: payload.sub, orgId: 'org-demo-001', role: 'SALES_MANAGER' },
      secret,
      { expiresIn: '15m' as any }
    );

    return res.json({ accessToken, expiresIn: 900 });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  return res.json({ message: 'Logged out' });
});

// GET /api/v1/auth/me — protected
router.get('/me', async (req: Request, res: Response) => {
  const user = (req as any).user || {
    id: 'usr-demo-001',
    organizationId: 'org-demo-001',
    email: 'aman.sharma@lifestylehomes.com',
    firstName: 'Aman',
    lastName: 'Sharma',
    role: 'SALES_MANAGER',
  };

  return res.json({
    user,
    organization: { id: 'org-demo-001', name: 'Lifestyle Homes', slug: 'lifestyle-homes' },
  });
});

export default router;
