import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/radhe_windson_erp'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long for security'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  INITIAL_ADMIN_NAME: z.string().optional().default('Radhe Windson Administrator'),
  INITIAL_ADMIN_EMAIL: z.string().email().optional().default('admin@radhewindson.local'),
  INITIAL_ADMIN_PASSWORD: z.string().min(10).optional().default('Admin@RadheWindson2026!'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment configuration validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
export type Environment = typeof env;
