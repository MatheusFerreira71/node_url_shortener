import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ZodExceptionFilter } from './common/filters';
import { configureZod } from './config/zod.config';
import type { Env } from './types/globals.types';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get<ConfigService<Env, true>>(ConfigService);
	const port = configService.get('PORT', { infer: true });

	configureZod();

	app.use(helmet());

	app.useGlobalFilters(new ZodExceptionFilter());
	app.enableShutdownHooks();
	await app.listen(port);
}
bootstrap();
