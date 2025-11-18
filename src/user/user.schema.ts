import { z } from 'zod';

export const UserCreateSchema = z.object({
	name: z.string().max(100).optional(),
	email: z.email().trim().max(150),
	password: z.string().min(6).max(50),
});
