import { EnvSchema } from '../schemas';

export function validateEnv(config: Record<string, false>) {
	return EnvSchema.parse(config);
}
