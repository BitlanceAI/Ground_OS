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
        { expiresIn: '7d' as any }
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
      return res.status(500).json({ message: 'Database error' });
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

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid user' });

    const accessToken = jwt.sign(
      { sub: user.id, orgId: user.organizationId, role: user.role },
      secret,
      { expiresIn: '7d' as any }
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
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const organization = await prisma.organization.findUnique({ where: { id: user.organizationId } });

  return res.json({
    user,
    organization,
  });
});

export default router;
