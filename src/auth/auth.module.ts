import { Module } from '@nestjs/common';
import { BcryptModule } from '../bcrypt/bcrypt.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginUsecase } from './usecases';

@Module({
	controllers: [AuthController],
	providers: [AuthService, LoginUsecase],
	imports: [UserModule, BcryptModule],
})
export class AuthModule {}
