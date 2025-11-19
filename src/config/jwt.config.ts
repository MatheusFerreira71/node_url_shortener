import type { ConfigService } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';
import type { Env } from '../types/globals.types';

export const jwtRegisterConfig = (
	config: ConfigService<Env, true>,
): JwtModuleOptions => ({
	secret: config.get('JWT_SECRET_KEY', { infer: true }),
	signOptions: { expiresIn: '1h' },
});
