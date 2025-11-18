import { z } from 'zod';

export const EnvSchema = z.object({
	DB_HOST: z.string(),
	DB_PORT: z.coerce.number(),
	DB_USER: z.string(),
	DB_PASS: z.string(),
	DB_NAME: z.string(),
	PORT: z.coerce.number().default(3000),
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
	JWT_SECRET_KEY: z.string().min(32),
	REDIS_HOST: z.string(),
	REDIS_PORT: z.coerce.number().default(6379),
});

export type Env = z.infer<typeof EnvSchema>;
