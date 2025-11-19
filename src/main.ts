import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as packageJson from '../package.json';
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

	// Configuração do Swagger
	const config = new DocumentBuilder()
		.setTitle('URL Shortener API')
		.setDescription(packageJson.description)
		.setVersion(packageJson.version)
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/docs', app, document);

	app.enableShutdownHooks();
	await app.listen(port);
}
bootstrap();
