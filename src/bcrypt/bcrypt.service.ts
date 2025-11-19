import { Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { Env } from '../types/globals.types';

@Injectable()
export class BcryptService {
	constructor(private configService: ConfigService<Env, true>) {}

	async hash(password: string): Promise<string> {
		return bcrypt.hash(
			password,
			this.configService.get('BCRYPT_SALT_ROUNDS', { infer: true }),
		);
	}

	async compare(password: string, hash: string): Promise<boolean> {
		return bcrypt.compare(password, hash);
	}
}
