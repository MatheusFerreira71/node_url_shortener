import { z } from 'zod';

export const LoginSchema = z.object({
	email: z.email().trim().max(150),
	password: z.string().min(6).max(50),
});
