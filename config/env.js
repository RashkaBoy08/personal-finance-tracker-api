require('dotenv').config();

const { z } = require('zod');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().regex(/^\d+[smhdwy]$/, 'JWT_EXPIRES_IN must be a duration such as 1d').default('1d'),
    PUBLIC_API_URL: z.string().url().optional().or(z.literal('')),
    CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),
    CLOUDINARY_CLOUD_NAME: z.string().optional().or(z.literal('')),
    CLOUDINARY_API_KEY: z.string().optional().or(z.literal('')),
    CLOUDINARY_API_SECRET: z.string().optional().or(z.literal('')),
    ADMIN_EMAIL: z.string().email().optional().or(z.literal('')),
    ADMIN_PASSWORD: z.string().min(8).optional().or(z.literal('')),
  })
  .superRefine((env, context) => {
    if (Boolean(env.ADMIN_EMAIL) !== Boolean(env.ADMIN_PASSWORD)) {
      context.addIssue({
        code: 'custom',
        message: 'ADMIN_EMAIL and ADMIN_PASSWORD must be set together',
        path: ['ADMIN_EMAIL'],
      });
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:', parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

const env = {
  ...parsedEnv.data,
  CORS_ORIGINS: parsedEnv.data.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  cloudinaryConfigured: Boolean(
    parsedEnv.data.CLOUDINARY_CLOUD_NAME &&
      parsedEnv.data.CLOUDINARY_API_KEY &&
      parsedEnv.data.CLOUDINARY_API_SECRET,
  ),
};

module.exports = { env };
