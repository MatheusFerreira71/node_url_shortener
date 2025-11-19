import type z from 'zod';
import type { EnvSchema } from '../schemas';

export type Env = z.infer<typeof EnvSchema>;
