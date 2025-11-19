import type { z } from 'zod';
import type { LoginSchema } from './auth.schema';

export type LoginDto = z.infer<typeof LoginSchema>;
export type LoginResponse = {
	access_token: string;
	expires_at: Date;
};
export type JwtPayload = {
	sub: string;
};
