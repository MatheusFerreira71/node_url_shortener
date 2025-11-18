import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { CreateUser, FindByEmail } from './usecases';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { UserService } from './user.service';

@Module({
	imports: [TypeOrmModule.forFeature([User]), CommonModule],
	controllers: [UserController],
	providers: [UserService, CreateUser, FindByEmail],
	exports: [UserService],
})
export class UserModule {}
