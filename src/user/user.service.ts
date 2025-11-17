import { Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { CreateUser, FindByEmail } from './usecases';
import type { User } from './user.entity';
import type { CreatedUserResponse, UserCreateDto } from './user.types';

@Injectable()
export class UserService {
	constructor(
		private createUserUsecase: CreateUser,
		private findByEmailUsecase: FindByEmail,
	) {}

	async createUser(args: UserCreateDto): Promise<CreatedUserResponse> {
		return await this.createUserUsecase.execute(args);
	}

	async findByEmail(email: string): Promise<User> {
		return await this.findByEmailUsecase.execute(email);
	}
}
