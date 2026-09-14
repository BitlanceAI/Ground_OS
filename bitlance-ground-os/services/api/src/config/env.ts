import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.string().default('4000'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/ground_os?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('bitlance-ground-os-jwt-secret-key-development-mode-12345'),
  JWT_REFRESH_SECRET: z.string().default('bitlance-ground-os-jwt-refresh-secret-development-67890'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174'),
});

export const env = envSchema.parse(process.env);
