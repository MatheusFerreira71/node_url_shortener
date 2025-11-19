import {
	type MiddlewareConsumer,
	Module,
	type NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BcryptModule } from './bcrypt/bcrypt.module';
import { LogMiddleware } from './common/middlewares';
import { jwtRegisterConfig, typeOrmConfig, validateEnv } from './config';
import { HealthModule } from './health/health.module';
import { LinkModule } from './link/link.module';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './user/user.module';

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
		JwtModule.registerAsync({
			global: true,
			inject: [ConfigService],
			useFactory: jwtRegisterConfig,
		}),
		ScheduleModule.forRoot(),
		HealthModule,
		UserModule,
		AuthModule,
		BcryptModule,
		RedisModule,
		LinkModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LogMiddleware).exclude('health/*path').forRoutes('*');
	}
}
