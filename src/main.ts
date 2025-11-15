import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { Env } from './config/env.config';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get<ConfigService<Env, true>>(ConfigService);
	const port = configService.get('PORT', { infer: true });
	await app.listen(port);
}
bootstrap();
