import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BcryptModule } from './bcrypt/bcrypt.module';
import { jwtRegisterConfig, typeOrmConfig, validateEnv } from './config';
import { HealthModule } from './health/health.module';
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
		HealthModule,
		UserModule,
		AuthModule,
		BcryptModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
