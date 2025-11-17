import type { z } from 'zod';
import type { User } from './user.entity';
import type { UserCreateSchema } from './user.schema';

export type UserCreateDto = z.infer<typeof UserCreateSchema>;
export type CreatedUserResponse = Pick<
	User,
	'id' | 'name' | 'email' | 'created_at'
>;
