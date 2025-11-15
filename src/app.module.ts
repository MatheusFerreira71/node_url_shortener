import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig, validateEnv } from './config';
import { HealthModule } from './health/health.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validate: validateEnv,
			envFilePath: `.env`,
		}),
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: typeOrmConfig,
		}),
		HealthModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule { }
