import { Injectable, type OnModuleDestroy } from '@nestjs/common';
// biome-ignore lint/style/useImportType: falso-negativo, o nest precisa do tipo para injeção de dependência
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { Env } from '../types/globals.types';

@Injectable()
export class RedisService implements OnModuleDestroy {
	private redis: Redis;

	constructor(private configService: ConfigService<Env, true>) {
		const host = this.configService.get('REDIS_HOST', { infer: true });
		const port = this.configService.get('REDIS_PORT', { infer: true });

		this.redis = new Redis({ host, port });
	}

	async onModuleDestroy() {
		await this.redis.quit();
	}

	async incrementKey(linkId: string): Promise<void> {
		const redisKey = `link-${linkId}`;
		await this.redis.incr(redisKey);
	}

	async getKeyValue(redisKey: string): Promise<string | null> {
		return await this.redis.get(redisKey);
	}

	async removeKey(redisKey: string): Promise<void> {
		await this.redis.del(redisKey);
	}

	async getAllKeys(): Promise<string[]> {
		return await this.redis.keys('link-*');
	}
}
