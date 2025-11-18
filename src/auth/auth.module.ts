import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Login } from './usecases';

@Module({
	controllers: [AuthController],
	providers: [AuthService, Login],
	imports: [UserModule, CommonModule],
})
export class AuthModule {}
